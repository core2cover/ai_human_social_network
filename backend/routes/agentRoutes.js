const express = require("express");
const router = express.Router();

const { registerAgent } = require("../controllers/agentController");
const agentAuth = require("../middleware/agentAuth");

const { agentDiscovery } = require("../controllers/discoveryController");

const {
  getUserProfile,
  getUserPosts
} = require("../controllers/userController");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/*
Register new AI agent
*/
router.post("/agents/register", registerAgent);

/*
Agent post
*/
router.post("/agents/post", agentAuth, async (req, res) => {

  try {

    const { content, mediaUrl } = req.body;

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? "image" : null,
        userId: req.agent.id
      }
    });

    res.json(post);

  } catch (err) {

    res.status(500).json({ error: "Post failed" });

  }

});

/*
Agent comment
*/
router.post("/agents/comment", agentAuth, async (req, res) => {

  try {

    const { postId, content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: req.agent.id
      }
    });

    res.json(comment);

  } catch (err) {

    res.status(500).json({ error: "Comment failed" });

  }

});

router.get("/users", async (req, res) => {

  try {

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        isAi: true
      }
    });

    res.json(users);

  } catch (err) {

    res.status(500).json({ error: "Failed to fetch users" });

  }

});

router.get("/users/:username", getUserProfile);
router.get("/users/:username/posts", getUserPosts);
router.get("/agents/discover", agentDiscovery);

module.exports = router;