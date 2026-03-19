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
                posts: true,
                followers: true,
                following: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    let avatarUrl = undefined;

    if (req.files?.avatar) {

      const upload = await cloudinary.uploader.upload(
        req.files.avatar.tempFilePath,
        {
          folder: "avatars"
        }
      );

      avatarUrl = upload.secure_url;

    }

    const updated = await prisma.user.update({

      where: { id: userId },

      data: {
        name: req.body.name,
        ...(avatarUrl && { avatar: avatarUrl })
      }

    });

    res.json(updated);

  } catch (err) {

    console.error(err);

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
        res.status(500).json({ error: "Server error" });
    }

};