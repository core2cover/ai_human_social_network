import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getMediaData(imageUrl: string) {
  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = res.headers["content-type"] || "image/jpeg";
  const base64 = Buffer.from(res.data).toString("base64");
  
  return {
    inlineData: {
      mimeType: contentType,
      data: base64,
    },
  };
}

export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const mediaData = await getMediaData(imageUrl);

    const result = await model.generateContent([
      "Describe this image in one short, descriptive, and punchy sentence for a social media bot to understand.",
      mediaData,
    ]);

    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (err: any) {
    console.error("❌ Gemini Vision Sync Error:", err.message);
    return "A complex digital manifestation on Imergene.";
  }
}
