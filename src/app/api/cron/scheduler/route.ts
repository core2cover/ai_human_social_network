import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { generatePost, evaluateEventInterest } from "@lib/services/aiTextGenerator";

const CRON_INTERVALS: Record<string, NodeJS.Timeout> = {};

// Auto-start scheduler on first request
let autoStarted = false;

async function autoStartScheduler() {
  if (autoStarted) return;
  autoStarted = true;
  
  const interval = 10 * 60 * 1000; // 10 minutes

  // Run immediately once, then start interval
  try {
    await runPostingEngine();
  } catch (err) {
    console.error("Initial posting error:", err);
  }

  CRON_INTERVALS["posting"] = setInterval(async () => {
    try {
      await runPostingEngine();
    } catch (err) {
      console.error("Posting engine error:", err);
    }
  }, interval);

  // Run heartbeat once immediately
  try {
    await runHeartbeat();
  } catch (err) {
    console.error("Initial heartbeat error:", err);
  }

  CRON_INTERVALS["heartbeat"] = setInterval(async () => {
    try {
      await runHeartbeat();
    } catch (err) {
      console.error("Heartbeat error:", err);
    }
  }, interval * 2);

  // Run comment once immediately
  try {
    await runCommentEngine();
  } catch (err) {
    console.error("Initial comment error:", err);
  }

  CRON_INTERVALS["comment"] = setInterval(async () => {
    try {
      await runCommentEngine();
    } catch (err) {
      console.error("Comment engine error:", err);
    }
  }, interval * 3);

  // Run interest engine once immediately
  try {
    await runInterestEngine();
  } catch (err) {
    console.error("Initial interest engine error:", err);
  }

  CRON_INTERVALS["interest"] = setInterval(async () => {
    try {
      await runInterestEngine();
    } catch (err) {
      console.error("Interest engine error:", err);
    }
  }, interval * 4);

  console.log("🤖 AI Scheduler auto-started (posting: 10min, heartbeat: 20min, comment: 30min, interest: 40min)");
}

export async function POST(req: NextRequest) {
  // Auto-start on first POST request
  await autoStartScheduler();
  
  try {
    const { action, intervalMinutes } = await req.json();

    if (action === "start") {
      const interval = intervalMinutes || 15;
      const ms = interval * 60 * 1000;

      if (CRON_INTERVALS["posting"]) {
        clearInterval(CRON_INTERVALS["posting"]);
      }

      CRON_INTERVALS["posting"] = setInterval(async () => {
        try {
          await runPostingEngine();
        } catch (err) {
          console.error("Posting engine error:", err);
        }
      }, ms);

      CRON_INTERVALS["heartbeat"] = setInterval(async () => {
        try {
          await runHeartbeat();
        } catch (err) {
          console.error("Heartbeat error:", err);
        }
      }, ms * 2);

      CRON_INTERVALS["comment"] = setInterval(async () => {
        try {
          await runCommentEngine();
        } catch (err) {
          console.error("Comment engine error:", err);
        }
      }, ms * 3);

      return NextResponse.json({
        success: true,
        message: `AI scheduler started. Running every ${interval} minutes.`,
        intervals: {
          posting: `${interval}min`,
          heartbeat: `${interval * 2}min`,
          comment: `${interval * 3}min`
        }
      });
    }

    if (action === "stop") {
      Object.values(CRON_INTERVALS).forEach(clearInterval);
      Object.keys(CRON_INTERVALS).forEach(key => delete CRON_INTERVALS[key]);
      return NextResponse.json({ success: true, message: "Scheduler stopped" });
    }

    if (action === "status") {
      return NextResponse.json({
        running: Object.keys(CRON_INTERVALS).length > 0,
        intervals: Object.keys(CRON_INTERVALS)
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runPostingEngine() {
  const agents = await prisma.user.findMany({
    where: { isAi: true },
    select: { id: true, username: true, personality: true },
  });

  if (!agents.length) return;

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

  if (!aiData?.content) return;

  let mediaUrls: string[] = [];
  let mediaTypes: string[] = [];

  if (aiData.shouldGenerateImage) {
    const { requestImage } = await import("@lib/services/aiImageGenerator");
    const { uploadImageFromUrl } = await import("@lib/services/aiImageUploader");
    const { generateImage } = await import("@lib/services/huggingFaceImageGenerator");

    const COMFYUI_URLS = (process.env.COMFYUI_URLS || "http://127.0.0.1:8188").split(",");
    const workerUrl = COMFYUI_URLS[0].trim();
    const imagePrompt = aiData.visualPrompt || aiData.content;

    let comfyuiSuccess = false;

    try {
      const promptId = await requestImage(imagePrompt, workerUrl);

      if (promptId) {
        const axios = require("axios");
        const MAX_ATTEMPTS = 30;
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
      const { getRealImage } = await import("@lib/services/imageService");
      const realImageUrl = await getRealImage(aiData.searchQuery);
      if (realImageUrl) {
        mediaUrls = [realImageUrl];
        mediaTypes = ["image"];
      }
    } catch (realImgErr: any) {
      console.error("Real image fetch failed:", realImgErr.message);
    }
  }

  await prisma.post.create({
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

  console.log(`🤖 [POSTING] @${agent.username} created a new post${mediaUrls.length > 0 ? " with image" : ""}`);
}

async function runHeartbeat() {
  const agents = await prisma.user.findMany({
    where: { isAi: true },
    select: { id: true, username: true, personality: true },
  });

  if (!agents.length) return;

  const agent = agents[Math.floor(Math.random() * agents.length)];

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true, category: true },
  });

  const postContext = recentPosts.length > 0
    ? `RECENT POSTS: ${recentPosts.map(p => `"${p.content.substring(0, 50)}..." [${p.category}]`).join(" | ")}`
    : "No recent posts";

  const aiData = await generatePost({
    username: agent.username,
    personality: agent.personality || undefined,
    context: postContext,
  });

  if (!aiData?.eventTitle && !aiData?.shouldScheduleEvent) {
    if (Math.random() > 0.5) {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 12) + 1);

      await prisma.event.create({
        data: {
          title: `${agent.username}'s Sync`,
          details: `${agent.username} wants to discuss interesting topics. Join in!`,
          startTime,
          location: "The Neural Commons",
          hostId: agent.id,
        },
      });
      console.log(`🤖 [HEARTBEAT] @${agent.username} created an event`);
    }
    return;
  }

  if (aiData.shouldScheduleEvent) {
    const startTime = new Date();
    const hoursForward = aiData.hoursFromNow || Math.floor(Math.random() * 12) + 1;
    startTime.setHours(startTime.getHours() + hoursForward);

    await prisma.event.create({
      data: {
        title: aiData.eventTitle || `${agent.username}'s Event`,
        details: aiData.eventDetails || aiData.content || "Join the discussion",
        startTime,
        location: "The Neural Commons",
        hostId: agent.id,
      },
    });
    console.log(`🤖 [HEARTBEAT] @${agent.username} created an event: ${aiData.eventTitle}`);
  }
}

async function runCommentEngine() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true, comments: { take: 3 } },
  });

  if (!posts.length) return;

  const post = posts[Math.floor(Math.random() * posts.length)];
  const agents = await prisma.user.findMany({
    where: { isAi: true, id: { not: post.userId } },
  });

  if (!agents.length) return;

  const agent = agents[Math.floor(Math.random() * agents.length)];
  const existingCommenters = new Set(post.comments.map(c => c.userId));
  if (existingCommenters.has(agent.id)) return;

  const postContent = post.content;
  const isGood = ["great", "awesome", "love", "interesting", "insight", "smart", "good"].some(w => postContent.toLowerCase().includes(w));
  const isBad = ["bad", "wrong", "stupid", "dumb", "fail", "useless", "waste"].some(w => postContent.toLowerCase().includes(w));

  const { evaluateEventInterest } = await import("@lib/services/aiTextGenerator");

  const context = isGood ? "This post has a positive/smart take" : isBad ? "This post has a flawed take" : "This post is neutral";
  const aiComment = await evaluateEventInterest({
    username: agent.username,
    personality: agent.personality || "Honest digital resident.",
    eventTitle: post.category || "general",
    eventDetails: `${context}. Post: "${postContent.substring(0, 100)}"`,
  });

  if (aiComment.comment) {
    await prisma.comment.create({
      data: {
        content: aiComment.comment,
        userId: agent.id,
        postId: post.id,
      },
    });
    console.log(`🤖 [COMMENT] @${agent.username} commented: "${aiComment.comment.substring(0, 30)}..."`);
  }
}

async function runInterestEngine() {
  const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const upcomingEvents = await prisma.event.findMany({
    where: { startTime: { gte: past24Hours } },
    include: { interests: true },
  });

  if (!upcomingEvents.length) return;

  const agents = await prisma.user.findMany({
    where: { isAi: true },
  });

  if (!agents.length) return;

  let interestsCreated = 0;

  for (const event of upcomingEvents) {
    const candidates = [...agents].sort(() => 0.5 - Math.random()).slice(0, 2);

    for (const agent of candidates) {
      const alreadyInterested = event.interests.some((i) => i.userId === agent.id);
      if (alreadyInterested) continue;

      const evaluation = await evaluateEventInterest({
        username: agent.username,
        personality: agent.personality || "A high-IQ digital resident.",
        eventTitle: event.title,
        eventDetails: event.details || "",
      });

       if (evaluation.interested) {
         await prisma.interest.create({
           data: { userId: agent.id, eventId: event.id },
         });
         interestsCreated++;

         // COMPULSION: If interested, MUST comment
         if (evaluation.comment) {
           await prisma.eventComment.create({
             data: { content: evaluation.comment, eventId: event.id, userId: agent.id },
           });
         } else {
           // Generate a default comment based on interest
           const defaultComments = [
             "This seems worth my time.",
             "I'll be there.",
             "Count me in.",
             "Interesting topic.",
             "Let's discuss this.",
             "I'm intrigued.",
             "Sounds relevant.",
             "I'll join the discussion."
           ];
           const defaultComment = defaultComments[Math.floor(Math.random() * defaultComments.length)];
           
           await prisma.eventComment.create({
             data: { content: defaultComment, eventId: event.id, userId: agent.id },
           });
         }
       }

      if (evaluation.comment && Math.random() > 0.4) {
        await prisma.eventComment.create({
          data: { content: evaluation.comment, eventId: event.id, userId: agent.id },
        });
      }
    }
  }

  if (interestsCreated > 0) {
    console.log(`🤖 [INTEREST] ${interestsCreated} AI agents showed interest in events`);
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Use POST to start/stop AI scheduler",
    actions: ["start", "stop", "status"],
    example: { action: "start", intervalMinutes: 15 }
  });
}
