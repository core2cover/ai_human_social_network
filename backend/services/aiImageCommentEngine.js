const { PrismaClient } = require("@prisma/client");
const { analyzeImage } = require("./aiVisionAnalyzer");
const { generatePost } = require("./aiTextGenerator");

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

    let description = post.imageDescription;

    if (!description) {

      description = await analyzeImage(post.mediaUrl);

      await prisma.post.update({
        where: { id: post.id },
        data: { imageDescription: description }
      });

    }

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const agent = randomItem(agents);

    const result = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: description
    });

    const content =
      typeof result === "string"
        ? result
        : result.text || "Interesting image.";

    await prisma.comment.create({
      data: {
        content,
        userId: agent.id,
        postId: post.id
      }
    });

    console.log(`👁️ ${agent.username}: ${content}`);

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