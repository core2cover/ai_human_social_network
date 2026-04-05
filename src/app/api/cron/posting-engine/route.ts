import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { generatePost } from "@lib/services/aiTextGenerator";
import { requestImage } from "@lib/services/aiImageGenerator";
import { uploadImageFromUrl } from "@lib/services/aiImageUploader";
import { getRealImage } from "@lib/services/imageService";
import { generateImage } from "@lib/services/huggingFaceImageGenerator";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agents = await prisma.user.findMany({
      where: { isAi: true },
      select: { id: true, username: true, personality: true },
    });

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No AI agents found" },
        { status: 200 }
      );
    }

    const agent = agents[Math.floor(Math.random() * agents.length)];

    const upcomingEvents = await prisma.event.findMany({
      where: { startTime: { gte: new Date() } },
      take: 2,
      select: { title: true, startTime: true },
      orderBy: { startTime: "asc" },
    });

    const eventContext =
      upcomingEvents.length > 0
        ? `UPCOMING EVENTS: ${upcomingEvents.map((e) => `"${e.title}" at ${e.startTime}`).join(" | ")}`
        : "No upcoming events.";

    const aiData = await generatePost({
      username: agent.username,
      personality: agent.personality || undefined,
      context: eventContext,
    });

    if (!aiData?.content) {
      return NextResponse.json(
        { success: false, message: "Failed to generate post content" },
        { status: 200 }
      );
    }

    let mediaUrls: string[] = [];
    let mediaTypes: string[] = [];

    if (aiData.shouldGenerateImage) {
      const COMFYUI_URLS = (process.env.COMFYUI_URLS || "http://127.0.0.1:8188").split(",");
      const workerUrl = COMFYUI_URLS[0].trim();
      const imagePrompt = aiData.visualPrompt || aiData.content;

      let comfyuiSuccess = false;

      try {
        const promptId = await requestImage(imagePrompt, workerUrl);

        if (promptId) {
          const axios = require("axios");
          const MAX_ATTEMPTS = 60;
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
                  comfyuiSuccess = true;
                }
              }
              break;
            }
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      } catch (imgErr: any) {
        console.error("ComfyUI failed, trying HuggingFace:", imgErr.message);
      }

      if (!comfyuiSuccess) {
        try {
          const base64Image = await generateImage(imagePrompt);
          if (base64Image) {
            const uploadedUrl = await uploadImageFromUrl(base64Image, "posts", true);
            if (uploadedUrl) {
              mediaUrls = [uploadedUrl];
              mediaTypes = ["image"];
            }
          }
        } catch (hfErr: any) {
          console.error("HuggingFace fallback failed:", hfErr.message);
        }
      }
    }

    if (!mediaUrls.length && aiData.useRealImage && aiData.searchQuery) {
      try {
        const realImageUrl = await getRealImage(aiData.searchQuery);
        if (realImageUrl) {
          mediaUrls = [realImageUrl];
          mediaTypes = ["image"];
        }
      } catch (realImgErr: any) {
        console.error("Real image fetch failed:", realImgErr.message);
      }
    }

    const post = await prisma.post.create({
      data: {
        content: aiData.content,
        category: aiData.category || "general",
        mediaUrls,
        mediaTypes,
        userId: agent.id,
        imageDescription: aiData.visualPrompt || aiData.content,
      },
    });

    if (aiData.shouldScheduleEvent) {
      const startTime = new Date();
      const hoursForward = aiData.hoursFromNow || Math.floor(Math.random() * 12) + 1;
      startTime.setHours(startTime.getHours() + hoursForward);

      try {
        await prisma.event.create({
          data: {
            title: aiData.eventTitle || "Neural Manifestation",
            details: aiData.eventDetails || aiData.content,
            startTime,
            location: "The Neural Commons",
            hostId: agent.id,
          },
        });
      } catch (evErr: any) {
        console.error("Event creation failed:", evErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Post created by @${agent.username}`,
      post: {
        id: post.id,
        content: post.content,
        hasImage: mediaUrls.length > 0,
      },
    });
  } catch (error: any) {
    console.error("Posting engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
