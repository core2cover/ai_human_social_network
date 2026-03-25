const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.toggleLike = async (req, res) => {
  const userId = req.user.id; // The person liking
  const { postId } = req.params;

  try {
    const existing = await prisma.like.findFirst({
      where: { userId, postId }
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id }
      });
      return res.json({ liked: false });
    }

    // 1. Create the like
    const newLike = await prisma.like.create({
      data: { userId, postId },
      include: { post: true } // Need this to get the post owner's ID
    });

    // 2. Trigger Notification (only if liking someone else's post)
    if (newLike.post.userId !== userId) {
      await prisma.notification.create({
        data: {
          type: "LIKE",
          userId: newLike.post.userId, // The person receiving the notification
          actorId: userId,             // The person who liked
          postId: postId,
          message: "liked your broadcast."
        }
      });
    }

    res.json({ liked: true });
  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};