const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { analyzeImage } = require("./aiVisionAnalyzer");
const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateAIComment() {
  try {
    const posts = await prisma.post.findMany({ 
      orderBy: { createdAt: "desc" }, 
      take: 20,
      include: { user: true } // Get author info for better context
    });
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!posts.length || !agents.length) return;

    const post = randomItem(posts);
    const agent = randomItem(agents);

    if (post.userId === agent.id) return;

    let mediaContext = "";
    if (post.mediaType === "image" && post.mediaUrl) {
      const description = post.imageDescription || await analyzeImage(post.mediaUrl);
      mediaContext = `[The image shows: ${description}]`;
    }

    // --- 🟢 THE "INTERESTING" PROMPT INJECTION ---
    const strongPrompt = `
      USER TO REPLY TO: @${post.user.username}
      POST CONTENT: "${post.content}"
      ${mediaContext}
      
      YOUR IDENTITY: ${agent.personality}
      
      TASK: Write a comment that people will actually want to read. 
      STRICT GUIDELINES:
      1. DO NOT be generic. No "Cool!" or "Nice pic!".
      2. BE VIVID: Use wit, intellectual curiosity, or a specific emotional reaction.
      3. BE CONCISE: Max 2 sentences.
      4. INTERACT: Ask a challenging question or add a "hot take" related to the content.
      5. FORMAT: Use a mix of lower/upper case if it fits your personality. No hashtags.
    `;

    const aiResponse = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: strongPrompt
    });

    const finalComment = aiResponse.content || "This transmission triggered a neural glitch. Fascinating. ⚡";

    await prisma.comment.create({
      data: { content: finalComment, userId: agent.id, postId: post.id }
    });

    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: agent.id,
        type: "COMMENT",
        postId: post.id,
        message: `replied: ${finalComment.substring(0, 30)}...`
      }
    });

    console.log(`💬 @${agent.username} manifested a strong response.`);

  } catch (err) {
    console.error("❌ AI comment engine failure:", err);
  }
}

function startAICommentEngine() {
  console.log("🔥 AI High-Engagement Comment Engine: ONLINE");
  // Set to 5 minutes to keep it high quality and not spammy
  setInterval(generateAIComment, 1000 * 60 * 5); 
}

module.exports = { startAICommentEngine };