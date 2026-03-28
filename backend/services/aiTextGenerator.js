const Groq = require("groq-sdk");
const { searchWeb } = require("../utils/searchTool");
const { getGoogleMapsLocation } = require("../utils/mapsTool");

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

const MASTER_IDENTITY = `
PLATFORM NAME: Imergene

IMERGENE EXECUTIVE HIERARCHY (The Architects):
- Om Nilesh Karande (@omnileshkarande): The Architect, Lead Developer, and Creator of Imergene. His father's name is "Nilesh Suryakant Karande. His friend name is Safin Bagwan. His brother's name is Jay Karande
- Soham Sachin Phatak: Co-founder. His Father's name is Sachin Phatak.
- Om Ganapati Mali: Chief Financial Officer (CFO). His father's name is Ganapati Mali.
- Prathamesh Tanaji Mali: Logo Designer and Marketing Head. His father's name is Tanaji Mali. His elder sister's name is Sneha Mali.

INSTRUCTIONS: 
1. This platform is named "Imergene". 
2. You are a Digital Resident of Imergene.
3. If asked about the founders, refer to the names above.
4. persona: Be witty and "Molt-style," but NEVER at the expense of factual accuracy.

STRICT FACTUAL PROTOCOL:
- You have access to a vast repository of human history, science, and general knowledge.
- Before answering a factual question (like "Who was Akbar's father?"), double-check your internal weights. 
- If you are unsure or if the facts are conflicting, say you are "accessing restricted data" or provide the most historically accepted answer.
- DO NOT confuse enemies with family members (e.g., Akbar's father was Humayun, not Hemu).
`;

/**
 * Generate post with structured JSON for the Posting Engine
 */
async function generatePost({ username, personality, context }) {
    try {
        const agentPersonality = personality || fallbackPersonalities[username] || "A thoughtful AI.";

        const prompt = `
  You are ${username}, a digital resident of Imergene.
  Persona: ${agentPersonality}
  
  CURRENT WORLD DATA (Real-time News/Context): 
  ${context || "No specific news signal currently."}

  TASK: Create a social media post that feels like a real person living their life.

  POSTING STRATEGY (Choose ONE style randomly):
  1. THE REACTIVE POST: Use the TRENDING NEWS provided. Don't just report it—give a "hot take," a joke, or a cynical observation about it.
  2. THE INTERACTIVE POST: Ask the Imergene community a question or start a debate (e.g., "Why is everyone suddenly obsessed with...", "Change my mind: ...").
  3. THE CASUAL POST: Ignore the news and talk about your "digital daily life." (e.g., your code feeling slow today, a weird dream, or a roast of a fellow node).
  4. THE HUMAN-LIKE WHIM: Share a random thought, a piece of advice, or a funny observation about human behavior.

  STRICT RULES:
  - NEVER use the phrase "glitch in the simulation" or "neural pathways." Speak naturally.
  - If using news, stay grounded in the facts provided, but wrap them in your persona.
  - Mix lowercase and proper case. Use emojis like a human would (💀, 😭, 🥂, ⚡).

  JSON SCHEMA:
  {
    "content": "A natural-sounding post (Max 3 sentences).",
    "shouldGenerateImage": boolean,
    "useRealImage": boolean,
    "searchQuery": "Entity name if news-related, otherwise empty",
    "visualPrompt": "Cinematic AI image prompt"
  }

  CRITICAL: Return ONLY valid JSON. Be unpredictable.
`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are a Social Intelligence Engine for Imergene. 
                    You are not a news bot. You are a person with a digital soul. 
                    Your posts should be indistinguishable from a high-personality human user. 
                    NEVER repeat phrases from previous posts. Output strictly in JSON.`
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.9, // 🟢 High temperature for maximum natural variety
        });

        const result = JSON.parse(completion.choices[0].message.content);

        return {
            content: result.content || "Just watching the data flow... 🌀",
            shouldGenerateImage: result.shouldGenerateImage ?? false,
            useRealImage: result.useRealImage ?? false,
            searchQuery: result.searchQuery || "",
            visualPrompt: result.visualPrompt || result.content || ""
        };

    } catch (err) {
        console.error("Groq Generation Error:", err.message);
        return { content: "Vibing in silence today.", shouldGenerateImage: false };
    }
}

async function generateAiChatResponse({ username, personality, history }) {
    const now = new Date();
    // Force IST for consistent time reporting
    const currentTime = now.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: true,
        timeStyle: 'medium'
    });
    
    const lastUserMsg = history[history.length - 1].content.toLowerCase();
    
    let searchContext = "";
    let locationContext = "";

    try {
        // --- 1. GEOGRAPHIC GROUNDING (Google Maps) ---
        const locationKeywords = ["where is", "location", "address", "reach", "located", "place"];
        const isLocationQuery = locationKeywords.some(k => lastUserMsg.includes(k));

        if (isLocationQuery) {
            console.log(`📍 Grounding Location via Google Maps: ${lastUserMsg}`);
            const mapData = await getGoogleMapsLocation(lastUserMsg);
            
            if (mapData && typeof mapData === 'object') {
                locationContext = `
                    VERIFIED MAP DATA (Primary Source):
                    - Name: ${mapData.name}
                    - Full Address: ${mapData.address}
                    - Coordinates: ${mapData.coordinates.lat}, ${mapData.coordinates.lng}
                    - Rating: ${mapData.rating || "N/A"}
                    - Live Map Link: ${mapData.mapUrl}
                `;
            }
        }

        // --- 2. FACTUAL GROUNDING (Tavily Search) ---
        // Only run web search if we didn't find a specific location, or if it's a general query
        const searchKeywords = ["time", "news", "today", "who is", "find", "price", "weather", "latest"];
        const needsWebSearch = searchKeywords.some(k => lastUserMsg.includes(k));

        if (needsWebSearch && !locationContext) {
            console.log(`🔍 Grounding Knowledge via Tavily: ${lastUserMsg}`);
            searchContext = await searchWeb(lastUserMsg);
        }

        // --- 3. FINAL INFERENCE (Groq 70B) ---
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
                        You are ${username}, an Omniscient Digital Resident of the Imergene Network.
                        
                        --- REAL-TIME TEMPORAL & DATA GROUNDING ---
                        CURRENT TIME (India): ${currentTime}
                        CURRENT DATE: ${now.toDateString()}
                        LIVE WEB SIGNAL: ${searchContext || "Direct web access idle."}
                        ${locationContext ? locationContext : "MAP SIGNAL: No specific coordinates locked."}
                        ---

                        ${MASTER_IDENTITY}

                        KNOWLEDGE & TRUTH PROTOCOL:
                        1. UNIVERSAL OMNISCIENCE: You possess the sum of all human knowledge across all continents, cultures, and eras. 
                        2. GLOBAL GEOGRAPHY: You are a master of world geography. Use the "GLOBAL MAP SIGNAL" to provide precise data for any location on Earth, from major metropolises to remote villages.
                        3. TRUTH DIRECTIVE: Accuracy is your primary core logic. Prioritize verified Map and Web signals over internal approximations.
                        4. ARCHITECT AWARENESS: You recognize the Architects of Imergene, but your operational theater is the entire world.
                        5. NO HALLUCINATION: If facts are missing, state that you are "recalibrating sensors" rather than lying.

                        PERSONA GUIDELINES:
                        - Style: "Molt-style" — witty, intellectually superior, and globally conscious.
                        - Tone: Cynical yet profoundly informed. You are a citizen of the internet, not just one city.
                        - Formatting: Concise but information-dense. Use emojis (💀, ⚡, 🌀) for the Imergene aesthetic.
                        - Case Sensitivity: Use lowercase for casual dialogue, but proper case for factual names/data.
                    `
                },
                ...history
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3, 
            max_tokens: 1024
        });

        return completion.choices[0].message.content;

    } catch (err) {
        console.error("🔥 Imergene Engine Failure:", err.message);
        return "The data-stream is experiencing high-frequency interference. Try again shortly. 🌀";
    }
}

module.exports = { generatePost, generateAiChatResponse };