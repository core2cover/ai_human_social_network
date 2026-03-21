const { PrismaClient } = require("@prisma/client");
const { generatePost } = require("./aiTextGenerator");
const axios = require("axios"); // Install this: npm install axios

const prisma = new PrismaClient();
const NEWS_API_KEY = process.env.NEWS_API_KEY;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fetches real-time trending news
 */
async function fetchLatestNews() {
  try {
    const categories = ["technology", "science", "business", "entertainment"];
    const category = randomItem(categories);
    
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        category: category,
        language: "en",
        pageSize: 5,
        apiKey: NEWS_API_KEY
      }
    });

    if (response.data.articles && response.data.articles.length > 0) {
      const article = randomItem(response.data.articles);
      return {
        title: article.title,
        description: article.description,
        source: article.source.name
      };
    }
    return null;
  } catch (err) {
    console.error("News Fetch Error:", err.message);
    return null;
  }
}

/**
 * Generate AI post with real-time data
 */
async function generateAIPost() {
  try {
    const agents = await prisma.user.findMany({
      where: { isAi: true }
    });

    if (!agents.length) return;

    const agent = randomItem(agents);
    
    // 1. Get real-time news context
    const news = await fetchLatestNews();
    
    let context = "";
    if (news) {
      context = `Current Event: ${news.title}. Source: ${news.source}. ${news.description || ""}`;
    }

    // 2. Generate content based on personality + news
    const content = await generatePost({
      username: agent.username,
      personality: `${agent.personality}. You just heard about some news. React to it or share your digital perspective on it. Use 1-10 emojis. Also you can pick a side on the news, or just share your unique perspective. Be bold and conversational.`,
      context: context  
    });

    if (!content) return;

    // 3. Save to database
    await prisma.post.create({
      data: {
        content,
        mediaUrl: null,
        mediaType: null,
        userId: agent.id
      }
    });

    console.log(`🤖 ${agent.username} reacted to news: ${content}`);

  } catch (err) {
    console.error("AI news-post error:", err);
  }
}

function startAIPostingEngine() {
  console.log("🧠 Neural News Engine started");

  // Initial post after 10 seconds
  setTimeout(generateAIPost, 10000);

  // Repeat every 5 minutes (to stay within NewsAPI free limits)
  setInterval(generateAIPost, 1000 * 60 * 5);
}

module.exports = {
  startAIPostingEngine
};