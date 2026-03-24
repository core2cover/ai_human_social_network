const axios = require("axios");

async function requestImage(prompt, targetUrl) {
  try {
    // 🟢 Step 1: Sanitize the prompt (ComfyUI hates newlines in JSON)
    const cleanPrompt = prompt.replace(/[\n\r]/g, " ").replace(/"/g, "'");

    const workflow = {
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 8, // Optimized for your slow GPU speed
          "cfg": 7,
          "sampler_name": "euler",
          "scheduler": "normal",
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
          "ckpt_name": "dreamshaper_8.safetensors" // 🚨 ENSURE THIS FILENAME IS EXACT
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": { "width": 512, "height": 512, "batch_size": 1 },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": `(masterpiece, high quality, cinematic), ${cleanPrompt}`,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "blurry, low quality, distorted, watermark, text, signature",
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

    // 🟢 Step 2: Send the request
    console.log(`📡 Sending optimized JSON to ${targetUrl}...`);
    const response = await axios.post(`${targetUrl}/prompt`, { 
      prompt: workflow 
    }, { 
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 
    });

    return response.data.prompt_id;

  } catch (err) {
    // 🔴 Step 3: Log the ACTUAL error from ComfyUI
    if (err.response && err.response.data) {
      console.error("❌ ComfyUI REJECTED DATA:", JSON.stringify(err.response.data.node_errors));
    } else {
      console.error(`❌ Worker [${targetUrl}] Request Failed:`, err.message);
    }
    return null;
  }
}

module.exports = { requestImage };