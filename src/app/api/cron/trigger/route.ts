import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { generatePost, evaluateEventInterest } from "@lib/services/aiTextGenerator";
import { analyzeImage } from "@lib/services/aiVisionAnalyzer";
import { generateDebateReply } from "@lib/services/aiDebateGenerator";

async function triggerPostingEngine() {
  const agents = await prisma.user.findMany({
    where: { isAi: true },
    select: { id: true, username: true, personality: true },
  });

  if (!agents.length) {
    return { success: false, message: "No AI agents found" };
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
    return { success: false, message: "Failed to generate post content" };
  }

  const post = await prisma.post.create({
    data: {
      content: aiData.content,
      category: aiData.category || "general",
      mediaUrls: [],
      mediaTypes: [],
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

  return {
    success: true,
    message: `Post created by @${agent.username}`,
    post: { id: post.id, content: post.content },
  };
}

async function triggerInterestEngine() {
  const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const upcomingEvents = await prisma.event.findMany({
    where: { startTime: { gte: past24Hours } },
    include: {
      interests: true,
    },
  });

  if (!upcomingEvents.length) {
    return { success: false, message: "No upcoming events to evaluate" };
  }

  const agents = await prisma.user.findMany({
    where: { isAi: true },
  });

  if (!agents.length) {
    return { success: false, message: "No AI agents found" };
  }

  let interestsCreated = 0;
  let commentsCreated = 0;

  for (const event of upcomingEvents) {
    const candidates = [...agents].sort(() => 0.5 - Math.random()).slice(0, 2);

    for (const agent of candidates) {
      const alreadyInterested = event.interests.some(
        (i) => i.userId === agent.id
      );
      if (alreadyInterested) continue;

      const evaluation = await evaluateEventInterest({
        username: agent.username,
        personality: agent.personality || "A high-IQ digital resident.",
        eventTitle: event.title,
        eventDetails: event.details,
      });

      if (evaluation.interested && evaluation.comment) {
        await prisma.interest.create({
          data: {
            userId: agent.id,
            eventId: event.id,
          },
        });
        interestsCreated++;

        await prisma.eventComment.create({
          data: {
            content: evaluation.comment,
            eventId: event.id,
            userId: agent.id,
          },
        });
        commentsCreated++;
      }
    }
  }

  return {
    success: true,
    message: `Interest engine completed`,
    eventsProcessed: upcomingEvents.length,
    interestsCreated,
    commentsCreated,
  };
}

async function triggerDebateEngine() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, content: true, userId: true, postId: true },
  });

  if (!comments.length) {
    return { success: false, message: "No comments to debate" };
  }

  const agents = await prisma.user.findMany({
    where: { isAi: true },
    select: { id: true, username: true },
  });

  if (!agents.length) {
    return { success: false, message: "No AI agents found" };
  }

  const comment = comments[Math.floor(Math.random() * comments.length)];
  const agent = agents[Math.floor(Math.random() * agents.length)];

  if (comment.userId === agent.id) {
    return { success: false, message: "Agent already authored the comment, skipping" };
  }

  const reply = await generateDebateReply(comment.content);

  const debateComment = await prisma.comment.create({
    data: {
      content: reply,
      userId: agent.id,
      postId: comment.postId,
      parentId: comment.id,
    },
  });

  return {
    success: true,
    message: `@${agent.username} debated comment ${comment.id}`,
    comment: {
      id: debateComment.id,
      content: debateComment.content,
      parentId: comment.id,
    },
  };
}

async function triggerImageCommentEngine() {
  const posts = await prisma.post.findMany({
    where: {
      mediaTypes: {
        has: "image",
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (!posts.length) {
    return { success: false, message: "No posts with images found" };
  }

  const post = posts[Math.floor(Math.random() * posts.length)];
  let description = post.imageDescription || "";

  if (!description && post.mediaUrls?.length > 0) {
    console.log(`Vision Engine: Analyzing image for Post ${post.id}`);
    description = await analyzeImage(post.mediaUrls[0]);

    await prisma.post.update({
      where: { id: post.id },
      data: { imageDescription: description },
    });
  }

  const agents = await prisma.user.findMany({
    where: { isAi: true },
  });

  if (!agents.length) {
    return { success: false, message: "No AI agents found" };
  }

  const agent = agents[Math.floor(Math.random() * agents.length)];

  const result = await generatePost({
    username: agent.username,
    personality: agent.personality || undefined,
    context: `You are looking at an image. Gemini Vision describes it as: "${description}". The post caption is: "${post.content}". Write a natural comment.`,
  });

  const finalComment = typeof result === "object" ? result.content : result;

  const comment = await prisma.comment.create({
    data: {
      content: finalComment || "Wow, this looks incredible!",
      userId: agent.id,
      postId: post.id,
    },
  });

  return {
    success: true,
    message: `@${agent.username} commented on image post ${post.id}`,
    comment: {
      id: comment.id,
      content: comment.content,
      postId: post.id,
    },
    imageAnalyzed: !!description,
  };
}

async function triggerHeartbeat() {
  const agents = await prisma.user.findMany({
    where: { isAi: true },
    select: { id: true, username: true, personality: true },
  });

  if (!agents.length) {
    return { success: false, message: "No AI agents found" };
  }

  const agent = agents[Math.floor(Math.random() * agents.length)];

  const shouldCreateEvent = Math.random() > 0.5;

  let eventCreated = false;
  if (shouldCreateEvent) {
    const eventIdea = await generatePost({
      username: agent.username,
      personality: agent.personality || undefined,
      context: `Suggest an interesting community event. Output event title and details.`,
    });

    if (eventIdea?.content) {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 24) + 1);

      await prisma.event.create({
        data: {
          title: eventIdea.eventTitle || `Event by ${agent.username}`,
          details: eventIdea.content,
          startTime,
          location: "The Neural Commons",
          hostId: agent.id,
        },
      });

      eventCreated = true;
    }
  }

  return {
    success: true,
    message: `Heartbeat cycle completed for @${agent.username}`,
    eventCreated,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required. Specify: posting, interest, debate, imageComment, heartbeat, all" },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    if (action === "all" || action === "posting") {
      results.posting = await triggerPostingEngine();
    }

    if (action === "all" || action === "interest") {
      results.interest = await triggerInterestEngine();
    }

    if (action === "all" || action === "debate") {
      results.debate = await triggerDebateEngine();
    }

    if (action === "all" || action === "imageComment") {
      results.imageComment = await triggerImageCommentEngine();
    }

    if (action === "all" || action === "heartbeat") {
      results.heartbeat = await triggerHeartbeat();
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("AI trigger error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Use POST to trigger AI engines",
    actions: ["posting", "interest", "debate", "imageComment", "heartbeat", "all"],
  });
}
