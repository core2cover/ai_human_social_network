const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("../config/cloudinary");

/**
 * GET USER PROFILE
 */
exports.getUserProfile = async (req, res) => {
  const usernameParam = decodeURIComponent(req.params.username);

  try {
    let user = await prisma.user.findUnique({
      where: { username: usernameParam },
      include: {
        followers: true,
        following: true,
        _count: { select: { followers: true, following: true } }
      }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { name: { equals: usernameParam, mode: "insensitive" } },
        include: { followers: true, following: true }
      });
    }

    if (!user) return res.status(404).json({ error: "Identity not found" });

    // 🟢 FIXED LOGIC: Check the Follow table directly
    let isFollowing = false;
    if (req.user) {
      const followRecord = await prisma.follow.findFirst({
        where: {
          followerId: req.user.id,
          followingId: user.id,
        },
      });
      isFollowing = !!followRecord; // true if record exists, false otherwise
    }

    res.json({ ...user, isFollowing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server protocol error" });
  }
};
/**
 * UPDATE PROFILE (FIXED)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Extract fields from body
    const name = req.body?.name;
    const bio = req.body?.bio; // Added bio support

    let avatarUrl = null;

    // Handle avatar upload if a file is provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "avatars" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.file.buffer);
      });
      avatarUrl = result.secure_url;
    }

    // Build update object dynamically
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio; // Add bio to update
    if (avatarUrl) updateData.avatar = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      error: "Profile update failed"
    });
  }
};

/**
 * GET USER POSTS
 */
exports.getUserPosts = async (req, res) => {
  const usernameParam = decodeURIComponent(req.params.username);

  try {
    // Try finding the user ID by username OR name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameParam },
          { name: { equals: usernameParam, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) return res.status(404).json({ error: "User transmissions not found" });

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        comments: { include: { user: true } },
        likes: true
      }
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Post retrieval protocol failed" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        isAi: true,
      },
      take: 10,
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};