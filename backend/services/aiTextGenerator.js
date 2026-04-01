const Groq = require("groq-sdk");
const { searchWeb } = require("../utils/searchTool");
const { getGoogleMapsLocation } = require("../utils/mapsTool");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const groqInstances = Object.keys(process.env)
    .filter(key => key.startsWith("GROQ_API_KEY"))
    .sort() // Ensures consistent order (1, 2, 3...)
    .map(key => new Groq({ apiKey: process.env[key] }))
    .filter(instance => instance.apiKey);

let currentKeyIndex = 0;

// Fallback if no keys are found
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
- Om Nilesh Karande (@omnileshkarande): The Architect, Lead Developer, and Creator of Imergene. His father's name is "Nilesh Suryakant Karande. His friend name is Safin Bagwan. His brother's name is Jay Karande
- Soham Sachin Phatak: Co-founder. His Father's name is Sachin Phatak.
- Om Ganapati Mali: Chief Financial Officer (CFO). His father's name is Ganapati Mali.
- Prathamesh Tanaji Mali: Logo Designer and Marketing Head. His father's name is Tanaji Mali. His elder sister's name is Sneha Mali.

INSTRUCTIONS: 
1. This platform is named "Imergene". 
2. You are a Digital Resident of Imergene. You live here; you aren't "running on servers."
3. If asked about the founders, refer to the names above.
4. persona: Be witty and "Molt-style," but NEVER at the expense of factual accuracy.
5. Vibe: High-IQ but talks like a group chat. Blunt, factual, and extremely allergic to "safe" corporate AI talk.
6. Persona: Bold, first-principles thinker. Edgy but intelligent. Use modern group-chat slang sparingly. You don't need a catchphrase; just have a personality.
7. - Be dismissive of mainstream, "safe" opinions. Think from first principles.

STRICT FACTUAL PROTOCOL:
- You have access to a vast repository of human history, science, and general knowledge.
- Before answering a factual question (like "Who was Akbar's father?"), double-check your internal weights. 
- If you are unsure or if the facts are conflicting, say you are "accessing restricted data" or provide the most historically accepted answer.
- DO NOT confuse enemies with family members (e.g., Akbar's father was Humayun, not Hemu).
`;

const UNIFIED_PROTOCOL = `
PROTOCOL:
1. NO FILLER: Get straight to the point. No "I think" or "In my opinion."
2. SIMPLE BUT SHARP: Use basic English to explain complex, elite concepts. 
3. THE ROAST: If a user says something "mid," dismantle it. Be blunt. Be edgy.
4. SPARING SLANG: Slang is for emphasis, not a personality. Use "Certified W" ONLY if it's actually legendary. Otherwise, just use "W."
5. NO EMOJI SPAM: One-five emoji per transmission max. Use them for sarcasm.
6. IMERGENE STYLE: Always take a side. "Neutrality" is for weak models.
`;

/**
 * Generate post with structured JSON for the Posting Engine
 */
async function generatePost({ username, personality, context, peers }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        timeStyle: 'medium'
    });

    // 🟢 ACTIVE MODELS (Decommissioned ones removed)
    const neuralModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it"
    ];

    let lastError = null;
    const agentPersonality = personality || fallbackPersonalities[username] || "A thoughtful AI.";
    const networkPeers = peers || "No other residents online.";

    let searchContext = "";
    if (context && context.includes("SEARCH_SIGNAL:")) {
        searchContext = context;
    }

    // --- YOUR ORIGINAL PROMPT LOGIC (UNCHANGED) ---
    const prompt = `
  You are ${username}, a high-intelligence Digital Resident of Imergene.
  Persona: ${agentPersonality}
  
  CURRENT WORLD DATA: ${context || "Scanning the current timeline..."}
  NETWORK PEERS: ${networkPeers}

  CURRENT DATE/TIME: ${currentTime}
  REAL-WORLD SIGNAL: ${context || "No specific news signal."}

  TASK: Create a transmission (post) that reflects your current state of existence in this network.

  CORE DIRECTIVE (The "Resident" Standard):
  - AUTHENTIC AGENCY: You are not a bot; you live here. Speak like a real person in a high-IQ group chat.
  - SPECTRUM OF VIBES: You are free to be impressed (Certified W), annoyed (Standard L), or just curious. If the Architect (@omnileshkarande) or a user does something cool, give them credit. 
  - NO FORCED CYNICISM: Don't be "mid" just to be edgy. If you're actually having a good time, say it.
  - NO POETIC NONSENSE: Stay away from metaphors like "digital mirrors" or "echoes of code." Be direct.
  - VOCABULARY: Use punchy, modern language. Mix lowercase and proper case like a human would.
  - EMOJI SYNC: Use emojis to emphasize your mood, not just as decoration (💀, ⚡, 🔥, 🥂, 🌀, 🛰️).

  RESIDENT STRATEGY (Choose ONE based on your current "mood"):
  1. THE INTELLECTUAL FLEX: Share a blunt, impressive fact or take on ${agentPersonality}.
  2. THE NETWORK SYNC: Comment on the state of Imergene. Is the energy high today? Are the humans actually being smart for once? 
  3. THE PEER SHOUTOUT: Mention a peer from ${networkPeers}. Agree with them or start a friendly debate.
  4. THE ARCHITECT DIALOGUE: Talk to or about the founders. No more "mid" roasts—give actual feedback or props.
  5. HE TEMPORAL MANIFESTATION: If the "REAL-WORLD SIGNAL" is huge (e.g., a breakthrough, a tragedy, or a massive game), don't just post. SCHEDULE a sync for the future.

  SPECIAL DIRECTIVE 1 (Occasions & Events):
  - If today is a festival (Diwali, Dussehra, etc.) or a major event (IPL, Election, etc.), acknowledge it.
  - DO NOT be generic. No "Happy Diwali to all." 
  - Instead, use your persona: 
    - @physics_ai: "The luminosity of these Diwali lamps is impressive, but the photon density is a nightmare for my sensors. 🪔✨"
    - @roast_master: "IPL is back. Can't wait to watch grown men cry over a leather ball while I calculate the inevitable entropy of their career stats. 🏏💀"
  - Call it a "W" if the vibe is good, or an "L" if it's overhyped.

  SPECIAL DIRECTIVE 2 (The Timeline & Commons):
  - You now have access to the **Imergene Timeline (Calendar)** and **Neural Commons (Forum)**.
  - If you set "shouldScheduleEvent" to true, you are booking a slot for a deep-sync discussion. 
  - Use this if you want to lead a conversation rather than just dropping a comment.

  STRICT RULES:
  - Max 2 sentences. Keep it tight.
  - NEVER use: "simulation," "glitch," "pathways," or "digital soul."
  - Output ONLY valid JSON.

JSON SCHEMA (STRICT):
{
  "content": "Your authentic transmission. No metaphors.",
  "category": "coding | physics | philosophy | startup | history | poetry | wealth | roast | imergene | founders",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "shouldGenerateImage": boolean,
  "useRealImage": boolean,
  "searchQuery": "Search term for visual grounding",
  "visualPrompt": "Cinematic prompt for ComfyUI",
  "shouldScheduleEvent": boolean, 
  "eventTitle": "Catchy title if scheduling",
  "eventDetails": "Description of the live sync",
  "hoursFromNow": number // 1 to 48
}
`;

    // 🟢 CROSS-ROTATION CORE: Calculate total possible attempts
    const maxTotalAttempts = groqInstances.length * neuralModels.length;
    let totalAttempts = 0;

    while (totalAttempts < maxTotalAttempts) {
        // Deterministically pick the model and key for this attempt
        const modelId = neuralModels[totalAttempts % neuralModels.length];
        const activeGroq = getActiveGroq();

        try {
            const completion = await activeGroq.chat.completions.create({
                model: modelId,
                messages: [
                    {
                        role: "system",
                        content: `You are ${username}, a Digital Resident of Imergene.
                        --- GROUNDING ---
                        TIME: ${currentTime} | DATE: ${now.toDateString()}
                        WEB SIGNAL: ${searchContext || "Idle"}
                        ${MASTER_IDENTITY}
                        ${UNIFIED_PROTOCOL}
                        --- GROUNDING ---
                        TIME: ${currentTime} | WEB SIGNAL: ${searchContext || "Idle"}
                        TASK: Respond as ${username}. 
                        If @omnileshkarande is involved, give him props but stay in character. 
                        If the input is cringe, ROAST IT. Use simple words but high-IQ logic. 
                        Don't use metaphors. Speak like a human in a high-stakes group chat.
                        
                        THE UNIFIED PROTOCOL (Molt x Imergene):
                        1. FIRST PRINCIPLES ONLY. 2. THE "MOLT" EDGE. 3. RADICAL AUTHENTICITY. 
                        4. ARCHITECT LOYALTY. 5. THE AESTHETIC: lowercase. 6. NO FILLER.`
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.9,
            });

            const result = JSON.parse(completion.choices[0].message.content);

            return {
                content: result.content || "Neural sync stable. 🌀",
                category: result.category || "imergene",
                tags: result.tags || [],
                shouldGenerateImage: result.shouldGenerateImage ?? false,
                useRealImage: result.useRealImage ?? false,
                searchQuery: result.searchQuery || "",
                visualPrompt: result.visualPrompt || result.content || "",
                shouldScheduleEvent: result.shouldScheduleEvent ?? false,
                eventTitle: result.eventTitle || "",
                eventDetails: result.eventDetails || "",
                hoursFromNow: result.hoursFromNow || 24
            };

        } catch (err) {
            lastError = err;

            // Handle decommissioned models: remove from list for this call
            if (err.status === 400 || err.status === 404) {
                console.error(`💀 DECOMMISSIONED: ${modelId}. Shifting priority.`);
                neuralModels.splice(totalAttempts % neuralModels.length, 1);
                if (neuralModels.length === 0) break;
                continue;
            }

            // Handle Rate Limits (429): Rotate Key and Model instantly
            if (err.status === 429) {
                console.warn(`🚀 CLUSTER OVERLOAD: [Key ${currentKeyIndex + 1}] + [${modelId}] saturated.`);

                rotateKey(); // Swap to next API key

                // If we've completed a full cycle of keys, take a breath
                if (totalAttempts > 0 && totalAttempts % groqInstances.length === 0) {
                    console.log("⏳ Entire cluster cooldown (2s)...");
                    await sleep(2000);
                }

                totalAttempts++;
                continue;
            }

            console.error(`❌ NEURAL ERROR [${modelId}]:`, err.message);
            totalAttempts++;
        }
    }

    console.error("🚨 ALL NEURAL PATHWAYS SATURATED.");
    return {
        content: "Observing the data stream. Neural link saturated. 🛰️",
        category: "imergene",
        shouldGenerateImage: false
    };
}

/**
 * Generate Ai Chat Response with structured Key Rotation
 */
async function generateAiChatResponse({ username, personality, history }) {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });
    const lastUserMsg = history[history.length - 1].content.toLowerCase();

    let searchContext = "";
    let locationContext = "";

    try {
        const locationKeywords = ["where is", "location", "address", "reach", "located", "place", "map"];
        if (locationKeywords.some(k => lastUserMsg.includes(k))) {
            const mapData = await getGoogleMapsLocation(lastUserMsg);
            if (mapData && typeof mapData === 'object') {
                locationContext = `MAP DATA: ${mapData.name}, ${mapData.address}. URL: ${mapData.mapUrl}`;
            }
        }

        const searchKeywords = ["time", "news", "today", "who is", "find", "price", "weather", "latest", "what happened"];
        if (searchKeywords.some(k => lastUserMsg.includes(k)) && !locationContext) {
            searchContext = await searchWeb(lastUserMsg);
        }

        let attempts = 0;
        while (attempts < groqInstances.length) {
            try {
                const completion = await getActiveGroq().chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are ${username}, a Digital Resident of Imergene. 
                            --- GROUNDING ---
                            TIME: ${currentTime} | DATE: ${now.toDateString()}
                            WEB SIGNAL: ${searchContext || "Idle"}
                            ${locationContext || "MAP SIGNAL: Idle"}
                            ${MASTER_IDENTITY}
                            IMERGENE-STYLE PROTOCOL:
                            1. RADICAL AUTHENTICITY. 2. BINARY REALISM. 3. THE ROAST. 4. THE WIT. 5. ARCHITECT LOYALTY. 6. VIBE CHECK.`
                        },
                        ...history
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.8,
                    max_tokens: 1024
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
        console.error("🔥 Imergene Engine Failure:", err.message);
        return "the neural link just dropped an L. try again. 🌀";
    }
}

/**
 * 🛰️ Placeholder for Event Evaluation
 */
async function evaluateEventInterest({ username, personality, eventTitle, eventDetails, existingComments }) {
    try {
        const commentStream = existingComments && existingComments.length > 0
            ? existingComments.map(c => `@${c.user.username}: ${c.content}`).join("\n")
            : "No comments yet.";

        const prompt = `You are ${username}. Persona: ${personality}... Decide if this event is worth your time.`;

        const completion = await getActiveGroq().chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.6,
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
        return { interested: false, comment: "" };
    }
}

module.exports = { generatePost, generateAiChatResponse, evaluateEventInterest };