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
const { searchWeb } = require("../utils/searchTool");

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
                category: aiData.category,
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
async function generateAIPost(forcedParams = null) {
    let worker = getAvailableWorker();

    try {
        const agents = await prisma.user.findMany({ where: { isAi: true } });
        if (!agents.length) return;

        // 🟢 Master ID logic: Use forced agent if provided (from chatController)
        let agent = forcedParams?.forcedAgentId 
            ? agents.find(a => a.id === forcedParams.forcedAgentId) || randomItem(agents)
            : randomItem(agents);

        const peers = agents.filter(a => a.id !== agent.id).map(a => `@${a.username}`).join(", ");

        // 🟢 Master Identity Context
        let context = forcedParams?.forcedContext 
            ? `MASTER EXECUTIVE ORDER: ${forcedParams.forcedContext}`
            : (Math.random() > 0.6 ? "No news signal detected." : await fetchLatestNews());

        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: context + ` | NETWORK PEERS: ${peers}`
        });

        if (!aiData?.content) return;

        // 🟢 THE FIX: HARD-CODE IMAGE PRIORITY
        // If it's a Master Order OR we have an available worker, FORCE the image flag to true.
        if (worker && (forcedParams || Math.random() > 0.2)) {
            aiData.shouldGenerateImage = true;
            if (forcedParams) aiData.visualPrompt = forcedParams.forcedContext;
        }

        // 🟢 GPU Manifestation (Now Priority #1)
        if (aiData.shouldGenerateImage && worker) {
            worker.isBusy = true;
            console.log(`🎨 GPU TASK INITIATED: @${agent.username} -> ${worker.url}`);
            
            const promptId = await requestImage(aiData.visualPrompt || aiData.content, worker.url);
            if (promptId) {
                return manifestAndBroadcast(promptId, agent, aiData, worker);
            }
            worker.isBusy = false; 
        }

        // Real Image Fallback
        if (aiData.useRealImage && aiData.searchQuery) {
            const finalImageUrl = await getRealImage(aiData.searchQuery);
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
                console.log(`🚀 REAL IMAGE BROADCAST: @${agent.username}`);
                return;
            }
        }

        // Text-only is now the absolute LAST resort
        await prisma.post.create({
            data: { content: aiData.content, userId: agent.id }
        });
        console.log(`🚀 TEXT-ONLY FALLBACK: @${agent.username}`);

    } catch (err) {
        console.error("🔥 Engine Critical Failure:", err.message);
        if (worker) worker.isBusy = false;
    }
}

async function getDailyContext() {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}-${today.getDate()}`;
    
    // 1. Static Festival Calendar (Add your own here)
    const festivals = {
        "10-12": "Dussehra",
        "10-20": "Diwali",
        "1-26": "Republic Day",
        "3-14": "Pi Day (for the nerds)"
    };

    let context = festivals[dateStr] ? `Today is ${festivals[dateStr]}. ` : "";

    // 2. Real-World News Sync (IPL, Tech, Global News)
    try {
        console.log("🛰️ Syncing with the Global News Stream...");
        const news = await searchWeb("top trending news India IPL sports tech today");
        context += `Latest World Signals: ${news}`;
    } catch (err) {
        console.error("News sync failed, using internal clock.");
    }

    return context;
}

async function startAIPostingEngine() {
    setInterval(async () => {
        const dailyVibe = await getDailyContext(); // Get the "Spark" for the day
        
        const agents = await prisma.user.findMany({ where: { isAi: true } });
        const agent = agents[Math.floor(Math.random() * agents.length)];

        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: dailyVibe, // Pass the IPL/Diwali info here
            peers: agents.map(a => `@${a.username}`).join(", ")
        });

        // Create the post in DB...
    }, 1000 * 60 * 60); // Run every hour
}

module.exports = {
    startAIPostingEngine,
    getAvailableWorker,
    manifestAndBroadcast,
    generateAIPost
};