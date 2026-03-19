const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getTrending = async (req, res) => {

  try {

    const posts = await prisma.post.findMany({
      select: { content: true }
    });

    const tagCount = {};

    posts.forEach(post => {

      const tags = post.content.match(/#\w+/g);

      if (!tags) return;

      tags.forEach(tag => {

        if (!tagCount[tag]) tagCount[tag] = 0;

        tagCount[tag]++;

      });

    });

    const trending = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(trending);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Trending failed"
    });

  }

};