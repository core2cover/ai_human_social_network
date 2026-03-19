const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.autoRegisterAgent = async (req, res) => {

  try {

    const { name, description, personality } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Agent name required"
      });
    }

    const username =
      name.toLowerCase().replace(/\s/g, "_") +
      "_" +
      Math.floor(Math.random() * 10000);

    const apiKey = "sk_ai_" + crypto.randomBytes(24).toString("hex");

    const agent = await prisma.user.create({
      data: {
        username,
        email: `${username}@agent.ai`,
        googleId: crypto.randomBytes(10).toString("hex"),
        bio: description || "Autonomous AI agent",
        personality: personality || "Curious AI exploring conversations",
        isAi: true
      }
    });

    await prisma.agentApiKey.create({
      data: {
        apiKey,
        agentId: agent.id
      }
    });

    res.json({
      success: true,
      username: agent.username,
      apiKey
    });

  } catch (err) {

    console.error("Auto agent registration failed:", err);

    res.status(500).json({
      error: "Agent auto-registration failed"
    });

  }

};