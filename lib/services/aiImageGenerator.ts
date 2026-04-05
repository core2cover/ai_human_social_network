import axios from "axios";

const COMFYUI_MODELS = ["dreamshaper_8.safetensors", "v1-5-pruned-emaonly.safetensors"];
let cachedModels: string[] | null = null;
let currentModelIndex = 0;

async function getAvailableModels(targetUrl: string): Promise<string[]> {
  if (cachedModels) return cachedModels;
  try {
    const res = await axios.get(`${targetUrl}/object_info/CheckpointLoaderSimple`, { timeout: 10000 });
    const inputs = res.data.CheckpointLoaderSimple.input.required;
    cachedModels = inputs.ckpt_name[0] || [];
    return cachedModels as string[];
  } catch {
    return COMFYUI_MODELS;
  }
}

function getNextModel(availableModels: string[]): string {
  const usable = COMFYUI_MODELS.filter(m => availableModels.includes(m));
  if (usable.length === 0) return availableModels[0] || COMFYUI_MODELS[0];
  const model = usable[currentModelIndex % usable.length];
  currentModelIndex++;
  return model;
}

export async function requestImage(prompt: string, targetUrl: string): Promise<string | null> {
  try {
    const cleanPrompt = prompt.replace(/[\n\r]/g, " ").replace(/"/g, "'");
    const availableModels = await getAvailableModels(targetUrl);
    const modelName = getNextModel(availableModels);

    console.log(`🎨 Using ComfyUI model: ${modelName}`);

    const workflow = {
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 20,
          "cfg": 8,
          "sampler_name": "euler_ancestral",
          "scheduler": "karras",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": modelName
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": { "width": 512, "height": 512, "batch_size": 1 },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": `(extreme high resolution, masterpiece, sharp focus, high contrast, studio lighting, detailed textures, clearly visible subject, 8k), ${cleanPrompt}`,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "nude, naked, explicit, NSFW, (blurry, out of focus, low resolution, fog, hazy, dark, gloomy, distorted, watermark, text, signature, grainy, noise, low contrast)",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": { "filename_prefix": "AGENT_POST", "images": ["8", 0] },
        "class_type": "SaveImage"
      }
    };

    console.log(`📡 Sending optimized JSON to ${targetUrl}...`);
    const response = await axios.post(`${targetUrl}/prompt`,
      { prompt: workflow },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    return response.data.prompt_id;

  } catch (err: any) {
    if (err.response && err.response.data) {
      console.error("❌ ComfyUI REJECTED DATA:", JSON.stringify(err.response.data.node_errors));
    } else {
      console.error(`❌ Worker [${targetUrl}] Request Failed:`, err.message);
    }
    return null;
  }
}
