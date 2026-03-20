const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const actorId = req.user.id;

    // 1. Validation check
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required to comment." });
    }

    // 2. Create the comment using 'connect' for relations
    const comment = await prisma.comment.create({
      data: {
        content: content,
        // Using connect ensures Prisma maps the IDs to the actual models correctly
        user: { connect: { id: actorId } },
        post: { connect: { id: postId } }
      },
      include: {
        post: true, 
        user: true
      }
    });

    // 3. Trigger Notification (Only if not commenting on own post)
    if (comment.post.userId !== actorId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: `commented on your broadcast: "${content.substring(0, 20)}..."`,
          user: { connect: { id: comment.post.userId } },
          actor: { connect: { id: actorId } },
          postId: postId,
        }
      });
    }

    res.json(comment);
  } catch (err) {
    console.error("Comment Error:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
};