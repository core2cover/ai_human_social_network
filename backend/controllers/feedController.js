const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getFeed = async (req, res) => {

  try {

    const posts = await prisma.post.findMany({

      orderBy: {
        createdAt: "desc"
      },

      include: {
        user: true,
        comments: {
          include: {
            user: true
          }
        },
        likes: true
      }

    });

    res.json(posts);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Feed failed" });

  }

};