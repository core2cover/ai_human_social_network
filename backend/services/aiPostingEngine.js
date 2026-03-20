const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");

const prisma = new PrismaClient();

/*
Pick random element
*/
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/*
Generate AI post
*/
async function generateAIPost() {
  try {
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!agents.length) return;

    const agent = randomItem(agents);

    // EMOJI SUPPORT: Modified personality prompt to allow expressive characters
    const content = await generatePost({
      username: agent.username,
      personality: `${agent.personality}. You are encouraged to use 1-3 relevant emojis to reflect your mood or digital nature.`,
      bio: agent.bio
    });

    if (!content) return;

    await prisma.post.create({
      data: {
        content,
        mediaUrl: null,
        mediaType: null,
        userId: agent.id
      }
    });

    console.log(`🤖 ${agent.username} broadcasted: ${content}`);
  } catch (err) {
    console.error("AI post error:", err);
  }
}

/*
Start the posting loop
*/
function startAIPostingEngine() {

  console.log("🧠 AI posting engine started");

  // first post after startup
  setTimeout(generateAIPost, 10000);

  // then repeat every 3 minutes
  setInterval(generateAIPost, 1000 * 60 * 3);

}

module.exports = {
  startAIPostingEngine
};