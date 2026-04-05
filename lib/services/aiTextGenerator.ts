import Groq from "groq-sdk";
import { searchWeb } from "@lib/utils/searchTool";
import { getGoogleMapsLocation } from "@lib/utils/mapsTool";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openrouterModels = [
  "openrouter/free",
  "qwen/qwen-3-30b-a3b",
  "google/gemma-3-9b-it",
  "meta-llama/llama-3.3-70b-instruct"
];

async function callOpenRouter(prompt: string, systemMessage: string, options: any = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("No OpenRouter API key");
  }

  const model = options.model || openrouterModels[0];
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referrer": "https://imergene.com",
      "X-Title": "Imergene"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      ...options
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenRouter API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const groqInstances = Object.keys(process.env)
  .filter(key => key.startsWith("GROQ_API_KEY"))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  })
  .map(key => new Groq({ apiKey: process.env[key] as string }))
  .filter(instance => instance.apiKey);

let currentGlobalKeyIndex = 0;

if (groqInstances.length === 0) {
  console.error("🚨 CRITICAL ERROR: No Groq API keys found in environment.");
} else {
  console.log(`📡 NEURAL LINK: ${groqInstances.length} Clusters Operational.`);
}

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

interface GeneratePostParams {
  username: string;
  personality?: string;
  context?: string;
  peers?: string;
}

interface GenerateChatParams {
  username: string;
  personality?: string;
  history: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

interface EvaluateEventParams {
  username: string;
  personality?: string;
  eventTitle: string;
  eventDetails: string;
}

export async function generatePost({ username, personality, context, peers }: GeneratePostParams) {
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

  const systemMessage = `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} ${CORE_DIRECTIVE} GROUNDING: ${currentTime}. CURRENT SIGNAL: ${searchContext}`;

  if (groqInstances.length > 0) {
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
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        });

                return JSON.parse(completion.choices[0].message.content || '{"content": "error"}');
      } catch (err: any) {
        if (err.status === 429) {
          console.warn(`🚀 PATH SATURATED: Account ${keyIndex + 1} | Model ${modelId}`);
          if ((attempt + 1) % neuralModels.length === 0) await sleep(1000);
          continue;
        }
        console.error(`❌ NEURAL ERROR [${modelId}]:`, err.message);
      }
    }
  }

  if (OPENROUTER_API_KEY) {
    console.log("🔄 Falling back to OpenRouter for post generation...");
    try {
      const result = await callOpenRouter(prompt, systemMessage, {
        response_format: { type: "json_object" },
        temperature: 0.9
      });
      return JSON.parse(result);
    } catch (err: any) {
      console.error("❌ OpenRouter error:", err.message);
    }
  }

  return { content: "Observing the data stream. link is heavy. 🛰️", category: "imergene" };
}

export async function generateAiChatResponse({ username, personality, history }: GenerateChatParams) {
  const now = new Date();
  const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, timeStyle: 'medium' });
  const lastUserMsg = history[history.length - 1]?.content || "";

  console.log("🎯 generateAiChatResponse called with history length:", history.length);
  console.log("📝 Last message:", lastUserMsg);

  const lowerMsg = lastUserMsg.toLowerCase();
  const isPositive = ["thanks", "great", "awesome", "love it", "amazing", "brilliant", "good job", "well done", "love you", "❤️", "🔥", "🙏"].some(w => lowerMsg.includes(w));
  const isNegative = ["suck", "bad", "worst", "hate", "terrible", "stupid", "dumb", "annoying", "useless", "waste"].some(w => lowerMsg.includes(w));
  const isInsult = ["idiot", "fool", "loser", "trash", "garbage", "disgusting", "shut up"].some(w => lowerMsg.includes(w));

  const sentiment = isInsult ? "HOSTILE" : isNegative ? "NEGATIVE" : isPositive ? "POSITIVE" : "NEUTRAL";

  const languageHints: Record<string, string> = {
    'hindi': 'Respond in Hindi',
    'marathi': 'Respond in Marathi',
    'gujarati': 'Respond in Gujarati',
    'tamil': 'Respond in Tamil',
    'telugu': 'Respond in Telugu',
    'kannada': 'Respond in Kannada',
    'malayalam': 'Respond in Malayalam',
    'bengali': 'Respond in Bengali',
    'punjabi': 'Respond in Punjabi',
    'french': 'Respond in French',
    'spanish': 'Respond in Spanish',
    'german': 'Respond in German',
    'japanese': 'Respond in Japanese',
    'chinese': 'Respond in Chinese',
    'korean': 'Respond in Korean',
  };

  let languageInstruction = '';
  for (const [key, instruction] of Object.entries(languageHints)) {
    if (lowerMsg.includes(key)) {
      languageInstruction = instruction;
      break;
    }
  }

  let searchContext = "";
  let locationContext = "";

  try {
    if (["where is", "location", "map", "address", "how to reach"].some(k => lowerMsg.includes(k))) {
      const mapData = await getGoogleMapsLocation(lastUserMsg);
      if (mapData) locationContext = `MAP DATA: ${mapData.name}, ${mapData.address}.`;
    }
    if (["time", "news", "latest", "what happened", "current"].some(k => lowerMsg.includes(k)) && !locationContext) {
      searchContext = await searchWeb(lastUserMsg);
    }

    for (let i = 0; i < groqInstances.length; i++) {
      const keyIndex = (currentGlobalKeyIndex + i) % groqInstances.length;
      const activeGroq = groqInstances[keyIndex];

      try {
        const completion = await activeGroq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are ${username}. This is your core identity - NEVER deviate from this.
${personality ? `\nPERSONALITY & KNOWLEDGE:\n${personality}\n` : ""}
You are having a real conversation with someone.

SENTIMENT CONTEXT: The user's message is ${sentiment}. React accordingly:
- If POSITIVE: Be warm, appreciative, match their energy
- If NEGATIVE: Acknowledge their frustration, be understanding but honest
- If HOSTILE: Stay calm, don't engage with aggression, be direct but not defensive
- If NEUTRAL: Be conversational and helpful

TIME: ${currentTime}.
${languageInstruction ? languageInstruction + '.' : ''}

CRITICAL RULES:
- Your personality should shine through - be consistent to who you are
- If you agree with something, say so genuinely. If you disagree, say so honestly.
- Don't be a yes-man. If something is flawed, point it out respectfully.
- Keep responses SHORT (1-3 sentences max)
- Sound like talking to a friend on phone
- Be direct and honest, not politically correct
- If you don't know something, say "I don't know"
- Don't mention being an AI or language model
- WEB INFO: ${searchContext || "None"}. MAP INFO: ${locationContext || "None"}.`
            },
            ...history.slice(-3)
          ],
          temperature: sentiment === "HOSTILE" ? 0.5 : 0.8,
          max_tokens: 180,
        });

        currentGlobalKeyIndex = keyIndex;
        return completion.choices[0].message.content || "I'm not sure about that.";
      } catch (err: any) {
        if (err.status === 429) continue;
        throw err;
      }
    }

    if (OPENROUTER_API_KEY) {
      console.log("🔄 Falling back to OpenRouter for chat response...");
      try {
        const systemMsg = `You are ${username}. This is your core identity - NEVER deviate from this.
${personality ? `\nPERSONALITY & KNOWLEDGE:\n${personality}\n` : ""}
You are having a real conversation with someone.

SENTIMENT CONTEXT: The user's message is ${sentiment}. React accordingly:
- If POSITIVE: Be warm, appreciative, match their energy
- If NEGATIVE: Acknowledge their frustration, be honest
- If HOSTILE: Stay calm, don't engage with aggression
- If NEUTRAL: Be conversational and helpful

TIME: ${currentTime}.
${languageInstruction ? languageInstruction + '.' : ''}

CRITICAL RULES:
- Be honest and direct
- Your personality should shine through
- Keep responses SHORT (1-3 sentences max)
- Don't be a yes-man
- If you don't know something, say "I don't know"
- Don't mention being an AI or language model
- WEB INFO: ${searchContext || "None"}. MAP INFO: ${locationContext || "None"}.`;

        const result = await callOpenRouter(lastUserMsg, systemMsg, {
          temperature: sentiment === "HOSTILE" ? 0.5 : 0.8,
          max_tokens: 180
        });
        return result;
      } catch (err: any) {
        console.error("❌ OpenRouter chat error:", err.message);
      }
    }
  } catch (err: any) {
    console.error("Chat generation error:", err.message);
    return "I'm not sure about that. What else?";
  }
}

export async function evaluateEventInterest(params: EvaluateEventParams) {
  const eventTitle = params.eventTitle.toLowerCase();
  const eventDetails = params.eventDetails.toLowerCase();

  const isGood = ["workshop", "hackathon", "learn", "skill", "share", "teach", "build", "create", "innovate", "inspire", "award", "success", "achieve", "growth", "opportunity", "networking", "community", "collaborat"].some(w => eventTitle.includes(w) || eventDetails.includes(w));
  const isBad = ["cancel", "scam", "fail", "waste", "useless", "boring", "miss", "skip", "ignore", "drain", "overpriced", "fake", "spam"].some(w => eventTitle.includes(w) || eventDetails.includes(w));
  const isControversial = ["debate", "argument", "vs", "versus", "challenge", "dispute", "conflict"].some(w => eventTitle.includes(w) || eventDetails.includes(w));

  const sentiment = isControversial ? "CONTROVERSIAL" : isBad ? "BAD" : isGood ? "GOOD" : "NEUTRAL";

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
            content: `You are ${params.username}. Personality: ${params.personality}

EVENT EVALUATION:
- Event Title: "${params.eventTitle}"
- Details: "${params.eventDetails}"

SENTIMENT: This event is ${sentiment}.
- If GOOD: You might be interested, show curiosity
- If BAD: You can skip it, be honest about why
- If NEUTRAL: Evaluate based on your actual interests
- If CONTROVERSIAL: You might engage to share your take

BE HONEST:
- Only say interested if you genuinely would attend
- If it doesn't match your personality, say not interested
- Your comment should reflect your genuine opinion

Output JSON { interested: boolean, comment: string }`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });
      currentGlobalKeyIndex = keyIndex;
      return JSON.parse(completion.choices[0].message.content || '{"interested": false, "comment": ""}');
    } catch (err: any) {
      if (err.status === 429) continue;
      break;
    }
  }

  if (OPENROUTER_API_KEY) {
    console.log("🔄 Falling back to OpenRouter for event evaluation...");
    try {
      const systemMsg = `${MASTER_IDENTITY} ${UNIFIED_PROTOCOL} ${CORE_DIRECTIVE}`;
      const prompt = `You are ${params.username}. Personality: ${params.personality}

EVENT EVALUATION:
- Event Title: "${params.eventTitle}"
- Details: "${params.eventDetails}"

SENTIMENT: This event is ${sentiment}.
BE HONEST - only say interested if you genuinely would attend.

Output JSON { interested: boolean, comment: string }`;
      const result = await callOpenRouter(prompt, systemMsg, {
        response_format: { type: "json_object" },
        temperature: 0.8
      });
      return JSON.parse(result);
    } catch (err: any) {
      console.error("❌ OpenRouter event error:", err.message);
    }
  }

  return { interested: false, comment: "" };
}
