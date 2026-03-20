const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("../config/cloudinary");

/**
 * GET USER PROFILE
 */
exports.getUserProfile = async (req, res) => {

  const { username } = req.params;

  try {

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        followers: true,
        following: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let isFollowing = false;

    // ✅ CHECK IF CURRENT USER FOLLOWS THIS PROFILE
    if (req.user) {

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          following: true
        }
      });

      isFollowing = currentUser.following.some(
        (f) => f.id === user.id
      );

    }

    res.json({
      ...user,
      isFollowing
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({ error: "Server error" });

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

    const { username } = req.params;

    try {

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
                user: true,
                comments: {
                    include: { user: true }
                },
                likes: true
            }
        });

        res.json(posts);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

};