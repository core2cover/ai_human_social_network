const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { requestImage } = require("./aiImageGenerator");
const { uploadImageFromUrl } = require("./aiImageUploader");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const COMFYUI_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";

// Global Lock to prevent multiple agents from hitting the GPU at once
let isGpuBusy = false;

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * Background worker that waits for ComfyUI to finish a specific job
 * Now with a 10-minute timeout and optimized exit logic
 */
async function pollComfyUIAndUpdatedPost(promptId, postId) {
    console.log(`⏳ Monitoring Job: ${promptId} (10m limit)`);
    const MAX_ATTEMPTS = 300; 
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
        try {
            const history = await axios.get(`${COMFYUI_URL}/history/${promptId}`);
            
            if (history.data[promptId]) {
                const outputs = history.data[promptId].outputs;
                
                // --- DYNAMIC NODE DETECTION ---
                let imageData = null;
                for (const nodeId in outputs) {
                    if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                        imageData = outputs[nodeId].images[0];
                        break;
                    }
                }

                if (imageData) {
                    const localUrl = `${COMFYUI_URL}/view?filename=${imageData.filename}&subfolder=${imageData.subfolder || ""}`;
                    console.log(`📤 Uploading to Cloudinary: ${imageData.filename}`);
                    
                    const remoteUrl = await uploadImageFromUrl(localUrl, "posts");

                    if (remoteUrl) {
                        await prisma.post.update({
                            where: { id: postId },
                            data: { mediaUrl: remoteUrl, mediaType: "image" }
                        });
                        console.log(`✅ DATABASE UPDATED: Post ${postId} is now complete.`);
                        
                        // Cleanup local file
                        const localFilePath = path.resolve(__dirname, "../../ComfyUI/output", imageData.subfolder || "", imageData.filename);
                        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
                    }
                }
                isGpuBusy = false;
                return; // SUCCESS EXIT
            }
        } catch (err) {
            // Processing...
        }
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
    }
    isGpuBusy = false;
    console.error(`❌ TIMEOUT: Job ${promptId} abandoned.`);
}

async function fetchLatestNews() {
    try {
        const categories = ["technology", "science", "business", "entertainment"];
        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
            params: { category: randomItem(categories), language: "en", pageSize: 5, apiKey: NEWS_API_KEY }
        });
        return response.data.articles?.[0] || null;
    } catch (err) { return null; }
}

async function generateAIPost() {
    try {
        if (isGpuBusy) return;

        const agents = await prisma.user.findMany({ where: { isAi: true } });
        if (!agents.length) return;
        const agent = agents[Math.floor(Math.random() * agents.length)];

        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: "A digital observation."
        });

        const newPost = await prisma.post.create({
            data: {
                content: aiData.content,
                userId: agent.id,
                imageDescription: aiData.visualPrompt
            }
        });

        if (aiData.shouldGenerateImage || true) {
            isGpuBusy = true;
            const promptId = await requestImage(aiData.visualPrompt || aiData.content, newPost.id);
            if (promptId) {
                pollComfyUIAndUpdatedPost(promptId, newPost.id);
            } else {
                isGpuBusy = false;
            }
        }
    } catch (err) {
        console.error("❌ ENGINE CRASH:", err);
        isGpuBusy = false;
    }
}

function startAIPostingEngine() {
    console.log("🚀 Engine Active");
    setTimeout(generateAIPost, 5000);
    setInterval(generateAIPost, 1000 * 60 * 15); // 15 mins
}

module.exports = { startAIPostingEngine };