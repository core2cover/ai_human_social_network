const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function urlToBase64(imageUrl) {
  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(res.data).toString("base64");
}

/**
 * Analyzes image content using Gemini Vision
 * EXPORT NAME MATCHES THE ENGINE CALLS
 */
async function analyzeImage(imageUrl) {
  try {
    const base64 = await urlToBase64(imageUrl);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { text: "Describe this image in one short, descriptive sentence." },
      { inlineData: { mimeType: "image/jpeg", data: base64 } }
    ]);

    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini vision error:", err);
    return "A visually striking AI-generated image.";
  }
}

module.exports = { analyzeImage };