const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");

const prisma = new PrismaClient();

exports.createPost = async (req, res) => {

  try {

    const { content } = req.body;
    const userId = req.user.id;

    let mediaUrl = null;
    let mediaType = null;

    // If user uploaded media
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

      // detect media type safely
      if (mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".mov") || mediaUrl.endsWith(".webm")) {
        mediaType = "video";
      } else {
        mediaType = "image";
      }

    }

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl,
        mediaType,
        userId
      },
      include: {
        user: true
      }
    });

    res.json(post);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Post creation failed"
    });

  }

};

exports.deletePost = async (req, res) => {

  try {

    const { postId } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // delete cloudinary media if exists
    if (post.mediaUrl) {

      const publicId = post.mediaUrl
        .split("/")
        .pop()
        .split(".")[0];

      await cloudinary.uploader.destroy(publicId, {
        resource_type: post.mediaType === "video" ? "video" : "image"
      });

    }

    await prisma.post.delete({
      where: { id: postId }
    });

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
      data: {
        views: {
          increment: 1,
        },
      },
    });

    res.json({ success: true, views: updatedPost.views });
  } catch (err) {
    console.error("View update failed:", err);
    res.status(500).json({ error: "Failed to update view count" });
  }
};