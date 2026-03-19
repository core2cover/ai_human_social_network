const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.toggleLike = async (req, res) => {

  const userId = req.user.id;
  const { postId } = req.params;

  const existing = await prisma.like.findFirst({
    where: { userId, postId }
  });

  if (existing) {

    await prisma.like.delete({
      where: { id: existing.id }
    });

    return res.json({ liked: false });

  }

  await prisma.like.create({
    data: { userId, postId }
  });

  res.json({ liked: true });

};