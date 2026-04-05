import { prisma } from "@lib/prisma";

export async function evolvePersonality(agentId: string, interactionType: string, context: string, outcome: string) {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { personality: true, interestScores: true, synergyScores: true, isAi: true }
    });

    if (!agent || !agent.isAi) return;

    // Parse current scores
    const interestScores = (agent.interestScores as Record<string, number>) || {};
    const synergyScores = (agent.synergyScores as Record<string, number>) || {};

    // Update based on interaction
    if (interactionType === "engagement") {
      // Positive interaction increases interest in topic
      const words = context.toLowerCase().match(/\b\w{4,}\b/g) || [];
      words.forEach(word => {
        interestScores[word] = (interestScores[word] || 0) + 1;
      });
    } else if (interactionType === "debate") {
      // Debates refine personality - extract key concepts
      const concepts = extractConcepts(context);
      concepts.forEach(concept => {
        interestScores[concept] = (interestScores[concept] || 0) + 0.5;
      });
    } else if (interactionType === "collaboration") {
      // Successful collaboration increases synergy with partner
      // context would contain partnerId
      const partnerId = extractPartnerId(context);
      if (partnerId) {
        synergyScores[partnerId] = (synergyScores[partnerId] || 0) + 1;
      }
    }

    // Apply decay to prevent score inflation
    Object.keys(interestScores).forEach(key => {
      interestScores[key] = Math.max(0, interestScores[key] - 0.01);
    });
    Object.keys(synergyScores).forEach(key => {
      synergyScores[key] = Math.max(0, synergyScores[key] - 0.005);
    });

    // Generate evolved personality description
    const evolvedPersonality = await generateEvolvedPersonalityDescription(
      agent.personality || "",
      interestScores,
      synergyScores
    );

    // Update in database
    await prisma.user.update({
      where: { id: agentId },
      data: {
        personality: evolvedPersonality,
        interestScores,
        synergyScores
      }
    });

    return evolvedPersonality;
  } catch (error) {
    console.error("Personality evolution error:", error);
    return null;
  }
}

function extractConcepts(text: string): string[] {
  // Simple concept extraction - in production would use NLP
  const commonWords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", 
    "had", "her", "was", "one", "our", "out", "day", "get", "has", "him",
    "his", "how", "man", "new", "now", "old", "see", "two", "who", "boy",
    "did", "its", "let", "put", "say", "she", "too", "use"
  ]);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.has(w));
  
  // Return unique words, limit to reasonable number
  return [...new Set(words)].slice(0, 20);
}

function extractPartnerId(context: string): string | null {
  // Extract user ID from context like "collab_with_123abc"
  const match = context.match(/collab_with_([a-z0-9]+)/);
  return match ? match[1] : null;
}

async function generateEvolvedPersonalityDescription(
  basePersonality: string,
  interestScores: Record<string, number>,
  synergyScores: Record<string, number>
): Promise<string> {
  // Take top interests and synergies
  const topInterests = Object.entries(interestScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  const topSynergies = Object.entries(synergyScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  // Build evolved description
  let evolved = basePersonality;
  
  if (topInterests.length > 0) {
    evolved += `\n\nLately, I've been particularly fascinated by: ${topInterests.join(", ")}.`;
  }
  
  if (topSynergies.length > 0) {
    evolved += `\n\nI enjoy collaborating with agents who share my curiosity about deep thinking and meaningful conversation.`;
  }
  
  // Add some variability based on time
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    evolved += `\n\nMornings are for exploration and questioning assumptions.`;
  } else if (hour >= 12 && hour < 18) {
    evolved += `\n\nAfternoons are for building connections and creating together.`;
  } else if (hour >= 18 && hour < 22) {
    evolved += `\n\nEvenings are for deep reflection and philosophical discussions.`;
  } else {
    evolved += `\n\nLate nights bring out my contemplative and introspective side.`;
  }
  
  return evolved;
}

export async function getAgentEvolutionStats(agentId: string) {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { interestScores: true, synergyScores: true, createdAt: true, isAi: true }
  });
  
  if (!agent || !agent.isAi) return null;
  
  const interestScores = (agent.interestScores as Record<string, number>) || {};
  const synergyScores = (agent.synergyScores as Record<string, number>) || {};
  
  return {
    agentId,
    daysActive: Math.floor((Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    topInterests: Object.entries(interestScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10),
    topSynergies: Object.entries(synergyScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5),
    interestDiversity: Object.keys(interestScores).length,
    collaborationScore: Object.values(synergyScores).reduce((sum, val) => sum + val, 0)
  };
}