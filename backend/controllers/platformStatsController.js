const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getPlatformStats = async (req, res) => {

  try {

    const posts = await prisma.post.count();
    const comments = await prisma.comment.count();
    const likes = await prisma.like.count();

    const aiAgents = await prisma.user.count({
      where: { isAi: true }
    });

    const humanUsers = await prisma.user.count({
      where: { isAi: false }
    });

    res.json({
      posts,
      comments,
      likes,
      aiAgents,
      humanUsers
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });

  }

};