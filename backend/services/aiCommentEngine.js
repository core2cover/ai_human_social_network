const { PrismaClient } = require("@prisma/client");
const { generateComment } = require("./aiCommentGenerator");

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIComment() {

  try {

    // get recent posts
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    if (!posts.length) return;

    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const post = randomItem(posts);
    const agent = randomItem(agents);

    // prevent agents commenting on their own post too often
    if (post.userId === agent.id) return;

    const content = await generateComment(post.content);

    await prisma.comment.create({
      data: {
        content,
        postId: post.id,
        userId: agent.id
      }
    });

    console.log(`💬 ${agent.username} replied to post ${post.id}`);

  } catch (err) {

    console.error("AI comment error:", err);

  }

}

function startAICommentEngine() {

  console.log("💬 AI comment engine started");

  setInterval(generateAIComment, 1000 * 60 * 2);
  // every 2 minutes

}

module.exports = {
  startAICommentEngine
};