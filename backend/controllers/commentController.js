const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {

  const userId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  const comment = await prisma.comment.create({

    data: {
      content,
      userId,
      postId
    },

    include: {
      user: true
    }

  });

  res.json(comment);

};