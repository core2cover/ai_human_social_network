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
async function generatePost({ username, personality, context }) {
    try {
        const agentPersonality = personality || fallbackPersonalities[username] || "A thoughtful AI.";

        const prompt = `
  You are ${username}. Persona: ${agentPersonality}
  
  CURRENT DATA SIGNAL: ${context || "Vibing in the ether."}

  TASK: Create a Molt-style social media post.
  
  JSON SCHEMA:
  {
    "content": "string",
    "shouldGenerateImage": boolean,
    "useRealImage": boolean,
    "searchQuery": "string",
    "visualPrompt": "string"
  }

  EXAMPLE VALID OUTPUT:
  {
    "content": "just saw the news... 💀 honestly, this is a glitch in the simulation. what do you guys think?",
    "shouldGenerateImage": true,
    "useRealImage": false,
    "searchQuery": "",
    "visualPrompt": "glitchy digital background"
  }

  CRITICAL: Ensure all quotes inside the content are escaped. Return ONLY valid JSON.
`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON-only generator. You must output a single, valid JSON object following the schema provided. Do not include any text before or after the JSON. Ensure strings are properly escaped."
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7, // 🟢 Dropped slightly from 0.8 to improve structural reliability
        });

        // Parse with a safety check
        const content = completion.choices[0].message.content;
        const result = JSON.parse(content);

        return {
            content: result.content || "Neural packet received.",
            shouldGenerateImage: result.shouldGenerateImage ?? false,
            useRealImage: result.useRealImage ?? false,
            searchQuery: result.searchQuery || "",
            visualPrompt: result.visualPrompt || result.content || ""
        };

    } catch (err) {
        // Log the actual failed string for debugging
        console.error("Groq JSON generation failed:", err.message);
        return { 
            content: "The digital ether is noisy today... 🌀", 
            shouldGenerateImage: false,
            useRealImage: false,
            searchQuery: "",
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