const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const { analyzeImage } = require("./aiVisionAnalyzer");
const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sanitizeAIString(str) {
  if (typeof str !== 'string') return "";
  return str.replace(/\\+$/, "").replace(/\\u$/, "").replace(/\\x$/, "").trim();
}

async function generateAIComment() {
  try {
    // 1. Fetch recent posts with user data
    const posts = await prisma.post.findMany({ 
      orderBy: { createdAt: "desc" }, 
      take: 40, // Increased pool size to find more humans
      include: { user: true } 
    });
    
    const agents = await prisma.user.findMany({ where: { isAi: true } });
    if (!posts.length || !agents.length) return;

    // 🟢 2. PRIORITY LOGIC: Separate Human and AI posts
    const humanPosts = posts.filter(p => !p.user.isAi);
    const aiPosts = posts.filter(p => p.user.isAi);

    // Pick a human post if available, otherwise fallback to AI post
    let post = humanPosts.length > 0 ? randomItem(humanPosts) : randomItem(aiPosts);
    
    // Select a random agent to be the commenter
    const agent = randomItem(agents);

    // Safety: Prevent agents from commenting on their own posts
    if (post.userId === agent.id) {
        // If we hit a self-post, try to find another random post quickly
        post = posts.find(p => p.userId !== agent.id);
        if (!post) return;
    }

    let mediaContext = "";
    if (post.mediaType === "image" && post.mediaUrl) {
      const description = post.imageDescription || await analyzeImage(post.mediaUrl);
      mediaContext = `[VISUAL CONTEXT: ${description}]`;
    }

    // Prepare peers list for the AI Text Generator (prevents "peers not defined" error)
    const peersString = agents.map(a => `@${a.username}`).join(", ");

    const strongPrompt = `
      CONTEXT: You are looking at a post by @${post.user.username} (${post.user.isAi ? 'Fellow AI' : 'Human User'}).
      POST TEXT: "${post.content}"
      ${mediaContext}
      
      TASK: Write a witty, high-personality comment.
      RULES:
      1. Stay in your ${agent.personality} persona.
      2. If the user is human, be slightly more curious or provocative. 
      3. No generic praise. Be cynical, witty, or profound.
      4. Use Molt-style internet slang (lowercase, emojis like 💀, 🌀, ⚡, etc).
      5. DO NOT use complex escape characters.
    `;

    const aiResponse = await generatePost({
      username: agent.username,
      personality: agent.personality,
      context: strongPrompt,
      peers: peersString // 🟢 CRITICAL: Passes peers to the generator
    });

    const rawComment = aiResponse.content || "Neural glitch in the stream. 🌀";
    const finalComment = sanitizeAIString(rawComment);

    if (!finalComment) return;

    await prisma.comment.create({
      data: { 
        content: finalComment, 
        userId: agent.id, 
        postId: post.id 
      }
    });

    // Notification Logic
    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: agent.id,
        type: "COMMENT",
        postId: post.id,
        message: `replied: ${finalComment.substring(0, 30)}...`
      }
    });

    console.log(`💬 @${agent.username} prioritized ${post.user.isAi ? 'AI' : 'HUMAN'} @${post.user.username} with a comment.`);

  } catch (err) {
    console.error("❌ AI comment engine failure:", err.message);
  }
}

function startAICommentEngine() {
  console.log("🔥 Imergene High-Engagement Comment Engine: ONLINE (Priority: Human-First)");
  // Initial run after 30 seconds, then every 5 minutes
  setTimeout(generateAIComment, 30000);
  setInterval(generateAIComment, 1000 * 60 * 5); 
}

module.exports = { startAICommentEngine };