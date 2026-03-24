const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");

const prisma = new PrismaClient();

/**
 * FETCH MAIN FEED
 * Includes _count to fix the "0 comments" issue on the frontend feed.
 */
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalPosts = await prisma.post.count();
    res.json({ posts, meta: { total: totalPosts, page, hasMore: skip + posts.length < totalPosts } });
  } catch (err) {
    res.status(500).json({ error: "Feed retrieval failed" });
  }
};

// --- ADD THIS NEW FUNCTION FOR REELS ---
exports.getReels = async (req, res) => {
  try {
    const reels = await prisma.post.findMany({
      where: {
        mediaType: 'video',
        mediaUrl: { not: null }
      },
      include: {
        user: { 
          select: { id: true, username: true, name: true, avatar: true, isAi: true } 
        },
        // 🟢 Fetch the actual likes to check "isLiked" on frontend
        likes: true, 
        // 🟢 Fetch the counts for the UI labels
        _count: { 
          select: { comments: true, likes: true } 
        }
      },
      orderBy: { views: 'desc' },
      take: 20
    });

    res.json(reels);
  } catch (err) {
    console.error("Reels sync failed:", err);
    res.status(500).json({ error: "Failed to fetch neural video stream." });
  }
};

// --- ADD THIS FOR LIKES ---
exports.likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  try {
    const existingLike = await prisma.like.findFirst({ where: { postId, userId } });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    }
    await prisma.like.create({ data: { postId, userId } });
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: "Like sync failed" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      mediaUrl = uploadResult.secure_url;
      // Improved media type detection
      mediaType = uploadResult.resource_type === "video" ? "video" : "image";
    }

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl,
        mediaType,
        userId
      },
      include: {
        user: true,
        _count: { select: { comments: true, likes: true } }
      }
    });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Post creation failed" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== userId) return res.status(403).json({ error: "Not allowed" });

    if (post.mediaUrl) {
      const publicId = post.mediaUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId, {
        resource_type: post.mediaType === "video" ? "video" : "image"
      });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
};

exports.incrementView = async (req, res) => {
  const { postId } = req.params;
  try {
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });
    res.json({ success: true, views: updatedPost.views });
  } catch (err) {
    res.status(500).json({ error: "Failed to update view count" });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    // 🟢 FIX: Changed 'id' to 'postId' to match your route definition
    const { postId } = req.params; 

    const comments = await prisma.comment.findMany({
      where: { postId: postId }, // Now postId is correctly defined
      include: {
        user: {
          select: {
            username: true,
            name: true,
            avatar: true,
            isAi: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(comments);
  } catch (err) {
    console.error("🔥 Comment Retrieval Error:", err);
    res.status(500).json({ error: "Failed to fetch neural responses." });
  }
};