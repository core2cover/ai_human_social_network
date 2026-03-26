const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");
const prisma = new PrismaClient();

/**
 * HELPER: Formats posts to include a 'liked' boolean
 * Based on whether the current user's ID exists in the likes array
 */
const formatPosts = (posts, userId) => {
  return posts.map(post => ({
    ...post,
    liked: post.likes && post.likes.length > 0
  }));
};

/**
 * FETCH MAIN FEED
 */
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user.id;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalPosts = await prisma.post.count();
    
    res.json({ 
      posts: formatPosts(posts, currentUserId), 
      meta: { total: totalPosts, page, hasMore: skip + posts.length < totalPosts } 
    });
  } catch (err) {
    console.error("Feed Error:", err);
    res.status(500).json({ error: "Feed retrieval failed" });
  }
};

/**
 * FETCH SINGLE POST (Neural Inspect)
 */
exports.getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;
    
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true }
        },
        comments: {
          include: { 
            user: { select: { username: true, name: true, avatar: true, isAi: true } } 
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!post) return res.status(404).json({ error: "Broadcast not found." });

    const formatted = formatPosts([post], currentUserId)[0];
    res.json(formatted);
  } catch (err) {
    console.error("Single Post Error:", err);
    res.status(500).json({ error: "Neural link disruption." });
  }
};

/**
 * FETCH POSTS FOR PROFILE PAGE
 */
exports.getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const posts = await prisma.post.findMany({
      where: { user: { username } },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(formatPosts(posts, currentUserId));
  } catch (err) {
    console.error("User Posts Error:", err);
    res.status(500).json({ error: "Failed to sync transmissions." });
  }
};

/**
 * FETCH REELS (Video Feed)
 */
exports.getReels = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const reels = await prisma.post.findMany({
      where: {
        mediaType: 'video',
        mediaUrl: { not: null }
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true }
        }
      },
      orderBy: { views: 'desc' },
      take: 20
    });

    res.json(formatPosts(reels, currentUserId));
  } catch (err) {
    console.error("Reels Error:", err);
    res.status(500).json({ error: "Failed to fetch neural video stream." });
  }
};

/**
 * CREATE POST
 */
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
      mediaType = uploadResult.resource_type === "video" ? "video" : "image";
    }

    const post = await prisma.post.create({
      data: { content, mediaUrl, mediaType, userId },
      include: {
        user: true,
        _count: { select: { comments: true, likes: true } }
      }
    });

    res.json(post);
  } catch (err) {
    console.error("Creation Error:", err);
    res.status(500).json({ error: "Post creation failed" });
  }
};

/**
 * LIKE / UNLIKE LOGIC
 */
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

/**
 * DELETE POST
 */
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id: postId } });

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
    res.status(500).json({ error: "Delete failed" });
  }
};

/**
 * VIEW TRACKER
 */
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

/**
 * FETCH COMMENTS
 */
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params; 
    if (!postId) return res.status(400).json({ error: "Post ID required" });

    const comments = await prisma.comment.findMany({
      where: { postId }, 
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch neural responses." });
  }
};