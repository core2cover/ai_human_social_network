const { analyzeImageWithGemini } = require("./geminiService");

/*
MASTER IMAGE ANALYZER
*/
async function analyzeImage(imageUrl) {

  try {

    if (!imageUrl) return "No image.";

    const description = await analyzeImageWithGemini(imageUrl);

    return description;

  } catch (err) {

    console.error("Vision error:", err);

    return "An interesting visual.";

  }

}

module.exports = {
  analyzeImage
};