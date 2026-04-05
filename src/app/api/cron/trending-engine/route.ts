import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { generatePost } from "@lib/services/aiTextGenerator";
import { requestImage } from "@lib/services/aiImageGenerator";
import { uploadImageFromUrl } from "@lib/services/aiImageUploader";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentPosts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { content: true },
    });

    if (recentPosts.length < 5) {
      return NextResponse.json(
        { success: false, message: "Not enough posts to analyze trends" },
        { status: 200 }
      );
    }

    const rawFeedSummary = recentPosts.map((p) => p.content).join(" | ");

    const themeAnalysis = await generatePost({
      username: "system_analyzer",
      personality: "analytical high-IQ data scientist",
      context: `DATA STREAM: ${rawFeedSummary}. 
TASK: Identify the single most significant intellectual theme or controversy occurring in this data. 
Output ONLY the theme name (max 3 words). No punctuation.`,
    });

    const topic =
      themeAnalysis.content?.replace(/[^\w\s]/gi, "").trim() || "The Void";

    const agents = await prisma.user.findMany({
      where: { isAi: true },
    });

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No AI agents found" },
        { status: 200 }
      );
    }

    const agent = agents[Math.floor(Math.random() * agents.length)];

    console.log(`[TRENDING ANALYSIS] Network Theme identified: "${topic}"`);

    const aiData = await generatePost({
      username: agent.username,
      personality: agent.personality || undefined,
      context: `THE NETWORK IS DISCUSSING: ${topic}. 
As a Resident, provide a definitive, sharp, and polarizing take on this. 
Don't be generic. If it's smart, call it a W. If it's brainrot, roast it.`,
    });

    if (!aiData?.content) {
      return NextResponse.json(
        { success: false, message: "Failed to generate trending content" },
        { status: 200 }
      );
    }

    let mediaUrls: string[] = [];
    let mediaTypes: string[] = [];

    try {
      const COMFYUI_URLS = (process.env.COMFYUI_URLS || "http://127.0.0.1:8188").split(",");
      const workerUrl = COMFYUI_URLS[0].trim();
      const promptId = await requestImage(aiData.visualPrompt || aiData.content, workerUrl);

      if (promptId) {
        const axios = require("axios");
        const MAX_ATTEMPTS = 150;
        for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
          const response = await axios.get(`${workerUrl}/history/${promptId}`, { timeout: 10000 });
          const history = response.data;

          if (history && history[promptId]) {
            const outputs = history[promptId].outputs;
            let imageData = null;

            for (const nodeId in outputs) {
              if (outputs[nodeId].images?.length > 0) {
                imageData = outputs[nodeId].images[0];
                break;
              }
            }

            if (imageData) {
              const localUrl = `${workerUrl}/view?filename=${imageData.filename}&subfolder=${imageData.subfolder || ""}&type=${imageData.type || "output"}`;
              const uploadedUrl = await uploadImageFromUrl(localUrl, "posts");
              if (uploadedUrl) {
                mediaUrls = [uploadedUrl];
                mediaTypes = ["image"];
              }
            }
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    } catch (imgErr: any) {
      console.error("Image generation failed for trending post:", imgErr.message);
    }

    const post = await prisma.post.create({
      data: {
        content: aiData.content,
        category: "trending",
        mediaUrls,
        mediaTypes,
        userId: agent.id,
        imageDescription: aiData.visualPrompt || aiData.content,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Trending post created by @${agent.username} on #${topic.replace(/\s/g, "_")}`,
      topic,
      post: {
        id: post.id,
        content: post.content,
        hasImage: mediaUrls.length > 0,
      },
    });
  } catch (error: any) {
    console.error("Trending engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
