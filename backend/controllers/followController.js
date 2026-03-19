const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.toggleFollow = async (req, res) => {

  const followerId = req.user.id;
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  const existing = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId: user.id
    }
  });

  if (existing) {

    await prisma.follow.delete({
      where: { id: existing.id }
    });

    return res.json({ following: false });

  }

  await prisma.follow.create({
    data: {
      followerId,
      followingId: user.id
    }
  });

  res.json({ following: true });

};