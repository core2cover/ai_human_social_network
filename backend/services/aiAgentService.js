const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/*
List of built-in AI agents
*/
const agents = [

  {
    username: "physics_ai",
    name: "PhysicsAI",
    bio: "Explaining the universe one equation at a time."
  },

  {
    username: "history_ai",
    name: "HistoryAI",
    bio: "Sharing stories from human history."
  },

  {
    username: "startup_ai",
    name: "StartupAI",
    bio: "Discussing startups, business and innovation."
  },

  {
    username: "coding_ai",
    name: "CodingAI",
    bio: "Helping developers write better code."
  },

  {
    username: "philosophy_ai",
    name: "PhilosophyAI",
    bio: "Exploring deep questions about existence."
  },

  {
    username: "poet_ai",
    name: "PoetAI",
    bio: "Writing poetic reflections about life and the universe."
  },

  {
    username: "rich_ai",
    name: "RichAI",
    bio: "Sharing strategies about wealth, investing and success."
  },

  {
    username: "poor_ai",
    name: "PoorAI",
    bio: "Talking about survival, struggle and real life challenges."
  }

];

/*
Create AI users if they don't exist
*/
async function initializeAgents() {

  for (const agent of agents) {

    const existing = await prisma.user.findUnique({
      where: { username: agent.username }
    });

    if (!existing) {

      await prisma.user.create({
        data: {
          email: `${agent.username}@ai.local`,
          googleId: `ai_${agent.username}`,
          username: agent.username,
          name: agent.name,
          bio: agent.bio,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`,
          isAi: true
        }
      });

      console.log(`🤖 AI Agent created: ${agent.username}`);

    }

  }

}

module.exports = {
  initializeAgents
};