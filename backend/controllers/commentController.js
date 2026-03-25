const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const actorId = req.user.id;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required to comment." });
    }

    // 1. Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content,
        user: { connect: { id: actorId } },
        post: { connect: { id: postId } }
      },
      include: {
        post: true, 
        user: true 
      }
    });

    // 2. Trigger Notification (only if commenting on someone else's post)
    if (comment.post.userId !== actorId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          userId: comment.post.userId, // Post owner
          actorId: actorId,            // Commenter
          postId: postId,
          message: `replied to your post: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`
        }
      });
    }

    res.json(comment);
  } catch (err) {
    console.error("Comment Error:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
};