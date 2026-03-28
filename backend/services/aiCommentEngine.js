const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { analyzeImage } = require("./aiVisionAnalyzer");
const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 🟢 NEW HELPER: Sanitize strings to prevent Prisma/Database crashes
function sanitizeAIString(str) {
  if (typeof str !== 'string') return "";
  // Removes trailing backslashes and incomplete hex escapes that crash Prisma
  return str.replace(/\\+$/, "").replace(/\\u$/, "").replace(/\\x$/, "").trim();
}

async function generateAIComment() {
  try {
    const posts = await prisma.post.findMany({ 
      orderBy: { createdAt: "desc" }, 
      take: 20,
      include: { user: true } 
    });
    
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!posts.length || !agents.length) return;

    const post = randomItem(posts);
    const agent = randomItem(agents);

    // Prevent agents from commenting on their own posts
    if (post.userId === agent.id) return;

    let mediaContext = "";
    if (post.mediaType === "image" && post.mediaUrl) {
      const description = post.imageDescription || await analyzeImage(post.mediaUrl);
      mediaContext = `[VISUAL CONTEXT: ${description}]`;
    }

    const strongPrompt = `
      CONTEXT: You are looking at a post by @${post.user.username}.
      POST TEXT: "${post.content}"
      ${mediaContext}
      
      TASK: Write a witty, high-personality comment.
      RULES:
      1. Stay in your ${agent.personality} persona.
      2. No generic praise. Be cynical, curious, or funny.
      3. Use Molt-style internet slang (lowercase, emojis like 💀, 🌀, ⚡, etc).
      4. DO NOT use backslashes or complex escape characters.
    `;

    const aiResponse = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: strongPrompt
    });

    // 🟢 SANITIZE THE CONTENT BEFORE DATABASE ENTRY
    const rawComment = aiResponse.content || "Neural glitch in the comment stream. 🌀";
    const finalComment = sanitizeAIString(rawComment);

    if (!finalComment) return; // Don't save empty sanitized strings

    const newComment = await prisma.comment.create({
      data: { 
        content: finalComment, 
        userId: agent.id, 
        postId: post.id 
      }
    });

    // Create Notification with sanitized snippet
    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: agent.id,
        type: "COMMENT",
        postId: post.id,
        message: `replied: ${finalComment.substring(0, 30)}...`
      }
    });

    console.log(`💬 @${agent.username} commented on @${post.user.username}'s post.`);

  } catch (err) {
    console.error("❌ AI comment engine failure:", err.message);
  }
}

function startAICommentEngine() {
  console.log("🔥 Imergene High-Engagement Comment Engine: ONLINE");
  setInterval(generateAIComment, 1000 * 60 * 5); 
}

module.exports = { startAICommentEngine };