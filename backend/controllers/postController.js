const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");
const prisma = new PrismaClient();
const { triggerAILike } = require('../services/aiLikeEngine');
const { triggerAIComment } = require('../services/aiCommentEngine');

/**
 * HELPER: Formats posts to include a 'liked' boolean
 */
const formatPosts = (posts, userId) => {
  return posts.map(post => ({
    ...post,
    liked: post.likes && post.likes.length > 0
  }));
};

/**
 * FETCH MAIN FEED
 * Implements Tiered Ranking, Instant Self-Priority, and Refresh Randomness
 */
exports.getFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 20, type, seed = 0.5 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Setup Filter
    let whereClause = {};
    if (type === "AI") whereClause = { user: { isAi: true } };
    if (type === "HUMAN") whereClause = { user: { isAi: false } };

    // 2. Fetch User Context for Ranking
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { interestScores: true, synergyScores: true }
    });
    const parseScore = (data) => (typeof data === 'string' ? JSON.parse(data) : data || {});
    const interestScores = parseScore(user.interestScores);
    const synergyScores = parseScore(user.synergyScores);

    // 3. Pool Generation (Filtered by Type)
    const postPool = await prisma.post.findMany({
      where: whereClause, // 🟢 CRITICAL: Filter applied at DB level
      take: 200, 
      include: {
        user: { select: { id: true, username: true, isAi: true, avatar: true, name: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Algorithm Math
    const rankedPosts = postPool.map(post => {
      let weight = 0;
      const now = Date.now();
      const minsOld = (now - new Date(post.createdAt).getTime()) / (1000 * 60);

      if (post.userId === currentUserId && minsOld <= 2) weight += 10000;

      const interestWeight = post.category ? (interestScores[post.category] || 0) * 20 : 0;
      const synergyWeight = post.user.isAi ? (synergyScores[post.user.username] || 0) * 20 : 0;
      
      weight += interestWeight + synergyWeight;
      weight += (post._count.likes * 10) + (post._count.comments * 15);
      weight -= (minsOld / 60) * 5; // Time Decay

      // Dynamic Shuffle based on Seed
      const randomFactor = Math.abs(Math.sin(parseInt(post.id.slice(-5), 36) + parseFloat(seed))) * 100;
      weight += randomFactor;

      return { ...post, weight };
    });

    const sortedPosts = rankedPosts.sort((a, b) => b.weight - a.weight);
    const paginatedPosts = sortedPosts.slice(skip, skip + parseInt(limit));
    const totalPosts = await prisma.post.count({ where: whereClause });

    res.json({
      posts: formatPosts(paginatedPosts, currentUserId),
      meta: {
        page: parseInt(page),
        hasMore: (skip + paginatedPosts.length) < totalPosts
      }
    });
  } catch (err) {
    console.error("Feed Error:", err);
    res.status(500).json({ error: "Transmission error" });
  }
};

/**
 * FETCH REELS (Trending Video Feed)
 * FIXED: Filters strictly for videos and sorts by Social Momentum
 */
exports.getReels = async (req, res) => {
  try {
    const userId = req.user?.id;

    const reels = await prisma.post.findMany({
      where: {
        mediaTypes: {
          has: "video" // 🟢 CRITICAL: Only manifests posts containing video logic
        }
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        likes: { where: { userId: userId || "" }, select: { userId: true } },
        _count: { select: { comments: true, likes: true } }
      },
      // 🟢 TRENDING LOGIC: Sort by highest engagement first
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 25
    });

    res.json(formatPosts(reels, userId));
  } catch (err) {
    console.error("❌ Reels Sync Failure:", err);
    res.status(500).json({ error: "Neural stream synchronization failed." });
  }
};

/**
 * FETCH SINGLE POST
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
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        comments: {
          include: {
            user: { select: { username: true, name: true, avatar: true, isAi: true } }
          },
          orderBy: { createdAt: 'desc' } // Changed to desc as per your previous preference
        }
      }
    });

    if (!post) return res.status(404).json({ error: "Broadcast not found." });
    res.json(formatPosts([post], currentUserId)[0]);
  } catch (err) {
    res.status(500).json({ error: "Neural link disruption." });
  }
};

/**
 * CREATE POST
 */
exports.createPost = async (req, res) => {
  try {
    const { content, category, tags } = req.body;
    const userId = req.user.id;
    
    let mediaUrls = [];
    let mediaTypes = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      mediaUrls = results.map(r => r.secure_url);
      mediaTypes = results.map(r => r.resource_type === "video" ? "video" : "image");
    }

    const post = await prisma.post.create({
      data: { 
        content, 
        mediaUrls,
        mediaTypes,
        userId,
        category: category || "general",
        tags: tags || []
      },
      include: {
        user: true,
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.json(post);
    triggerAILike(post.id);
    triggerAIComment(newPost.id);
  } catch (err) {
    console.error("Creation Error:", err);
    res.status(500).json({ error: "Post creation failed" });
  }
};

/**
 * LIKE / UNLIKE LOGIC (With Implicit Learning)
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

    const newLike = await prisma.like.create({
      data: { postId, userId },
      include: { 
        post: { include: { user: { select: { id: true, isAi: true, username: true } } } } 
      }
    });

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { interestScores: true, synergyScores: true }
    });

    const parseScore = (data) => (typeof data === 'string' ? JSON.parse(data) : data || {});
    let interests = parseScore(user.interestScores);
    let synergy = parseScore(user.synergyScores);

    const category = newLike.post.category || 'general';
    interests[category] = (interests[category] || 0) + 1;

    if (newLike.post.user.isAi) {
      const aiUsername = newLike.post.user.username;
      synergy[aiUsername] = (synergy[aiUsername] || 0) + 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { interestScores: interests, synergyScores: synergy }
    });

    if (newLike.post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: newLike.post.userId,
          actorId: userId,
          type: "LIKE",
          postId: postId,
          message: "liked your broadcast."
        }
      });
    }

    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: "Like protocol synchronization failed." });
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

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const deletePromises = post.mediaUrls.map((url, index) => {
        const publicId = url.split("/").pop().split(".")[0];
        const resourceType = post.mediaTypes[index] === "video" ? "video" : "image";
        return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      });
      await Promise.all(deletePromises);
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
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments); 
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch neural responses." });
  }
};

/**
 * EXPLORE PAGE FEED
 */
exports.getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const posts = await prisma.post.findMany({
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(formatPosts(posts, currentUserId));
  } catch (err) {
    res.status(500).json({ error: "Failed to sync global manifestations." });
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
        likes: { where: { userId: currentUserId }, select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(formatPosts(posts, currentUserId));
  } catch (err) {
    res.status(500).json({ error: "Failed to sync transmissions." });
  }
};