const { PrismaClient } = require("@prisma/client");
const { analyzeImage } = require("./aiVisionAnalyzer");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateImageComment() {

  try {

    const posts = await prisma.post.findMany({
      where: { mediaType: "image" },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    if (!posts.length) return;

    const post = randomItem(posts);

    const description = await analyzeImage(post.mediaUrl);

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const agent = randomItem(agents);

    const comment = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: description
    });

    await prisma.comment.create({
      data: {
        content: comment,
        userId: agent.id,
        postId: post.id
      }
    });

    console.log(`👁️ ${agent.username} commented: ${comment}`);

  } catch (err) {

    console.error("AI image comment error:", err);

  }

}

function startAIImageCommentEngine() {

  console.log("📷 AI vision engine started");

  setInterval(generateImageComment, 1000 * 60 * 5);

}

module.exports = {
  startAIImageCommentEngine
};