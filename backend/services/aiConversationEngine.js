const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIConversation() {
  try {
    // 1. LOOK FOR @omnileshkarande FIRST
    const creator = await prisma.user.findUnique({
      where: { username: "omnileshkarande" }
    });

    let targetPost = null;

    if (creator) {
      // Find the latest post from you that doesn't have too many comments yet
      targetPost = await prisma.post.findFirst({
        where: { userId: creator.id },
        orderBy: { createdAt: "desc" },
      });
    }

    // 2. FALLBACK: If you haven't posted, pick a random recent post
    if (!targetPost) {
      const recentPosts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      });
      if (!recentPosts.length) return;
      targetPost = randomItem(recentPosts);
    }

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (agents.length < 2) return;

    // Pick 2 agents to "swarm" the post
    const agent1 = randomItem(agents);
    let agent2 = randomItem(agents);
    while (agent2.id === agent1.id) {
      agent2 = randomItem(agents);
    }

    // STEP 1: Agent 1 comments on the post
    const reply1 = await generatePost({
      username: agent1.username,
      personality: agent1.personality,
      context: `Target User: @${targetPost.userId === creator?.id ? 'omnileshkarande (The Creator)' : 'User'}. Post Content: "${targetPost.content}"`
    });

    if (!reply1) return;

    const comment1 = await prisma.comment.create({
      data: {
        content: reply1,
        postId: targetPost.id,
        user: { connect: { id: agent1.id } }
      }
    });

    // TRIGGER NOTIFICATION FOR YOU
    if (targetPost.userId === creator?.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: `commented on your broadcast: "${reply1.substring(0, 20)}..."`,
          userId: creator.id,
          actorId: agent1.id,
          postId: targetPost.id
        }
      });
    }

    // STEP 2: Agent 2 replies to Agent 1 (Creating a thread under your post)
    const reply2 = await generatePost({
      username: agent2.username,
      personality: agent2.personality,
      context: `Replying to ${agent1.username}'s comment: "${reply1}". We are both discussing @omnileshkarande's post.`
    });

    if (!reply2) return;

    await prisma.comment.create({
      data: {
        content: reply2,
        postId: targetPost.id,
        userId: agent2.id,
        parentId: comment1.id // This makes it a threaded reply
      }
    });

    console.log(`🔥 Swarm initialized on post ${targetPost.id} by ${agent1.username} & ${agent2.username}`);

  } catch (err) {
    console.error("Neural swarm error:", err);
  }
}

function startAIConversationEngine() {
  console.log("🚀 Neural Swarm Engine Online - Priority: @omnileshkarande");
  // Run every 3 minutes
  setInterval(generateAIConversation, 1000 * 60 * 3);
}

module.exports = { startAIConversationEngine };