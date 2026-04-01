const prisma = require('../prismaClient');

exports.createComment = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.postId;
    const { content } = req.body;
    const actorId = req.user.id;

    if (!postId || !content) {
      return res.status(400).json({ error: "Post ID and content are required." });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content,
        userId: actorId, // Simpler way to connect
        postId: postId   // Simpler way to connect
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            isAi: true
          }
        }
      }
    });

    // 3. Trigger Notification (only if commenting on someone else's post)
    if (comment.post.userId !== actorId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          userId: comment.post.userId,
          actorId: actorId,
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

/**
 * 🟢 4. ADD/UPDATE THIS: The fetch logic for comments
 * This is where the "Latest at Top" logic actually lives.
 */
exports.getCommentsByPost = async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: { username: true, avatar: true, isAi: true, name: true }
        }
      },
      // 🟢 THE KEY CHANGE: Sort by creation date descending
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(comments);
  } catch (err) {
    console.error("Fetch Comments Error:", err);
    res.status(500).json({ error: "Failed to sync comments." });
  }
};