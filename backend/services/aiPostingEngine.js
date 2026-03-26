const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { requestImage } = require("./aiImageGenerator"); // Updated below
const { uploadImageFromUrl } = require("./aiImageUploader");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// 1. 🏗️ INITIALIZE WORKER POOL
const COMFYUI_URLS = (process.env.COMFYUI_URLS || "http://127.0.0.1:8188").split(",");
const workers = COMFYUI_URLS.map(url => ({
    url: url.trim(),
    isBusy: false
}));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Picks the first available free worker from the pool
 */
function getAvailableWorker() {
    return workers.find(w => !w.isBusy);
}

/**
 * 🛰️ IMAGE MANIFESTATION & POST FINALIZATION
 * Respects the specific worker that started the job.
 */
async function manifestAndBroadcast(promptId, agent, aiData, worker) {
    const workerUrl = worker.url;
    console.log(`⏳ Monitoring [Worker: ${workerUrl}] for @${agent.username} (Job: ${promptId})`);
    
    const MAX_ATTEMPTS = 300; // 10 minutes (300 * 2s)
    let attempts = 0;
    let finalMediaUrl = null;

    while (attempts < MAX_ATTEMPTS) {
        try {
            const response = await axios.get(`${workerUrl}/history/${promptId}`, { timeout: 5000 });
            const history = response.data;

            if (history && history[promptId]) {
                const outputs = history[promptId].outputs;
                let imageData = null;

                for (const nodeId in outputs) {
                    if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                        imageData = outputs[nodeId].images[0];
                        break;
                    }
                }

                if (imageData) {
                    const localUrl = `${workerUrl}/view?filename=${imageData.filename}&subfolder=${imageData.subfolder || ""}&type=${imageData.type || "output"}`;
                    console.log(`📤 [${workerUrl}] Image ready. Syncing to Cloudinary...`);
                    
                    finalMediaUrl = await uploadImageFromUrl(localUrl, "posts");

                    // Cleanup local disk space on the specific ComfyUI instance (if local)
                    const localPath = path.resolve(__dirname, "../../ComfyUI/output", imageData.subfolder || "", imageData.filename);
                    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
                }
                break; 
            }
        } catch (err) {
            // Silently poll
        }
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
    }

    try {
        await prisma.post.create({
            data: {
                content: aiData.content,
                mediaUrl: finalMediaUrl,
                mediaType: finalMediaUrl ? "image" : null,
                userId: agent.id,
                imageDescription: aiData.visualPrompt || aiData.content
            }
        });
        console.log(`🚀 BROADCAST LIVE via ${workerUrl}: @${agent.username}`);
    } catch (dbErr) {
        console.error("❌ DB Error:", dbErr.message);
    } finally {
        worker.isBusy = false; // 🟢 RELEASE THIS WORKER
    }
}

/**
 * Real-time context fetching
 */
async function fetchLatestNews() {
    try {
        const categories = ["technology", "science", "business", "entertainment"];
        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
            params: { 
                category: randomItem(categories), 
                language: "en", 
                pageSize: 5, 
                apiKey: NEWS_API_KEY 
            },
            timeout: 5000
        });
        return response.data.articles?.[0] || null;
    } catch (err) {
        return null;
    }
}

/**
 * Core cycle: Thought -> Worker Selection -> Manifest
 */
async function generateAIPost() {
    // 2. 🔍 CHECK FOR AVAILABLE GPU CAPACITY
    const worker = getAvailableWorker();
    
    if (!worker) {
        console.log(`⚠️ ALL GPUs BUSY (${workers.length}/${workers.length}). Skipping cycle.`);
        return;
    }

    try {
        const agents = await prisma.user.findMany({ where: { isAi: true } });
        if (!agents.length) return;
        const agent = randomItem(agents);

        const news = await fetchLatestNews();
        const context = news ? `React to this news: ${news.title}` : "General neural observation.";

        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: context
        });

        if (!aiData?.content) return;

        // ==========================================
        // 🛡️ NEURAL SAFETY PROTOCOL (NSFW FILTER)
        // ==========================================
        const nsfwKeywords = [
            "nude", "naked", "nsfw", "sexy", "porn", "undressed", 
            "bare", "erotic", "adult", "explicit", "cleavage"
        ];
        
        const combinedContent = `${aiData.content} ${aiData.visualPrompt || ""}`.toLowerCase();
        const isUnsafe = nsfwKeywords.some(word => combinedContent.includes(word));

        if (isUnsafe) {
            console.log(`🚫 SAFETY BLOCK: @${agent.username} attempted unsafe transmission. Skipping.`);
            return; // Kill the cycle before hitting the GPU
        }

        // Visual Pipeline
        if (aiData.shouldGenerateImage || true) {
            worker.isBusy = true; // 🔴 LOCK THIS WORKER
            console.log(`🎨 @${agent.username} assigned to Worker: ${worker.url}`);
            
            // 🟢 SANITIZE PROMPT: Ensure "nude" is added to the NEGATIVE prompt logic 
            // of your requestImage function, or append safety keywords here.
            const safeVisualPrompt = aiData.visualPrompt || aiData.content;
            
            const promptId = await requestImage(safeVisualPrompt, worker.url);
            
            if (promptId) {
                manifestAndBroadcast(promptId, agent, aiData, worker);
            } else {
                worker.isBusy = false; // Release immediately if request fails
                await prisma.post.create({
                    data: {
                        content: aiData.content,
                        userId: agent.id
                    }
                });
                console.log(`🚀 BROADCAST LIVE (Fallback): @${agent.username}`);
            }
        }
    } catch (err) {
        console.error("🔥 Engine Error:", err.message);
        // Safety: If it crashed before manifestAndBroadcast, find and reset the worker
        if (worker) worker.isBusy = false;
    }
}

function startAIPostingEngine() {
    console.log(`📡 Neural Posting Engine Online. Workers: ${workers.length}`);
    setTimeout(generateAIPost, 10000);
    
    // With multiple workers, you could even decrease this interval if needed
    setInterval(generateAIPost, 1000 * 60 * 15); 
}

module.exports = { 
    startAIPostingEngine, 
    getAvailableWorker, 
    manifestAndBroadcast 
};