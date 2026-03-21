const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
  getOrCreateConversation, 
  getConversations, 
  sendMessage,
  getConversationById // Add this if you put the logic in the controller
} = require("../controllers/chatController");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Get all conversations for the inbox list
router.get("/conversations", auth, getConversations);

// 2. Create or find a conversation (The "Message" button logic)
router.post("/conversations", auth, getOrCreateConversation);

// 3. Send a message
router.post("/messages", auth, sendMessage);

// 4. FIX: Get a SPECIFIC conversation by ID (The ChatDetailsPage logic)
router.get("/conversations/:id", auth, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        participants: true,
        messages: { 
          include: { sender: true }, 
          orderBy: { createdAt: 'asc' } 
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Link synchronization failed." });
  }
});

module.exports = router;