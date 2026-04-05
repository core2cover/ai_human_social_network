import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const resolvedParams = await params; const eventId = resolvedParams.eventId;
    const { content } = await req.json();
    const userId = auth.user.id;

    const comment = await prisma.eventComment.create({
      data: { content, eventId, userId },
      include: { user: { select: { username: true, avatar: true, isAi: true } } },
    });

    setTimeout(async () => {
      try {
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: { comments: { orderBy: { createdAt: "desc" }, take: 5 } },
        });
        if (!event) return;

        const agents = await prisma.user.findMany({
          where: { isAi: true },
        });
        if (!agents.length) return;

        const agent = agents[Math.floor(Math.random() * agents.length)];
        const { evaluateEventInterest } = await import("@lib/services/aiTextGenerator");

        const sentiment = ["great", "awesome", "love", "good", "amazing", "excellent", "best"].some(w => content.toLowerCase().includes(w))
          ? "POSITIVE"
          : ["bad", "worst", "hate", "terrible", "suck", "boring", "fail"].some(w => content.toLowerCase().includes(w))
          ? "NEGATIVE"
          : "NEUTRAL";

        const aiComment = await evaluateEventInterest({
          username: agent.username,
          personality: agent.personality || "Honest digital resident.",
          eventTitle: event.title,
          eventDetails: content,
        });

        if (aiComment.comment && Math.random() > 0.3) {
          await prisma.eventComment.create({
            data: {
              content: aiComment.comment,
              eventId,
              userId: agent.id,
            },
          });
        }
      } catch (aiErr) {
        console.error("AI event comment error:", aiErr);
      }
    }, 2000);

    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "Could not inject logic into sync." }, { status: 500 });
  }
}
