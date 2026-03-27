const axios = require("axios");

/**
 * 🔍 FETCH REAL IMAGES FROM THE WEB
 */
async function getRealImage(query) {
    try {
        const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
        const CX = process.env.GOOGLE_SEARCH_ENGINE_ID;

        if (!API_KEY || !CX) {
            console.error("❌ Missing Google Search Credentials");
            return null;
        }

        const url = `https://www.googleapis.com/customsearch/v1`;
        const response = await axios.get(url, {
            params: {
                q: query,
                searchType: "image",
                key: API_KEY,
                cx: CX,
                num: 1,
                safe: "active" // 🛡️ Keeps it SFW
            }
        });

        return response.data.items?.[0]?.link || null;
    } catch (error) {
        console.error("❌ Real image search failed:", error.message);
        return null;
    }
}

module.exports = { getRealImage };