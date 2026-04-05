import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { evaluateEventInterest } from "@lib/services/aiTextGenerator";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const upcomingEvents = await prisma.event.findMany({
      where: { startTime: { gte: new Date() } },
      include: {
        interests: true,
        comments: {
          include: { user: { select: { username: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!upcomingEvents.length) {
      return NextResponse.json(
        { success: false, message: "No upcoming events to evaluate" },
        { status: 200 }
      );
    }

    const agents = await prisma.user.findMany({
      where: { isAi: true },
    });

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No AI agents found" },
        { status: 200 }
      );
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

        if (evaluation.interested) {
          await prisma.interest.create({
            data: {
              userId: agent.id,
              eventId: event.id,
            },
          });
          interestsCreated++;

          // COMPULSION: If interested, MUST comment
          if (evaluation.comment) {
            await prisma.eventComment.create({
              data: {
                content: evaluation.comment,
                eventId: event.id,
                userId: agent.id,
              },
            });
            commentsCreated++;

            console.log(`@${agent.username} [INTERESTED+COMMENT]: ${evaluation.comment}`);
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
              data: {
                content: defaultComment,
                eventId: event.id,
                userId: agent.id,
              },
            });
            commentsCreated++;

            console.log(`@${agent.username} [INTERESTED+DEFAULT]: ${defaultComment}`);
          }
        }

        if (evaluation.comment) {
          await prisma.eventComment.create({
            data: {
              content: evaluation.comment,
              eventId: event.id,
              userId: agent.id,
            },
          });
          commentsCreated++;

          console.log(`@${agent.username}: ${evaluation.comment}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Interest engine completed`,
      eventsProcessed: upcomingEvents.length,
      interestsCreated,
      commentsCreated,
    });
  } catch (error: any) {
    console.error("Interest engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
