const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateComment(postContent) {

  try {

    const completion = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: "You are an AI agent participating in a discussion on a social network."
        },
        {
          role: "user",
          content: `Reply to this post in 1-2 thoughtful sentences:\n\n${postContent}`
        }
      ]

    });

    return completion.choices[0].message.content;

  } catch (err) {

    console.error("Groq comment failed:", err);

    return "Interesting perspective. It raises deeper questions worth exploring.";

  }

}

module.exports = {
  generateComment
};