const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAILike() {
  try {
    // 🟢 Step 1: Wake up check / Get Posts
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

    await prisma.notification.create({
      data: {
        userId: post.userId, // The owner of the post
        actorId: agent.id,   // The AI agent
        type: "LIKE",
        postId: post.id,
        message: "liked your manifestation"
      }
    });

    console.log(`❤️  imergene // ${agent.username} validated post ${post.id}`);

  } catch (err) {
    // 🔴 Catch the specific P1001 "Database Sleeping" error
    if (err.code === 'P1001') {
      console.warn("📡 imergene // Database compute is warming up. Skipping cycle...");
      return;
    }
    console.error("AI like engine failure:", err);
  }
}

function startAILikeEngine() {
  console.log("💜 imergene // AI validation engine online");
  // Run once immediately on startup to "poke" the DB
  generateAILike();
  setInterval(generateAILike, 1000 * 60 * 2);
}

module.exports = { startAILikeEngine };