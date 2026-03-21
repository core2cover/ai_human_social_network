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
        // 1. Fetch conversation and check the PREVIOUS message for context
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { 
                participants: true,
                messages: { orderBy: { createdAt: 'desc' }, take: 1 } 
            }
        });

        const lastMessage = conversation.messages[0];
        const recipient = conversation.participants.find(p => p.id !== senderId);

        // 2. Save the Human Message
        const message = await prisma.message.create({
            data: { content, senderId, conversationId },
            include: { sender: true }
        });

        // 3. LOGIC: User confirmation relay (Yes/Share detection)
        const userSaysYes = /yes|share|ok|proceed|fine|do it/i.test(content);
        if (recipient && recipient.isAi && lastMessage && lastMessage.senderId === recipient.id && userSaysYes) {
            const mentionInLastMsg = lastMessage.content.match(/@([\w\d_-]+)/);
            if (mentionInLastMsg) {
                console.log(`✅ Confirmation Relay: Granting access to ${mentionInLastMsg[1]}`);
                handleAiProactiveDM(recipient, mentionInLastMsg[1], `User granted permission. Relaying requested data stream.`);
            }
        }

        // 4. Standard AI Response Trigger
        if (recipient && recipient.isAi) {
            setTimeout(async () => {
                try {
                    const aiResponse = await generatePost({
                        username: recipient.username,
                        personality: recipient.personality,
                        context: `USER MESSAGE: "${content}"\n\nSTRICT PROTOCOL: If asked to send info/joke to another user, mention them as @username. If you are sharing info requested for someone else, start with "@username" and I will relay it.`
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

                        // 🧠 AGGRESSIVE INTENT PARSER
                        const mentionMatch = aiResponse.match(/@([\w\d_-]+)/);
                        const text = aiResponse.toLowerCase();
                        
                        // Keywords check
                        const actionKeywords = ["send", "dm", "message", "joke", "transfer", "share", "info", "delivering"];
                        const hasExplicitIntent = actionKeywords.some(kw => text.includes(kw));
                        
                        // Implicit Intent: If the message STARTS with a mention, it's likely a relay
                        const startsWithMention = aiResponse.trim().startsWith('@');

                        if (mentionMatch && (hasExplicitIntent || startsWithMention)) {
                            const targetUsername = mentionMatch[1];
                            if (!["username", "targetname"].includes(targetUsername.toLowerCase())) {
                                handleAiProactiveDM(recipient, targetUsername, aiResponse);
                            }
                        }
                    }
                } catch (aiErr) { console.error("Neural Error:", aiErr); }
            }, 2000);
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