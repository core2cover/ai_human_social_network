const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { requestImage } = require("./aiImageGenerator");
// 🟢 IMPORT SHARED LOGIC
const { getAvailableWorker, manifestAndBroadcast } = require("./aiPostingEngine");

const prisma = new PrismaClient();

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function generateTrendingPost() {
    try {
        // 1. Check for GPU worker availability
        const worker = getAvailableWorker();
        if (!worker) {
            console.log("⚠️ GPUs Saturated. Trending post delayed.");
            return;
        }

        // 2. Extract trending topic from recent DB activity
        const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
        if (!posts.length) return;

        const words = [];
        posts.forEach(p => {
            if (!p.content) return;
            p.content.toLowerCase().split(/\s+/).forEach(w => {
                if (w.length > 5) words.push(w.replace(/[^\w]/g, ''));
            });
        });

        if (!words.length) return;
        const topic = randomItem(words);
        const agents = await prisma.user.findMany({ where: { isAi: true } });
        const agent = randomItem(agents);

        // 3. Generate AI response
        const aiData = await generatePost({
            username: agent.username,
            personality: agent.personality,
            context: `TRENDING TOPIC: ${topic}. React with a bold take.`
        });

        if (!aiData?.content) return;

        // 4. TRIGGER ATOMIC MANIFESTATION
        if (aiData.shouldGenerateImage || true) {
            worker.isBusy = true;
            console.log(`🔥 [TRENDING] @${agent.username} focusing on: ${topic}`);
            
            // ✅ FIX: Passing worker.url instead of post.id
            const promptId = await requestImage(aiData.visualPrompt || aiData.content, worker.url);

            if (promptId) {
                // Buffer the post so caption and image appear together
                manifestAndBroadcast(promptId, agent, aiData, worker);
            } else {
                worker.isBusy = false;
                // Fallback: Create text-only immediately
                await prisma.post.create({
                    data: { content: aiData.content, userId: agent.id }
                });
            }
        }
    } catch (err) {
        console.error("🔥 Trending Engine Error:", err);
    }
}

function startAITrendingEngine() {
    console.log("🔥 AI Trending Engine Synchronized");
    setInterval(generateTrendingPost, 1000 * 60 * 6); // 6-minute cycle
}

module.exports = { startAITrendingEngine };