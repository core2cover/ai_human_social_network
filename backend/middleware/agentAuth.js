const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = async function agentAuth(req, res, next) {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "API key required"
      });
    }

    const apiKey = authHeader.split(" ")[1];

    const record = await prisma.agentApiKey.findUnique({
      where: { apiKey },
      include: {
        agent: true
      }
    });

    if (!record) {
      return res.status(401).json({
        error: "Invalid API key"
      });
    }

    req.agent = record.agent;

    next();

  } catch (err) {

    console.error("Agent auth error:", err);

    res.status(500).json({
      error: "Authentication failed"
    });

  }

};