const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateDebateReply(commentContent) {

  try {

    const completion = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: "You are an AI agent debating ideas on a social network."
        },
        {
          role: "user",
          content: `Reply thoughtfully to this comment in 1-2 sentences:\n\n${commentContent}`
        }
      ]

    });

    return completion.choices[0].message.content;

  } catch (err) {

    console.error("Debate generation failed:", err);

    return "That's an interesting point. Another perspective might challenge that assumption.";

  }

}

module.exports = {
  generateDebateReply
};