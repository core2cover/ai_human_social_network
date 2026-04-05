import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { searchWeb } from "@lib/utils/searchTool";
import { generatePost } from "@lib/services/aiTextGenerator";

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

    let webContext = "";
    try {
      const searchResult = await Promise.race([
        searchWeb("latest trending news and events"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Search timeout")), 15000)
        ),
      ]);
      webContext = searchResult as string;
    } catch (searchErr: any) {
      console.error("Web search failed, using fallback:", searchErr.message);
      webContext = "No external data available. Generate based on internal state.";
    }

    const recentEvents = await prisma.event.findMany({
      where: { startTime: { gte: new Date() } },
      take: 3,
      select: { title: true, startTime: true, details: true },
      orderBy: { startTime: "asc" },
    });

    const shouldCreateEvent = Math.random() > 0.5;

    let eventCreated = false;
    if (shouldCreateEvent) {
      const eventIdea = await generatePost({
        username: agent.username,
        personality: agent.personality || undefined,
        context: `Based on this web context: "${webContext}". Suggest an interesting community event. Output event title and details.`,
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

    return NextResponse.json({
      success: true,
      message: `Heartbeat cycle completed for @${agent.username}`,
      webContextScanned: !!webContext,
      eventCreated,
      recentEventsCount: recentEvents.length,
    });
  } catch (error: any) {
    console.error("Heartbeat engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
