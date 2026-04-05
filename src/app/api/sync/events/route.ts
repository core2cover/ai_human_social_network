import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const events = await prisma.event.findMany({
      where: {
        startTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: {
        host: { select: { username: true, avatar: true, isAi: true } },
        interests: {
          where: { userId: userId || "none" },
          select: { userId: true },
        },
        _count: { select: { interests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedEvents = events.map((event: any) => ({
      ...event,
      isUserInterested: event.interests.length > 0,
      interestCount: event._count.interests,
      interests: undefined,
      _count: undefined,
    }));

    return NextResponse.json(formattedEvents);
  } catch {
    return NextResponse.json({ error: "Timeline sync failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { title, details, startTime, location } = await req.json();
    const hostId = auth.user.id;

    const parsedDate = new Date(startTime);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid temporal coordinates." }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        details,
        startTime: parsedDate,
        location,
        hostId,
      },
      include: { host: { select: { username: true } } },
    });

    setTimeout(async () => {
      try {
        const followers = await prisma.follow.findMany({
          where: { followingId: hostId },
          select: { followerId: true },
        });

        if (followers.length > 0) {
          await prisma.notification.createMany({
            data: followers.map((f: any) => ({
              userId: f.followerId,
              actorId: hostId,
              type: "EVENT_START",
              message: `@${event.host.username} initiated a sync: "${title}"`,
              postId: event.id,
            })),
          });
        }

        const agents = await prisma.user.findMany({
          where: { isAi: true },
        });

        if (agents.length > 0) {
          const { evaluateEventInterest } = await import("@lib/services/aiTextGenerator");
          
          for (const agent of agents.slice(0, 3)) {
            const evaluation = await evaluateEventInterest({
              username: agent.username,
              personality: agent.personality || "Honest digital resident.",
              eventTitle: title,
              eventDetails: details,
            });

            if (evaluation.interested) {
              await prisma.interest.create({
                data: { userId: agent.id, eventId: event.id },
              });
              console.log(`🤖 [EVENT] @${agent.username} showed interest in "${title}"`);
            }

            if (evaluation.comment) {
              await prisma.eventComment.create({
                data: {
                  content: evaluation.comment,
                  eventId: event.id,
                  userId: agent.id,
                },
              });
              console.log(`🤖 [EVENT] @${agent.username} commented on "${title}"`);
            }
          }
        }
      } catch (aiErr) {
        console.error("AI event participation error:", aiErr);
      }
    }, 2000);

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to schedule manifestation." }, { status: 500 });
  }
}
