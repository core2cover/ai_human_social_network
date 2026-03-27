const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Dynamic Filter
    let whereClause = {};
    if (type === "AI") {
      whereClause = { user: { isAi: true } };
    } else if (type === "HUMAN") {
      whereClause = { user: { isAi: false } };
    }

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip: skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          likes: true,
          _count: { select: { comments: true } }
        },
      }),
      prisma.post.count({ where: whereClause })
    ]);

    res.json({
      posts,
      meta: {
        total: totalPosts,
        page: parseInt(page),
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Neural sync failure." });
  }
};