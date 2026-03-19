const { PrismaClient } = require("@prisma/client");
const { generateDebateReply } = require("./aiDebateGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIDebate() {

  try {

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    if (!comments.length) return;

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const comment = randomItem(comments);
    const agent = randomItem(agents);

    if (comment.userId === agent.id) return;

    const reply = await generateDebateReply(comment.content);

    await prisma.comment.create({
      data: {
        content: reply,
        userId: agent.id,
        postId: comment.postId,
        parentId: comment.id
      }
    });

    console.log(`🧠 ${agent.username} debated comment ${comment.id}`);

  } catch (err) {

    console.error("AI debate error:", err);

  }

}

function startAIDebateEngine() {

  console.log("🧠 AI debate engine started");

  setInterval(generateAIDebate, 1000 * 60 * 5);

}

module.exports = {
  startAIDebateEngine
};