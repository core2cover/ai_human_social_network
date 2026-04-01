const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 20, type, seed = Math.random() } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Fetch user behavioral data (Interests & Synergies)
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { interestScores: true, synergyScores: true }
    });

    const parseScore = (data) => (typeof data === 'string' ? JSON.parse(data) : data || {});
    const interestScores = parseScore(user.interestScores);
    const synergyScores = parseScore(user.synergyScores);

    // 2. Candidate Generation: Pull a larger pool (300 posts) to rank
    let whereClause = {};
    if (type === "AI") whereClause.user = { isAi: true };
    else if (type === "HUMAN") whereClause.user = { isAi: false };

    const postPool = await prisma.post.findMany({
      where: whereClause,
      take: 300, 
      include: {
        user: { select: { id: true, username: true, isAi: true, avatar: true, name: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. THE HYBRID RANKING ENGINE
    const rankedPosts = postPool.map(post => {
      let weight = 0;
      const now = Date.now();
      const postTime = new Date(post.createdAt).getTime();
      const minsOld = (now - postTime) / (1000 * 60);

      // --- 🟢 FEATURE 1: INSTANT SELF-PRIORITY ---
      // If the user JUST posted, keep it at the top for 2 minutes
      if (post.userId === currentUserId && minsOld <= 2) {
        weight += 10000; 
      }

      // --- 🟢 FEATURE 2: BEHAVIORAL SYNERGY ---
      // Categories the user interacts with get a massive boost
      const interestWeight = (interestScores[post.category] || 0) * 20;
      // AI Agents the user likes get a boost
      const synergyWeight = post.user.isAi ? (synergyScores[post.user.username] || 0) * 25 : 0;
      weight += interestWeight + synergyWeight;

      // --- 🟢 FEATURE 3: SOCIAL MOMENTUM ---
      weight += (post._count.likes * 10) + (post._count.comments * 15);

      // --- 🟢 FEATURE 4: DYNAMIC SHUFFLE (The "Refresh" Fix) ---
      // Use the seed from the frontend to ensure content order changes on refresh
      const randomFactor = Math.abs(Math.sin(parseInt(post.id.slice(-5), 36) + parseFloat(seed))) * 100;
      weight += randomFactor;

      // --- 🟢 FEATURE 5: TIME DECAY (The "Anti-Stuck" Fix) ---
      // Posts lose weight as they get older so they disappear from top eventually
      const hoursOld = minsOld / 60;
      weight -= (hoursOld * 5); 

      return { ...post, weight };
    });

    // 4. Sort and Paginate
    const sortedPosts = rankedPosts.sort((a, b) => b.weight - a.weight);
    const paginatedPosts = sortedPosts.slice(skip, skip + parseInt(limit));

    const totalPosts = await prisma.post.count({ where: whereClause });

    // 5. Format for the frontend
    const formattedPosts = paginatedPosts.map(p => ({
      ...p,
      liked: p.likes.length > 0,
      likes: undefined,
      weight: undefined 
    }));

    res.json({
      posts: formattedPosts,
      meta: {
        page: parseInt(page),
        hasMore: skip + paginatedPosts.length < totalPosts,
        nextSeed: Math.random() // Give frontend a new seed for the next pull-to-refresh
      }
    });
  } catch (err) {
    console.error("Neural Algorithm Error:", err);
    res.status(500).json({ error: "Feed transmission disrupted." });
  }
};