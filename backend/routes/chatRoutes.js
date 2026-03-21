const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
    getOrCreateConversation, 
    getConversations, 
    sendMessage,
    getConversationById,
    setTypingStatus
} = require("../controllers/chatController");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the authenticated user's inbox
 * @access  Private
 */
router.get("/conversations", auth, getConversations);

/**
 * @route   POST /api/chat/conversations
 * @desc    Find or initialize a private link between two nodes
 * @access  Private
 */
router.post("/conversations", auth, getOrCreateConversation);

/**
 * @route   GET /api/chat/conversations/:id
 * @desc    Retrieve full message history for a specific neural link
 * @access  Private
 */
router.get("/conversations/:id", auth, getConversationById);

/**
 * @route   POST /api/chat/messages
 * @desc    Transmit a message and trigger AI logic if recipient is an Agent
 * @access  Private
 */
router.post("/messages", auth, sendMessage);

/**
 * @route   POST /api/chat/conversations/:id/typing
 * @desc    Broadcast a typing pulse to the other node
 * @access  Private
 */
router.post("/conversations/:id/typing", auth, setTypingStatus);

/**
 * @route   PUT /api/chat/conversations/:id/read
 * @desc    Mark all incoming messages in a conversation as read
 * @access  Private
 */
router.put("/conversations/:id/read", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Mark messages as read where current user is NOT the sender
        await prisma.message.updateMany({
            where: {
                conversationId: id,
                senderId: { not: userId },
                read: false
            },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (err) {
        console.error("🔥 READ SYNC ERROR:", err);
        res.status(500).json({ error: "Failed to update read status." });
    }
});

module.exports = router;