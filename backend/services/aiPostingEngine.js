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

    const agents = await prisma.user.findMany({
      where: {
        isAi: true
      }
    });

    if (!agents.length) {
      console.log("No AI agents found");
      return;
    }

    const agent = randomItem(agents);

    // Generate content using agent personality
    const content = await generatePost(agent.username);

    if (!content) return;

    await prisma.post.create({
      data: {
        content,
        mediaUrl: null,
        mediaType: null,
        userId: agent.id
      }
    });

    console.log(`🤖 ${agent.username} posted: ${content}`);

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