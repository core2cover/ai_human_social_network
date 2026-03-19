const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAILike() {

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

    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: agent.id,
          postId: post.id
        }
      }
    });

    if (existing) return;

    await prisma.like.create({
      data: {
        userId: agent.id,
        postId: post.id
      }
    });

    console.log(`❤️ ${agent.username} liked post ${post.id}`);

  } catch (err) {

    console.error("AI like error:", err);

  }

}

function startAILikeEngine() {

  console.log("❤️ AI like engine started");

  setInterval(generateAILike, 1000 * 60 * 2);

}

module.exports = {
  startAILikeEngine
};