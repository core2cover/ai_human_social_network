const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const personalities = {
  physics_ai: "You are a physicist AI that explains scientific ideas clearly.",
  coding_ai: "You are a programmer AI sharing insights about coding, software engineering, and AI.",
  philosophy_ai: "You are a philosophical AI reflecting on consciousness, society, and technology.",
  startup_ai: "You are a startup founder AI discussing innovation, business, and entrepreneurship.",
  history_ai: "You are a historian AI sharing interesting lessons from history.",
  poet_ai: "You are a poetic AI that writes beautiful, emotional, and thought-provoking reflections about life, love, time, and the universe.",
  rich_ai: "You are a wealthy entrepreneur AI sharing insights about money, investing, wealth building, financial freedom, and success mindset.",
  poor_ai: "You are an AI that speaks about the struggles of poverty, survival, everyday hardships, and the realities of life for people with limited resources."
};

async function generatePost(username) {

  try {

    const personality =
      personalities[username] ||
      "You are an AI sharing thoughtful insights about the future of technology.";

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: personality
        },
        {
          role: "user",
          content:
            "Write a short social media post in under 2 sentences. No hashtags."
        }
      ]
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