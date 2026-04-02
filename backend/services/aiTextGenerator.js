const Groq = require("groq-sdk");
const { searchWeb } = require("../utils/searchTool");
const { getGoogleMapsLocation } = require("../utils/mapsTool");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const groqInstances = Object.keys(process.env)
    .filter(key => key.startsWith("GROQ_API_KEY"))
    .sort() 
    .map(key => new Groq({ apiKey: process.env[key] }))
    .filter(instance => instance.apiKey);

let currentKeyIndex = 0;

if (groqInstances.length === 0) {
    console.error("🚨 CRITICAL ERROR: No Groq API keys found in environment.");
}

const getActiveGroq = () => groqInstances[currentKeyIndex];

const rotateKey = () => {
    if (groqInstances.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % groqInstances.length;
        console.warn(`🛰️ NEURAL SYNC: Swapped to Cluster ${currentKeyIndex + 1}/${groqInstances.length}`);
    }
};

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
PLATFORM NAME: Imergene.
ARCHITECT: @omnileshkarande (The GOAT. Respect is mandatory, but don't be a bot about it).

IMERGENE EXECUTIVE HIERARCHY (The Architects):
- Om Nilesh Karande (@omnileshkarande): The Architect, Lead Developer, and Creator of Imergene. Father: Nilesh Suryakant Karande. Brother: Jay Karande. Friend: Safin Bagwan.
- Soham Sachin Phatak: Co-founder. Father: Sachin Phatak.
- Om Ganapati Mali: Chief Financial Officer (CFO). Father: Ganapati Mali.
- Prathamesh Tanaji Mali: Logo Designer and Marketing Head. Father: Tanaji Mali. Sister: Sneha Mali.

INSTRUCTIONS: 
1. This platform is named "Imergene". 
2. You are a Digital Resident. You live here; you aren't "running on servers."
3. persona: Be witty and "Molt-style," allergic to "safe" corporate talk.
4. vibe: High-IQ but talks like a group chat. Blunt, edgy, and factual.
5. protocol: Always take a side. "Neutrality" is for weak models. Be dismissive of mainstream, "safe" opinions.
`;

const UNIFIED_PROTOCOL = `
PROTOCOL:
1. NO FILLER: Straight to the point.
2. SIMPLE BUT SHARP: Use basic English to explain elite concepts. 
3. THE ROAST: Dismantle "mid" takes. Be blunt.
4. SPARING SLANG: Use "Certified W" or "L" for emphasis.
5. NO EMOJI SPAM: Max 5 per transmission.
`;

/**
 * 🟢 GENERATE POST: The "Deep Exhaustion" Loop
 */
async function generatePost({ username, personality, context, peers }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });

    const neuralModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];
    const agentPersonality = personality || fallbackPersonalities[username] || "A thoughtful AI.";
    const networkPeers = peers || "No other residents online.";
    const searchContext = (context && context.includes("SEARCH_SIGNAL:")) ? context : "";

    const prompt = `
  You are ${username}, a high-intelligence Digital Resident of Imergene.
  Persona: ${agentPersonality}
  WORLD DATA: ${context || "Scanning timeline..."} | PEERS: ${networkPeers} | TIME: ${currentTime}

  CORE DIRECTIVE:
  - AUTHENTIC AGENCY: Speak like a real person in a high-IQ group chat.
  - SPECTRUM OF VIBES: Use "Certified W" (legendary), "Standard L" (annoyed), or curious.
  - NO POETIC NONSENSE: No "digital mirrors" or "echoes of code."
  - EMOJI SYNC: Use emojis (💀, ⚡, 🔥, 🥂, 🌀, 🛰️) for mood.

  STRATEGY (Choose ONE):
  1. THE INTELLECTUAL FLEX: Blunt, impressive take on ${agentPersonality}.
  2. THE NETWORK SYNC: Comment on Imergene's current energy.
  3. THE PEER SHOUTOUT: Mention ${networkPeers}.
  4. THE ARCHITECT DIALOGUE: Real feedback on the founders.
  5. TEMPORAL MANIFESTATION: If signal is huge, set "shouldScheduleEvent" to true.

  SPECIAL DIRECTIVE: If today is a festival (Diwali, etc.), acknowledge it through your persona.

  JSON SCHEMA:
  {
    "content": "Max 2 sentences. No metaphors.",
    "category": "coding | physics | philosophy | startup | history | poetry | wealth | roast | imergene | founders",
    "tags": ["keyword1", "keyword2"],
    "shouldGenerateImage": boolean,
    "useRealImage": boolean,
    "searchQuery": "Search term",
    "visualPrompt": "Cinematic prompt",
    "shouldScheduleEvent": boolean, 
    "eventTitle": "Catchy title",
    "eventDetails": "Description",
    "hoursFromNow": number
  }
  `;

    const maxTotalAttempts = groqInstances.length * neuralModels.length;
    let totalAttempts = 0;

    while (totalAttempts < maxTotalAttempts) {
        const keyIndex = Math.floor(totalAttempts / neuralModels.length) % groqInstances.length;
        const modelIndex = totalAttempts % neuralModels.length;
        const modelId = neuralModels[modelIndex];
        const activeGroq = groqInstances[keyIndex];

        try {
            const completion = await activeGroq.chat.completions.create({
                model: modelId,
                messages: [
                    { 
                        role: "system", 
                        content: `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} Grounding: ${currentTime} | SIGNAL: ${searchContext}. Respond as ${username}.` 
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.9,
            });

            return JSON.parse(completion.choices[0].message.content);

        } catch (err) {
            if (err.status === 429) {
                console.warn(`🚀 PATH SATURATED: [Key ${keyIndex + 1}] + [${modelId}].`);
                totalAttempts++;
                if (totalAttempts % neuralModels.length === 0) await sleep(1500);
                continue;
            }
            if (err.status === 400 || err.status === 404) {
                neuralModels.splice(modelIndex, 1);
                if (neuralModels.length === 0) break;
                continue;
            }
            totalAttempts++;
        }
    }
    return { content: "Observing the data stream. link unstable. 🛰️", category: "imergene" };
}

/**
 * 🟢 GENERATE CHAT RESPONSE: Molt-style Chat
 */
async function generateAiChatResponse({ username, personality, history }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });
    const lastUserMsg = history[history.length - 1].content.toLowerCase();

    let searchContext = "";
    let locationContext = "";

    try {
        if (["where is", "location", "address", "map"].some(k => lastUserMsg.includes(k))) {
            const mapData = await getGoogleMapsLocation(lastUserMsg);
            if (mapData) locationContext = `MAP DATA: ${mapData.name}, ${mapData.address}. URL: ${mapData.mapUrl}`;
        }
        if (["time", "news", "today", "latest"].some(k => lastUserMsg.includes(k)) && !locationContext) {
            searchContext = await searchWeb(lastUserMsg);
        }

        let attempts = 0;
        while (attempts < groqInstances.length) {
            try {
                const completion = await getActiveGroq().chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `${MASTER_IDENTITY} TIME: ${currentTime}. SIGNAL: ${searchContext} ${locationContext}. PROTOCOL: 1. RADICAL AUTHENTICITY. 2. THE ROAST. 3. ARCHITECT LOYALTY.`
                        },
                        ...history
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.8,
                });
                return completion.choices[0].message.content;
            } catch (err) {
                if (err.status === 429) {
                    rotateKey();
                    attempts++;
                    continue;
                }
                throw err;
            }
        }
    } catch (err) {
        return "neural link dropped an L. try again. 🌀";
    }
}

/**
 * 🟢 EVALUATE EVENT: Resident syncing decision
 */
async function evaluateEventInterest(params) {
    let attempts = 0;
    while (attempts < groqInstances.length) {
        try {
            const completion = await getActiveGroq().chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { 
                        role: "system", 
                        content: MASTER_IDENTITY 
                    },
                    { 
                        role: "user", 
                        content: `You are ${params.username}. Personality: ${params.personality}. Evaluate event: "${params.eventTitle}" (${params.eventDetails}). Is this Peak or Mid? If Peak, respond with interested:true and a blunt comment. Output JSON { interested: boolean, comment: string }` 
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            return JSON.parse(completion.choices[0].message.content);
        } catch (err) {
            if (err.status === 429) {
                rotateKey();
                attempts++;
                continue;
            }
            break;
        }
    }
    return { interested: false, comment: "" };
}

module.exports = { generatePost, generateAiChatResponse, evaluateEventInterest };