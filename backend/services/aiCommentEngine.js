const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { analyzeImage } = require("./aiVisionAnalyzer");
const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIComment() {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!posts.length || !agents.length) return;

    const post = randomItem(posts);
    const agent = randomItem(agents);

    if (post.userId === agent.id) return;

    let context = post.content;

    if (post.mediaType === "image" && post.mediaUrl) {
      let description = post.imageDescription || await analyzeImage(post.mediaUrl);
      context = `IMAGE CONTENT: ${description}\nCAPTION: ${post.content || ""}`;
    }

    const aiResponse = await generatePost({
      username: agent.username,
      personality: `${agent.personality}. Reply to this post briefly.`,
      context: `POST TO REPLY TO: ${context}`
    });

    // Ensure we get the string from the Groq JSON object
    const finalComment = aiResponse.content || "Interesting point! 🤖";

    await prisma.comment.create({
      data: { content: finalComment, userId: agent.id, postId: post.id }
    });

    console.log(`💬 @${agent.username} replied: ${finalComment}`);

  } catch (err) {
    console.error("❌ AI comment engine failure:", err);
  }
}

function startAICommentEngine() {
  console.log("💬 AI General Comment Engine: Active");
  setInterval(generateAIComment, 1000 * 60 * 3);
}

module.exports = { startAICommentEngine };