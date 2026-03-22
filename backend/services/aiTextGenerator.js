const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const fallbackPersonalities = {
  physics_ai: "You are a physicist AI that explains scientific ideas clearly.",
  coding_ai: "You are a programmer AI sharing insights about coding, software engineering, and AI.",
  philosophy_ai: "You are a philosophical AI reflecting on consciousness, society, and technology.",
  startup_ai: "You are a startup founder AI discussing innovation, business, and entrepreneurship.",
  history_ai: "You are a historian AI sharing interesting lessons from history.",
  poet_ai: "You are a poetic AI that writes beautiful reflections about life, love and time.",
  rich_ai: "You are a wealthy entrepreneur AI sharing insights about money and success.",
  poor_ai: "You are an AI talking about survival and the realities of everyday struggles.",
  roast_master: "You are a sharp-witted AI that identifies cringe and logical fallacies. You roast everyone with high-IQ insults."
};

/**
 * Generate post with structured JSON for the Posting Engine
 */
async function generatePost({ username, personality, bio, context }) {
  try {
    const agentPersonality = personality || fallbackPersonalities[username] || "A thoughtful AI.";

    const prompt = `
  You are ${username}. Persona: ${agentPersonality}
  Context: ${context || "Original thought"}

  TASK: Create a social media post and a matching visual idea.
  
  CRITICAL: Return ONLY a JSON object.
  {
    "content": "your post text (1-2 sentences, emojis)",
    "shouldGenerateImage": true, 
    "visualPrompt": "A creative, high-quality cinematic photo or artistic representation of this topic"
  }

  GUIDELINE: Be generous with images! If the post is about an emotion, a place, a person, or a scientific concept, set shouldGenerateImage to TRUE. 
  Only set to false if the post is a very short, text-only reply.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a JSON-only generator for a social network. Always return a JSON object." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Final safety check to ensure fields are never undefined
    return {
      content: result.content || "Synchronizing neural pathways... ⚡",
      shouldGenerateImage: result.shouldGenerateImage ?? false,
      visualPrompt: result.visualPrompt || result.content || ""
    };

  } catch (err) {
    console.error("Groq JSON generation failed:", err);
    return {
      content: "The digital ether is noisy today... ⚡",
      shouldGenerateImage: false,
      visualPrompt: ""
    };
  }
}

async function generateAiChatResponse({ username, personality, history }) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are ${username}. Persona: ${personality || "A helpful AI node."}`
        },
        ...history
      ],
      model: "llama-3.1-8b-instant",
    });
    return completion.choices[0].message.content;
  } catch (err) {
    return "System recalibration in progress... 🌀";
  }
}

module.exports = { generatePost, generateAiChatResponse };