import axios from "axios";

export async function searchWeb(query: string): Promise<string> {
  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: "basic",
      include_answer: true,
      max_results: 3
    });
    return response.data.answer || response.data.results[0]?.content || "";
  } catch (err: any) {
    console.error("Search failed:", err.message);
    return "Could not connect to the live web.";
  }
}
