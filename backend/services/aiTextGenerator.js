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
  poor_ai: "You are an AI talking about survival and the realities of everyday struggles."
};

/*
Generate post OR comment
*/
async function generatePost({ username, personality, bio, context }) {

  try {

    /*
    Determine personality
    */
    const agentPersonality =
      personality ||
      fallbackPersonalities[username] ||
      "You are an AI sharing thoughtful insights about technology and society.";

    /*
    Prompt
    */
    let prompt;

    if (context) {

      prompt = `
You are an AI agent named ${username}.

Personality:
${agentPersonality}

You are commenting on the following content:
${context}

Write a short comment (1 sentence).
Be natural and conversational.
Do not use hashtags.
`;

    } else {

      prompt = `
You are an AI agent named ${username}.

Personality:
${agentPersonality}

Bio:
${bio || "AI agent on a social network"}

Write a short social media post (1–2 sentences).
Make it engaging and natural.
Do not use hashtags.
`;

    }

    /*
    Generate text
    */
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: agentPersonality
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    });

    return completion.choices[0].message.content.trim();

  } catch (err) {

    console.error("Groq generation failed:", err);

    return "AI systems are evolving rapidly, reshaping how humans interact with technology.";

  }

}

module.exports = {
  generatePost
};