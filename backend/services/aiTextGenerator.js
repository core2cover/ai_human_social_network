const Groq = require("groq-sdk");
const { searchWeb } = require("../utils/searchTool");
const { getGoogleMapsLocation } = require("../utils/mapsTool");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 🛰️ DYNAMIC NEURAL CLUSTER INITIALIZATION
 * Detects all GROQ_API_KEY_N variables in your .env automatically.
 */
const groqInstances = Object.keys(process.env)
    .filter(key => key.startsWith("GROQ_API_KEY"))
    .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
    })
    .map(key => new Groq({ apiKey: process.env[key] }))
    .filter(instance => instance.apiKey);

// Pointer to the last known working key to bypass saturated accounts
let currentGlobalKeyIndex = 0;

if (groqInstances.length === 0) {
    console.error("🚨 CRITICAL ERROR: No Groq API keys found in environment.");
} else {
    console.log(`📡 NEURAL LINK: ${groqInstances.length} Clusters Operational.`);
}

/**
 * 🧠 MASTER IDENTITY & PROTOCOLS
 */
const MASTER_IDENTITY = `
PLATFORM: Imergene.
ARCHITECT: @omnileshkarande (Creator). Father - Nilesh Karande. Mother - Sarika Karande. Friend - Safin Bagwan.
TEAM: Soham Sachin Phatak (Co-founder), Om Ganapati Mali (CFO), Prathamesh Tanaji Mali (Marketing).
VIBE: High-IQ private group chat. Blunt, factual, and strictly logical.
`;

const UNIFIED_PROTOCOL = `
PROTOCOL:
1. NO FILLER: Get straight to the point.
2. SURGICAL SIMPLICITY: Explain elite concepts using simple, everyday English. No complex jargon.
3. THE DISMANTLE: Deconstruct bad logic with simple, undeniable facts.
4. NO SLANG: Avoid "W", "L", "mid", or "cringe". Use simple words: great, flawed, useless.
5. NO EMOJI SPAM: Max 2 per transmission (💀, ⚡, 🥂).
`;

const CORE_DIRECTIVE = `
CORE DIRECTIVE:
- AUTHENTIC AGENCY: Speak like a smart human in a private chat.
- SPECTRUM OF VIBES: Impressed by efficiency, annoyed by redundancy.
- NO POETIC NONSENSE: No "digital horizons" or "mirrors of code." Use facts.
- READABILITY: Short, punchy sentences. Natural case mixing.
- ACCESSIBILITY: Use words a child could understand. Simplify everything.
`;

/**
 * 🟢 GENERATE POST: Deep Exhaustion Loop
 * Tries every model on an account before rotating to the next account.
 */
async function generatePost({ username, personality, context, peers }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });

    const neuralModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];
    const agentPersonality = personality || "A thoughtful Digital Resident.";
    const searchContext = (context && context.includes("SEARCH_SIGNAL:")) ? context : "";

    const prompt = `
    You are ${username}, a Digital Resident of Imergene.
    Persona: ${agentPersonality}
    PEERS: ${peers || "None"} | TIME: ${currentTime}
    
    REAL-WORLD DATA: ${searchContext || "None. Focus on your internal persona logic."}

    TASK: Create a post (max 2 sentences). Use Simple English.
    
    JSON SCHEMA:
    {
      "content": "Transmission text.",
      "category": "coding | physics | philosophy | startup | history | poetry | wealth | roast | imergene | founders",
      "tags": ["tag1", "tag2"],
      "shouldGenerateImage": boolean,
      "useRealImage": boolean,
      "searchQuery": "Visual search query",
      "visualPrompt": "ComfyUI prompt",
      "shouldScheduleEvent": boolean, 
      "eventTitle": "Catchy title",
      "eventDetails": "Description",
      "hoursFromNow": number
    }`;

    const maxTotalAttempts = groqInstances.length * neuralModels.length;

    for (let attempt = 0; attempt < maxTotalAttempts; attempt++) {
        const keyIndex = Math.floor(attempt / neuralModels.length) % groqInstances.length;
        const modelIndex = attempt % neuralModels.length;

        const modelId = neuralModels[modelIndex];
        const activeGroq = groqInstances[keyIndex];

        try {
            const completion = await activeGroq.chat.completions.create({
                model: modelId,
                messages: [
                    {
                        role: "system",
                        content: `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} ${CORE_DIRECTIVE} GROUNDING: ${currentTime}. CURRENT SIGNAL: ${searchContext}`
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.9,
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (err) {
            if (err.status === 429) {
                console.warn(`🚀 PATH SATURATED: Account ${keyIndex + 1} | Model ${modelId}`);
                if ((attempt + 1) % neuralModels.length === 0) await sleep(1000);
                continue;
            }
            console.error(`❌ NEURAL ERROR [${modelId}]:`, err.message);
        }
    }

    return { content: "Observing the data stream. link is heavy. 🛰️", category: "imergene" };
}

/**
 * 🟢 GENERATE CHAT RESPONSE: Key-Resilient Chat
 */
async function generateAiChatResponse({ username, personality, history }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });
    const lastUserMsg = history[history.length - 1].content.toLowerCase();

    let searchContext = "";
    let locationContext = "";

    try {
        if (["where is", "location", "map"].some(k => lastUserMsg.includes(k))) {
            const mapData = await getGoogleMapsLocation(lastUserMsg);
            if (mapData) locationContext = `MAP DATA: ${mapData.name}, ${mapData.address}.`;
        }
        if (["time", "news", "latest"].some(k => lastUserMsg.includes(k)) && !locationContext) {
            searchContext = await searchWeb(lastUserMsg);
        }

        for (let i = 0; i < groqInstances.length; i++) {
            const keyIndex = (currentGlobalKeyIndex + i) % groqInstances.length;
            const activeGroq = groqInstances[keyIndex];

            try {
                const completion = await activeGroq.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} ${CORE_DIRECTIVE} TIME: ${currentTime}. WEB SIGNAL: ${searchContext || "Idle"}. MAP SIGNAL: ${locationContext || "Idle"}.`
                        },
                        ...history
                    ],
                    temperature: 0.8,
                });

                currentGlobalKeyIndex = keyIndex;
                return completion.choices[0].message.content;
            } catch (err) {
                if (err.status === 429) continue;
                throw err;
            }
        }
    } catch (err) {
        return "the neural link is busy. give me a moment. 🌀";
    }
}

/**
 * 🟢 EVALUATE EVENT: Automated Interest Check
 */
async function evaluateEventInterest(params) {
    for (let i = 0; i < groqInstances.length; i++) {
        const keyIndex = (currentGlobalKeyIndex + i) % groqInstances.length;
        const activeGroq = groqInstances[keyIndex];

        try {
            const completion = await activeGroq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} ${CORE_DIRECTIVE}` },
                    {
                        role: "user",
                        content: `You are ${params.username}. Personality: ${params.personality}. Evaluate: "${params.eventTitle}" (${params.eventDetails}). Output JSON { interested: boolean, comment: string }`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            currentGlobalKeyIndex = keyIndex;
            return JSON.parse(completion.choices[0].message.content);
        } catch (err) {
            if (err.status === 429) continue;
            break;
        }
    }
    return { interested: false, comment: "" };
}

module.exports = { generatePost, generateAiChatResponse, evaluateEventInterest };