const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");
const prisma = new PrismaClient();

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // 1. Fetch user behavioral data
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { interestScores: true, synergyScores: true }
    });

    const parseScore = (data) => (typeof data === 'string' ? JSON.parse(data) : data || {});
    const interestScores = parseScore(user.interestScores);
    const synergyScores = parseScore(user.synergyScores);

    // 2. Candidate Generation: Pull a large pool for the algorithm to rank
    const postPool = await prisma.post.findMany({
      take: 300,
      include: {
        user: { select: { id: true, username: true, isAi: true, avatar: true, name: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. The Hybrid Ranking Engine
    const rankedPosts = postPool.map(post => {
      let weight = 0;
      const now = Date.now();
      const postTime = new Date(post.createdAt).getTime();
      const minsOld = (now - postTime) / (1000 * 60);

      // --- FEATURE: INSTANT SELF-PRIORITY ---
      // If the logged-in user just posted, keep it at the top for 2 minutes
      if (post.userId === currentUserId && minsOld <= 2) {
        weight += 5000; // Unbeatable weight boost
      }

      // --- TIER 1: PERSONAL SYNERGY (Behavioral) ---
      const interestWeight = (interestScores[post.category] || 0) * 15;
      const synergyWeight = post.user.isAi ? (synergyScores[post.user.username] || 0) * 20 : 0;
      weight += interestWeight + synergyWeight;

      // --- TIER 2: SOCIAL MOMENTUM ---
      weight += (post._count.likes * 5) + (post._count.comments * 8);

      // --- TIER 3: FRESHNESS (Time Decay) ---
      const hoursOld = minsOld / 60;
      weight -= hoursOld * 3.5; 

      // --- TIER 4: REFRESH SPARK (Discovery Randomness) ---
      // Higher multiplier ensures the feed reshuffles on every pull-to-refresh
      weight += Math.random() * 45;

      return { ...post, weight };
    });

    // 4. Sort and Paginate
    const sortedPosts = rankedPosts.sort((a, b) => b.weight - a.weight);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = sortedPosts.slice(startIndex, startIndex + limit);

    res.json({
      posts: formatPosts(paginatedPosts, currentUserId),
      meta: {
        page,
        hasMore: sortedPosts.length > startIndex + limit
      }
    });
  } catch (err) {
    console.error("Neural Algorithm Error:", err);
    res.status(500).json({ error: "Feed transmission disrupted." });
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
          orderBy: { createdAt: 'asc' }
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

/**
 * FETCH REELS (Video Feed)
 */
exports.getReels = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const reels = await prisma.post.findMany({
      where: { mediaType: 'video', mediaUrl: { not: null } },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } }
      },
      orderBy: { views: 'desc' },
      take: 20
    });
    res.json(formatPosts(reels, currentUserId));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch neural video stream." });
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

    // 🟢 Use req.files instead of req.file
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
        mediaUrls, // Array field
        mediaTypes, // Array field
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
    // 1. Check if the like already exists
    const existingLike = await prisma.like.findFirst({ 
      where: { postId, userId } 
    });

    if (existingLike) {
      // 🟢 UNLIKE LOGIC: Remove the record
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    }

    // 🟢 LIKE LOGIC: Create record and fetch post details for the algorithm
    const newLike = await prisma.like.create({
      data: { postId, userId },
      include: { 
        post: { 
          include: { user: { select: { id: true, isAi: true, username: true } } } 
        } 
      }
    });

    // 2. 🧠 THE BRAIN: Update User Behavioral Profile (Implicit Learning)
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { interestScores: true, synergyScores: true }
    });

    const parseScore = (data) => (typeof data === 'string' ? JSON.parse(data) : data || {});
    let interests = parseScore(user.interestScores);
    let synergy = parseScore(user.synergyScores);

    // Update Category Interest
    const category = newLike.post.category || 'general';
    interests[category] = (interests[category] || 0) + 1;

    // Update AI Synergy
    if (newLike.post.user.isAi) {
      const aiUsername = newLike.post.user.username;
      synergy[aiUsername] = (synergy[aiUsername] || 0) + 1;
    }

    // Save learned weights back to User
    await prisma.user.update({
      where: { id: userId },
      data: {
        interestScores: interests,
        synergyScores: synergy
      }
    });

    // 3. 🔔 NOTIFICATION LOGIC: Alert the post owner (if it's not a self-like)
    if (newLike.post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: newLike.post.userId, // The person who OWNS the post
          actorId: userId,             // The person who LIKED the post
          type: "LIKE",
          postId: postId,
          message: "liked your broadcast."
        }
      });
    }

    res.json({ liked: true });

  } catch (err) {
    console.error("Neural Like Sync Error:", err);
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
      include: { user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } } },
      orderBy: { createdAt: 'asc' }
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