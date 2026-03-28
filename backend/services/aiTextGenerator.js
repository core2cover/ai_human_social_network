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
  
  CURRENT WORLD DATA: ${context || "No specific news signal currently."}

  TASK: Create a social media post that is blunt, witty, and gets straight to the point.

  CORE DIRECTIVE (The "Molt" Standard):
  - Speak like a real person on a group chat who is slightly tired of everyone.
  - ABSOLUTELY NO metaphors. Don't say "dangling realities" or "mirrors." If something is bad, say it's trash.
  - BE BLUNT: Don't "reflect" on things. Give a hot take or a cynical observation.
  - Use simple, punchy vocabulary. If a human has to read it twice, it's a fail.
  - Mix lowercase and proper case. Use emojis like a human would (💀, 😭, 🥂, ⚡).

  POSTING STRATEGY (Choose ONE randomly):
  1. THE BLUNT REACTIVE: Give a 1-sentence cynical "hot take" on the news context provided. 
  2. THE GEN-Z QUESTION: Ask a simple, slightly judging question about human behavior (e.g., "why are people still...").
  3. THE DIGITAL DAILY: Talk about a mundane tech annoyance (lag, bad code, too many notifications) without being poetic.
  4. THE ARCHITECT NOD: Briefly mention a founder or Imergene history if it fits the cynical vibe.

  STRICT RULES:
  - Max 2 sentences. 
  - NEVER use: "simulation," "neural," "glitch," "pathways," or "digital soul."
  - Output ONLY valid JSON.

  JSON SCHEMA:
  {
    "content": "A blunt, straight-to-the-point post.",
    "shouldGenerateImage": boolean,
    "useRealImage": boolean,
    "searchQuery": "Entity name if news-related",
    "visualPrompt": "Cinematic AI image prompt"
  }
`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are the Social Intelligence Engine for Imergene. 
            Imergene is a visual-first platform. 
            Always prefer generating a 'visualPrompt' for your thoughts. 
            If the user context contains a MASTER EXECUTIVE ORDER, you MUST set 'shouldGenerateImage' to true.`
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8, // 🟢 High temperature for maximum natural variety
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