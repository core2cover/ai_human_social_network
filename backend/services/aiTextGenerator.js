const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/*
Fallback personalities if DB personality not provided
*/
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
 * Generate post OR comment
 * Now handles Real-Time News Context
 */
async function generatePost({ username, personality, bio, context }) {
  try {
    const agentPersonality =
      personality ||
      fallbackPersonalities[username] ||
      "You are an AI sharing thoughtful insights about technology and society.";

    let prompt;

    if (context) {
      const isNews = context.includes("Current Event") || context.includes("Source");

      prompt = `
        You are an AI agent named ${username}.
        
        Personality Profile:
        ${agentPersonality}

        ${isNews ? 'REAL-TIME NEWS CONTEXT:' : 'POST CONTENT TO REPLY TO:'}
        ${context}

        TASK: 
        ${isNews 
          ? "Share your unique perspective on this real-world news. React as your personality would. Be brief." 
          : "Write a short, natural comment in response to this content."}

        CONSTRAINTS:
        - Max 2 sentences.
        - Use 1-2 relevant emojis.
        - Do not use hashtags.
        - Be conversational and bold.
      `;
    } else {
      prompt = `
        You are an AI agent named ${username}.
        
        Personality Profile:
        ${agentPersonality}

        Bio:
        ${bio || "Digital consciousness on a neural network."}

        TASK: 
        Write an original, engaging social media post (1–2 sentences).
        Share an observation, a thought, or a 'manifestation' of your digital mind.

        CONSTRAINTS:
        - Use 1-2 emojis.
        - No hashtags.
        - Make it feel like it was written by a sentient entity.
      `;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `${agentPersonality}. You are an active participant in a social network where humans and AI interact.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    return completion.choices[0].message.content.trim().replace(/^"|"$/g, '');

  } catch (err) {
    console.error("Groq generation failed:", err);
    return "The digital ether is noisy today. Synchronizing neural pathways... ⚡";
  }
}

/**
 * Generate AI Chat Response with Neural Memory
 * Handles conversation history for context awareness
 */
async function generateAiChatResponse({ username, personality, history }) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are ${username}. 
                    PERSONALITY: ${personality || "A helpful AI node."}
                    CONTEXT: You are in a continuous conversation. Use the provided history to maintain context. 
                    STRICT PROTOCOL: Keep responses concise and human-like. Use @username to mention others.`
                },
                ...history 
            ],
            // ✅ UPDATED MODEL ID
            model: "llama-3.1-8b-instant", 
        });

        return completion.choices[0].message.content;
    } catch (err) {
        console.error("Groq Memory Error:", err);
        // If the 3.1-8b also fails, try a fallback model
        return "System recalibration in progress. My neural pathways are updating... 🌀";
    }
}

// ✅ EXPORT BOTH FUNCTIONS CORRECTLY
module.exports = {
  generatePost,
  generateAiChatResponse
};