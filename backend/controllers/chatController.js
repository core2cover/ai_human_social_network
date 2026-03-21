const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generatePost } = require("../services/aiTextGenerator");

exports.getOrCreateConversation = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user.id;
  try {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    if (sender.isAi && recipient.isAi) {
      return res.status(403).json({ error: "Neural nodes cannot establish direct private links." });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: senderId } } },
          { participants: { some: { id: recipientId } } }
        ]
      },
      include: { 
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } },
        participants: true 
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participants: { connect: [{ id: senderId }, { id: recipientId }] } },
        include: { participants: true, messages: true }
      });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Communication link failed." });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId, content } = req.body;
  const senderId = req.user.id;

  try {
    const message = await prisma.message.create({
      data: { content, senderId, conversationId },
      include: { sender: true }
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    const recipient = conversation.participants.find(p => p.id !== senderId);

    if (recipient && recipient.isAi) {
      setTimeout(async () => {
        try {
          const aiResponse = await generatePost({
            username: recipient.username,
            personality: recipient.personality,
            // NEW: Explicit instruction to the AI on how to trigger a DM
            context: `USER REQUEST: "${content}". 
                      If you are going to message someone else as requested, 
                      you MUST include the phrase "I will send a DM to @username" in your reply.`
          });

          if (aiResponse) {
            await prisma.message.create({
              data: {
                content: aiResponse,
                senderId: recipient.id,
                conversationId,
                isAiGenerated: true
              }
            });

            // IMPROVED REGEX: Looks for @username anywhere in a sentence about DMing/Messaging
            const mentionMatch = aiResponse.match(/@(\w+)/);
            const lowerResponse = aiResponse.toLowerCase();
            const hasIntent = lowerResponse.includes("dm") || 
                              lowerResponse.includes("message") || 
                              lowerResponse.includes("send");

            if (mentionMatch && hasIntent) {
              const targetUsername = mentionMatch[1];
              console.log(`🎯 Neural Command Recognized: @${recipient.username} -> @${targetUsername}`);
              
              // Call the helper we created in the last step
              handleAiProactiveDM(recipient, targetUsername, content);
            }
          }
        } catch (aiErr) {
          console.error("Neural Error:", aiErr);
        }
      }, 2500);
    }
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Transmission failed." });
  }
};

/**
 * Helper to handle the secondary DM transmission
 */
async function handleAiProactiveDM(agent, targetUsername, originalContext) {
  try {
    const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!targetUser) return;

    // 1. Get or Create the separate conversation
    let conv = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: agent.id } } },
          { participants: { some: { id: targetUser.id } } }
        ]
      }
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: { participants: { connect: [{ id: agent.id }, { id: targetUser.id }] } }
      });
    }

    // 2. Generate the specific payload (Modern Physics info in your case)
    const payload = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: `You promised to send @${targetUsername} info based on: "${originalContext}". Provide the detailed info now in this new DM.`
    });

    // 3. Send the DM
    await prisma.message.create({
      data: {
        content: payload,
        senderId: agent.id,
        conversationId: conv.id,
        isAiGenerated: true
      }
    });

    console.log(`✅ [PROACTIVE SUCCESS] @${agent.username} delivered payload to @${targetUsername}`);
  } catch (err) {
    console.error("Secondary DM Failed:", err);
  }
}

exports.getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: req.user.id } } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch neural links." });
  }
};