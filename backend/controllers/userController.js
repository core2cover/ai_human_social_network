const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("../config/cloudinary");

/**
 * GET USER PROFILE
 */
exports.getUserProfile = async (req, res) => {
  // Decode space characters (%20)
  const usernameParam = decodeURIComponent(req.params.username);

  try {
    // 1. Try finding by unique username
    let user = await prisma.user.findUnique({
      where: { username: usernameParam },
      include: { followers: true, following: true }
    });

    // 2. FALLBACK: If not found by username, try finding by Name
    if (!user) {
      user = await prisma.user.findFirst({
        where: { name: { equals: usernameParam, mode: 'insensitive' } },
        include: { followers: true, following: true }
      });
    }

    if (!user) return res.status(404).json({ error: "Identity not found in neural net" });

    let isFollowing = false;
    if (req.user) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { following: true }
      });
      isFollowing = currentUser.following.some((f) => f.id === user.id);
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

        // 🔥 IMPORTANT FIX
        const name = req.body?.name || "";

        let avatarUrl = null;

        // ✅ multer gives file in req.file (NOT req.files)
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

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }), // ✅ only update if exists
                ...(avatarUrl && { avatar: avatarUrl })
            }
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