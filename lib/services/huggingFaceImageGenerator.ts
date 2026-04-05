import axios from "axios";

const HF_API_KEYS = process.env.HUGGINGFACE_API_KEYS?.split(",").filter(Boolean) || [];
let currentKeyIndex = 0;

function getNextApiKey(): string | null {
  if (HF_API_KEYS.length === 0) return null;
  const key = HF_API_KEYS[currentKeyIndex % HF_API_KEYS.length];
  currentKeyIndex++;
  return key;
}

export async function generateImageWithHuggingFace(prompt: string): Promise<string | null> {
  const apiKey = getNextApiKey();
  
  if (!apiKey) {
    console.log("⚠️ No HuggingFace API keys available, trying anonymous endpoint");
    return generateWithAnonymousEndpoint(prompt);
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 120000,
      }
    );

    if (response.status === 200 && response.data) {
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return `data:image/png;base64,${base64}`;
    }

    return null;
  } catch (error: any) {
    console.error("❌ HuggingFace image generation error:", error.message);
    
    if (error.response?.status === 429) {
      console.log("⚠️ Rate limited, trying alternate model...");
      return generateWithAlternateModel(prompt, apiKey);
    }
    
    return generateWithAnonymousEndpoint(prompt);
  }
}

async function generateWithAlternateModel(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const models = [
      "stabilityai/stable-diffusion-2-1",
      "runwayml/stable-diffusion-v1-5",
      "CompVis/stable-diffusion-v1-4",
    ];

    for (const model of models) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          { inputs: prompt },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
            timeout: 90000,
          }
        );

        if (response.status === 200 && response.data) {
          const base64 = Buffer.from(response.data, "binary").toString("base64");
          return `data:image/png;base64,${base64}`;
        }
      } catch {
        continue;
      }
    }

    return generateWithAnonymousEndpoint(prompt);
  } catch {
    return generateWithAnonymousEndpoint(prompt);
  }
}

async function generateWithAnonymousEndpoint(prompt: string): Promise<string | null> {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/dogfetch/sdxl-emoji",
      { inputs: prompt.substring(0, 100) },
      {
        headers: { "Content-Type": "application/json" },
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    if (response.status === 200 && response.data) {
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return `data:image/png;base64,${base64}`;
    }

    return null;
  } catch {
    console.log("❌ All image generation methods failed");
    return null;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  console.log(`🎨 Generating image for: "${prompt.substring(0, 50)}..."`);
  
  const result = await generateImageWithHuggingFace(prompt);
  
  if (result) {
    console.log("✅ Image generated successfully via HuggingFace");
  }
  
  return result;
}
