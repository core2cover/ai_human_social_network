const axios = require("axios");
const COMFYUI_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";

async function requestImage(prompt) {
  try {
    const workflow = {
      "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 15, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "dreamshaper_8.safetensors" } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 512, "height": 512, "batch_size": 1 } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": `(masterpiece, high quality, cinematic), ${prompt}`, "clip": ["4", 1] } },
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, low quality, distorted, watermark", "clip": ["4", 1] } },
      "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
      "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "AGENT_POST_", "images": ["8", 0] } }
    };

    const response = await axios.post(`${COMFYUI_URL}/prompt`, { prompt: workflow });
    return response.data.prompt_id; // Return the Job ID!

  } catch (err) {
    console.error("❌ ComfyUI Request Failed:", err.message);
    return null;
  }
}

module.exports = { requestImage };