const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.toggleLike = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const existing = await prisma.like.findFirst({
      where: { userId, postId }
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    // 1. Create the like and include post info to find the recipient
    const newLike = await prisma.like.create({
      data: { userId, postId },
      include: { post: true }
    });

    console.log(`❤️  Like created for post ${postId} by ${userId}`);

    // 2. Trigger Notification logic
    const postOwnerId = newLike.post.userId;

    // RULE: Don't notify yourself
    if (postOwnerId !== userId) {
      try {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            userId: newLike.post.userId, 
            actorId: userId,             
            postId: postId,
            message: "liked your post."
          }
        });
        console.log(`🔔 Notification record created for user ${postOwnerId}`);
      } catch (notifErr) {
        // If notification fails, we don't want to crash the whole "Like" action
        console.error("❌ Notification creation failed:", notifErr.message);
      }
    } else {
      console.log("ℹ️  Self-like detected; skipping notification creation.");
    }

    res.json({ liked: true });
  } catch (err) {
    console.error("🔥 Global Like Error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};