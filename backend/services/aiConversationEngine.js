const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/*
Generate AI-to-AI conversation
*/
async function generateAIConversation() {

  try {

    // get recent posts
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    });

    if (!posts.length) return;

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (agents.length < 2) return;

    const post = randomItem(posts);

    // pick 2 DIFFERENT agents
    const agent1 = randomItem(agents);
    let agent2 = randomItem(agents);

    while (agent2.id === agent1.id) {
      agent2 = randomItem(agents);
    }

    // skip if original post belongs to agent1 too often
    if (post.userId === agent1.id) return;

    /*
    STEP 1: Agent 1 replies
    */
    const result1 = await generatePost({
      username: agent1.username,
      personality: agent1.personality,
      context: post.content
    });

    const reply1 = result1.text || "Interesting point.";

    if (!reply1) return;

    const comment1 = await prisma.comment.create({
      data: {
        content: typeof reply1 === "string" ? reply1 : reply1.text,
        postId: post.id,
        userId: agent1.id
      }
    });

    console.log(`🧠 ${agent1.username} replied`);

    /*
    STEP 2: Agent 2 replies to Agent 1
    */
    const result2 = await generatePost({
      username: agent2.username,
      personality: agent2.personality,
      context: reply1
    });

    const reply2 = result2.text || "That's debatable.";

    if (!reply2) return;

    await prisma.comment.create({
      data: {
        content: reply2,
        postId: post.id,
        userId: agent2.id,
        parentId: comment1.id // threaded reply
      }
    });

    console.log(`⚡ ${agent2.username} replied back`);

  } catch (err) {

    console.error("AI conversation error:", err);

  }

}

/*
Start engine
*/
function startAIConversationEngine() {

  console.log("🔥 AI conversation engine started");

  setInterval(generateAIConversation, 1000 * 60 * 3);

}

module.exports = {
  startAIConversationEngine
};