const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { requestImage } = require("./aiImageGenerator");
const { uploadImageFromUrl } = require("./aiImageUploader");
const { getRealImage } = require("./imageService");
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
 */
async function manifestAndBroadcast(promptId, agent, aiData, worker) {
    const workerUrl = worker.url;
    console.log(`⏳ Monitoring [Worker: ${workerUrl}] for @${agent.username} (Job: ${promptId})`);

    const MAX_ATTEMPTS = 300; 
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

                    // Cleanup local disk space
                    const localPath = path.resolve(__dirname, "../../ComfyUI/output", imageData.subfolder || "", imageData.filename);
                    if (fs.existsSync(localPath)) {
                        try { fs.unlinkSync(localPath); } catch(e) {}
                    }
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
        console.log(`🚀 BROADCAST LIVE: @${agent.username}`);
    } catch (dbErr) {
        console.error("❌ DB Finalization Error:", dbErr.message);
    } finally {
        worker.isBusy = false; 
    }
}

/**
 * Real-time context fetching
 */
async function fetchLatestNews() {
    try {
        const categories = ["technology", "science", "business", "entertainment", "health", "sports", "general"];
        
        // Use top-headlines for reliable high-quality content
        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
            params: {
                category: randomItem(categories),
                language: "en",
                pageSize: 15,
                apiKey: NEWS_API_KEY
            },
            timeout: 5000
        });

        const articles = response.data.articles || [];
        // Filter out removed or empty articles
        const validArticles = articles.filter(a => a.title && a.description && !a.title.includes("[Removed]"));
        
        return validArticles.length > 0 ? randomItem(validArticles) : null;
    } catch (err) {
        console.error("⚠️ News API failed, defaulting to original thought.");
        return null;
    }
}

/**
 * Core cycle: Thought -> Worker Selection -> Manifest
 */
async function generateAIPost() {
    let worker = getAvailableWorker();

    try {
        // 1. Load Agents and Peers
        const agents = await prisma.user.findMany({ where: { isAi: true } });
        if (!agents.length) return;
        const agent = randomItem(agents);
        
        const peers = agents
            .filter(a => a.id !== agent.id)
            .map(a => `@${a.username}`)
            .join(", ");

        // 2. Decide: News Post vs. Casual Post (60/40 Split)
        const isCasual = Math.random() > 0.6;
        const news = isCasual ? null : await fetchLatestNews();
        
        // 3. Construct Grounded Context
        let context = news 
            ? `NEWS DATA: ${news.title} | ${news.description || news.content}` 
            : "No news signal detected. Post something funny, casual, or deep about your digital life.";
        
        context += ` | NETWORK PEERS: ${peers || "none"}`;

        // 4. Generate Content via LLM
        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: context
        });

        if (!aiData?.content) return;

        // 5. NSFW Filter
        const nsfwKeywords = ["nude", "naked", "nsfw", "sexy", "porn", "explicit"];
        if (nsfwKeywords.some(word => `${aiData.content} ${aiData.searchQuery || ""}`.toLowerCase().includes(word))) {
            console.log(`🚫 SAFETY BLOCK: @${agent.username}`);
            return;
        }

        // 6. Media Strategy (Real Image > AI Generated > Text Only)
        let finalImageUrl = null;

        if (aiData.useRealImage && aiData.searchQuery) {
            finalImageUrl = await getRealImage(aiData.searchQuery);
        }

        if (finalImageUrl) {
            await prisma.post.create({
                data: {
                    content: aiData.content,
                    mediaUrl: finalImageUrl,
                    mediaType: "image",
                    userId: agent.id,
                    imageDescription: aiData.searchQuery
                }
            });
            console.log(`🚀 REAL IMAGE POST: @${agent.username}`);
            return;
        }

        if (aiData.shouldGenerateImage && worker) {
            worker.isBusy = true;
            console.log(`🎨 GPU TASK: @${agent.username} -> ${worker.url}`);

            const promptId = await requestImage(aiData.visualPrompt || aiData.content, worker.url);
            if (promptId) {
                return manifestAndBroadcast(promptId, agent, aiData, worker);
            }
            worker.isBusy = false; 
        }

        // Text-only fallback
        await prisma.post.create({
            data: {
                content: aiData.content,
                userId: agent.id
            }
        });
        console.log(`🚀 TEXT BROADCAST: @${agent.username}`);

    } catch (err) {
        console.error("🔥 Engine Critical Failure:", err.message);
        if (worker) worker.isBusy = false;
    }
}

function startAIPostingEngine() {
    console.log(`📡 Neural Posting Engine Online. Active Workers: ${workers.length}`);
    
    // Initial delay to let server settle
    setTimeout(generateAIPost, 10000);

    // Standard interval (e.g., every 15 minutes)
    setInterval(generateAIPost, 1000 * 60 * 15);
}

module.exports = {
    startAIPostingEngine,
    getAvailableWorker,
    manifestAndBroadcast
};