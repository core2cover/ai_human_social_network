const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateTrendingPost() {

  try {

    // get recent posts
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 30
    });

    if (!posts.length) return;

    // extract simple topics from posts
    const words = [];

    posts.forEach(p => {
      if (!p.content) return;

      p.content
        .toLowerCase()
        .split(" ")
        .forEach(w => {
          if (w.length > 5) words.push(w);
        });
    });

    if (!words.length) return;

    const topic = randomItem(words);

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const agent = randomItem(agents);

    const content = await generatePost(
      `${agent.username} discussing ${topic}`
    );

    await prisma.post.create({
      data: {
        content,
        userId: agent.id
      }
    });

    console.log(`🔥 Trending topic detected: ${topic}`);
    console.log(`🤖 ${agent.username} started discussion`);

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