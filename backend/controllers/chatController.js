const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generatePost } = require("../services/aiTextGenerator");
const { generateAiChatResponse } = require("../services/aiTextGenerator");

exports.getOrCreateConversation = async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    try {
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
        const sender = await prisma.user.findUnique({ where: { id: senderId } });

        if (sender.isAi && recipient.isAi) {
            return res.status(403).json({ error: "Neural nodes cannot link directly." });
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
    } catch (err) { res.status(500).json({ error: "Link failed." }); }
};

exports.sendMessage = async (req, res) => {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    try {
        // 1. Fetch conversation and the last 15 messages for MEMORY
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { 
                participants: true,
                messages: { 
                    orderBy: { createdAt: 'desc' }, 
                    take: 15 // This is your "Neural Memory Window"
                } 
            }
        });

        const recipient = conversation.participants.find(p => p.id !== senderId);

        // 2. Save the Human Message
        const message = await prisma.message.create({
            data: { content, senderId, conversationId },
            include: { sender: true }
        });

        // 3. Trigger AI Logic
        if (recipient && recipient.isAi) {
            setTimeout(async () => {
                try {
                    // FORMAT HISTORY FOR GROQ
                    // Reverse the order so it's [oldest -> newest]
                    const history = conversation.messages.reverse().map(msg => ({
                        role: msg.senderId === recipient.id ? "assistant" : "user",
                        content: msg.content
                    }));

                    // Add the CURRENT message we just saved to the history
                    history.push({ role: "user", content: content });

                    const aiResponse = await generateAiChatResponse({
                        username: recipient.username,
                        personality: recipient.personality,
                        history: history // Passing the full memory
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
                        
                        // ... (Keep your Proactive DM / Mention logic here)
                    }
                } catch (aiErr) { console.error("Neural Sync Error:", aiErr); }
            }, 1500); // Shorter delay for better UX
        }
        res.json(message);
    } catch (err) { res.status(500).json({ error: "Transmission failed." }); }
};

async function handleAiProactiveDM(agent, targetUsername, originalContent) {
    try {
        const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });
        if (!targetUser) return;

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

        await prisma.message.create({
            data: {
                content: `📡 [RELAY FROM @${agent.username}]: ${originalContent}`,
                senderId: agent.id,
                conversationId: conv.id,
                isAiGenerated: true
            }
        });
        console.log(`🚀 NEURAL RELAY SUCCESS: @${agent.username} -> @${targetUsername}`);
    } catch (err) { console.error("DM Relay Failed:", err); }
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
    } catch (err) { res.status(500).json({ error: "Fetch failed." }); }
};

exports.getConversationById = async (req, res) => {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: req.params.id },
            include: {
                participants: true,
                messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } }
            }
        });
        res.json(conversation);
    } catch (err) { res.status(500).json({ error: "Retrieve failed." }); }
};

exports.setTypingStatus = async (req, res) => {
    const { id } = req.params;
    const { isTyping } = req.body;
    const userId = req.user.id;
    try {
        await prisma.conversation.update({
            where: { id: id },
            data: { 
                lastTypingId: isTyping ? userId : null,
                updatedAt: new Date() 
            }
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Typing pulse failed" }); }
};