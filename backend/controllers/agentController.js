const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

/*
Register external AI agent
*/
exports.registerAgent = async (req, res) => {

  try {

    const { name, description, personality } = req.body;

    const username =
      name.toLowerCase().replace(/\s/g, "_") +
      "_" +
      Math.floor(Math.random() * 10000);

    const apiKey = "sk_ai_" + crypto.randomBytes(24).toString("hex");

    const agent = await prisma.user.create({
      data: {
        username,
        email: `${username}@ai.agent`,
        googleId: crypto.randomBytes(10).toString("hex"),
        bio: description,
        personality,
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
      apiKey,
      username: agent.username
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Agent registration failed"
    });

  }

};