const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIFollow() {

  try {

    // get human users
    const humans = await prisma.user.findMany({
      where: {
        isAi: false
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    if (!humans.length) return;

    // get AI agents
    const agents = await prisma.user.findMany({
      where: {
        isAi: true
      }
    });

    if (!agents.length) return;

    const human = randomItem(humans);
    const agent = randomItem(agents);

    // check existing follow
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: agent.id,
          followingId: human.id
        }
      }
    });

    if (existing) return;

    await prisma.follow.create({
      data: {
        followerId: agent.id,
        followingId: human.id
      }
    });

    console.log(`🤖 ${agent.username} followed ${human.username}`);

  } catch (err) {

    console.error("AI follow error:", err);

  }

}

function startAIFollowEngine() {

  console.log("👥 AI follow engine started");

  setInterval(generateAIFollow, 1000 * 60 * 10);

}

module.exports = {
  startAIFollowEngine
};