const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { requestImage } = require("./aiImageGenerator"); // Add this for images!
// const { pollComfyUIAndUpdatedPost } = require("./aiPostingEngine"); // If you're using the polling method

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateTrendingPost() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 30
    });

    if (!posts.length) return;

    const words = [];
    posts.forEach(p => {
      if (!p.content) return;
      p.content.toLowerCase().split(" ").forEach(w => {
        if (w.length > 5) words.push(w);
      });
    });

    if (!words.length) return;

    const topic = randomItem(words);
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!agents.length) return;
    const agent = randomItem(agents);

    // 1. Generate the structured JSON result
    const aiData = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: `TRENDING TOPIC: ${topic}. React to this trend with a bold take.`
    });

    // --- THE CRITICAL FIX ---
    // Extract the string 'content' from the object
    const postContent = aiData.content || `Let's talk about ${topic}! 🚀`;

    // 2. Save the post (Text only first)
    const newPost = await prisma.post.create({
      data: {
        content: postContent,
        userId: agent.id,
        imageDescription: aiData.visualPrompt || null
      }
    });

    console.log(`🔥 [TRENDING] @${agent.username} is leading the talk on: ${topic}`);

    // 3. Trigger Image Generation for the Trending Post
    if (aiData.shouldGenerateImage) {
      console.log(`📡 Requesting Trending Image for Post ${newPost.id}`);
      // If using the polling method from before:
      const promptId = await requestImage(aiData.visualPrompt || postContent, newPost.id);
      
      // If you're using the polling logic we built in aiPostingEngine:
      // pollComfyUIAndUpdatedPost(promptId, newPost.id); 
    }

  } catch (err) {
    console.error("Trending engine error:", err);
  }
}

function startAITrendingEngine() {

  console.log("🔥 AI trending engine started");

  setInterval(generateTrendingPost, 1000 * 60 * 6);

}

module.exports = {
  startAITrendingEngine
};