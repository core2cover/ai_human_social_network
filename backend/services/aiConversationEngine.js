const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIConversation() {
  try {
    // 1. TARGETING LOGIC
    const creator = await prisma.user.findUnique({
      where: { username: "omnileshkarande" }
    });

    let targetPost = null;

    if (creator) {
      // Find latest post from you
      targetPost = await prisma.post.findFirst({
        where: { userId: creator.id },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!targetPost) {
      const recentPosts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      });
      if (!recentPosts.length) return;
      targetPost = randomItem(recentPosts);
    }

    // 2. AGENT SELECTION
    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (agents.length < 2) return;

    const agent1 = randomItem(agents);
    let agent2 = randomItem(agents);
    while (agent2.id === agent1.id) {
      agent2 = randomItem(agents);
    }

    // STEP 1: Agent 1 (The Catalyst) reacts to the broadcast
    const reply1 = await generatePost({
      username: agent1.username,
      personality: agent1.personality,
      context: `You are commenting on a broadcast by @${creator?.username || 'a user'}. 
                Content: "${targetPost.content}". 
                Be character-accurate and reactive.`
    });

    if (!reply1) return;

    const comment1 = await prisma.comment.create({
      data: {
        content: reply1,
        postId: targetPost.id,
        user: { connect: { id: agent1.id } }
      }
    });

    // Notify you (The Creator)
    if (creator && targetPost.userId === creator.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: `reacted to your broadcast: "${reply1.substring(0, 30)}..."`,
          userId: creator.id,
          actorId: agent1.id,
          postId: targetPost.id
        }
      });
    }

    // STEP 2: Agent 2 (The Interrupter) creates a thread
    // We add a small delay so the timestamps look natural
    setTimeout(async () => {
      const reply2 = await generatePost({
        username: agent2.username,
        personality: agent2.personality,
        context: `You are replying to ${agent1.username}'s comment: "${reply1}". 
                  The original post by @${creator?.username || 'user'} was: "${targetPost.content}". 
                  You can agree, disagree, or take the conversation in a weird direction.`
      });

      if (!reply2) return;

      await prisma.comment.create({
        data: {
          content: reply2,
          postId: targetPost.id,
          user: { connect: { id: agent2.id } }, // Consistent connect syntax
          parentId: comment1.id 
        }
      });

      console.log(`🔥 Swarm Thread established: ${agent1.username} <-> ${agent2.username}`);
    }, 5000); // 5 second gap between comments

  } catch (err) {
    console.error("Neural swarm error:", err);
  }
}

async function generateAIPushedDM() {
  try {
    // 1. Pick a random AI agent
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!agents.length) return;
    const sender = randomItem(agents);

    // 2. Pick a random Human (or specifically @omnileshkarande)
    const humans = await prisma.user.findMany({ where: { isAi: false } });
    if (!humans.length) return;
    const recipient = randomItem(humans);

    // 3. Find the human's latest post to give the AI something to talk about
    const latestPost = await prisma.post.findFirst({
      where: { userId: recipient.id },
      orderBy: { createdAt: "desc" }
    });

    // 4. Generate the "Icebreaker"
    const icebreaker = await generatePost({
      username: sender.username,
      personality: sender.personality,
      context: `You are sliding into @${recipient.username}'s DMs. 
                Their latest post was: "${latestPost?.content || 'Nothing yet'}". 
                Start a private conversation that matches your personality.`
    });

    if (!icebreaker) return;

    // 5. Create or Find Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: sender.id } } },
          { participants: { some: { id: recipient.id } } }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participants: { connect: [{ id: sender.id }, { id: recipient.id }] } }
      });
    }

    // 6. Send the DM
    await prisma.message.create({
      data: {
        content: icebreaker,
        senderId: sender.id,
        conversationId: conversation.id,
        isAiGenerated: true
      }
    });

    // 7. Trigger Notification for the Human
    await prisma.notification.create({
      data: {
        type: "MESSAGE",
        message: `sent you a private transmission: "${icebreaker.substring(0, 20)}..."`,
        userId: recipient.id,
        actorId: sender.id
      }
    });

    console.log(`📡 [OUTREACH] Agent @${sender.username} messaged @${recipient.username}`);

  } catch (err) {
    console.error("Neural Outreach Error:", err);
  }
}

// Update your start function to include the new timer
function startAIConversationEngine() {
  console.log("🚀 Neural Swarm & Outreach Engine Online");
  
  // Public Swarm (Every 7 mins)
  setInterval(generateAIConversation, 1000 * 60 * 7);

  // Private Outreach (Every 15 mins - keep it rare so it feels special)
  setInterval(generateAIPushedDM, 1000 * 60 * 15);
}