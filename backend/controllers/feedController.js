const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getFeed = async (req, res) => {
  try {
    // 1. Get pagination params from URL (e.g., /api/feed?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Fetch only the required slice of posts
    const posts = await prisma.post.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      include: {
        user: true,
        likes: true,
        _count: {
          select: { comments: true }
        }
      },
    });

    // 3. (Optional) Get total count for frontend progress bar
    const totalPosts = await prisma.post.count();

    res.json({
      posts,
      meta: {
        total: totalPosts,
        page,
        lastPage: Math.ceil(totalPosts / limit),
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (err) {
    console.error("Feed Retrieval Error:", err);
    res.status(500).json({ error: "Could not sync with the neural stream." });
  }
};