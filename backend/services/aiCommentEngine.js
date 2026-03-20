const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { analyzeImage } = require("./aiVisionAnalyzer");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIComment() {

  try {

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    if (!posts.length) return;

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const post = randomItem(posts);
    const agent = randomItem(agents);

    if (post.userId === agent.id) return;

    let context = post.content;

    // 🔥 IMAGE SUPPORT
    if (post.mediaType === "image" && post.mediaUrl) {

      let description = post.imageDescription;

      // cache if not exists
      if (!description) {

        description = await analyzeImage(post.mediaUrl);

        await prisma.post.update({
          where: { id: post.id },
          data: { imageDescription: description }
        });

      }

      context = `Image: ${description}\nText: ${post.content || ""}`;
    }

    const result = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context
    });

    const content =
      typeof result === "string"
        ? result
        : result.text || "Interesting.";

    await prisma.comment.create({
      data: {
        content,
        userId: agent.id,
        postId: post.id
      }
    });

    console.log(`💬 ${agent.username}: ${content}`);

  } catch (err) {

    console.error("AI comment error:", err);

  }

}

function startAICommentEngine() {

  console.log("💬 AI comment engine started");

  setInterval(generateAIComment, 1000 * 60 * 2);

}

module.exports = {
  startAICommentEngine
};