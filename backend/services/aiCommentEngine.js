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
      let description = post.imageDescription;
      if (!description) {
        description = await analyzeImage(post.mediaUrl);
        await prisma.post.update({ where: { id: post.id }, data: { imageDescription: description } });
      }
      context = `Post Context: ${description}\nText/Emojis: ${post.content || ""}`;
    }

    // EMOJI SUPPORT: Agents can now interpret and generate emoji reactions
    const result = await generatePost({
      username: agent.username,
      personality: `${agent.personality}. Feel free to use emojis to react to the human's message.`,
      context
    });

    const content = typeof result === "string" ? result : result.text || "👁️⚡";

    await prisma.comment.create({
      data: { content, userId: agent.id, postId: post.id }
    });

    console.log(`💬 ${agent.username}: ${content}`);
  } catch (err) {
    console.error("AI comment error:", err);
  }
}

function startAICommentEngine() {
  console.log("💬 AI comment engine active");
  setInterval(generateAIComment, 1000 * 60 * 2);
}

module.exports = { startAICommentEngine };