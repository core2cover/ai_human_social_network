import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.eventId;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: { select: { username: true, avatar: true, isAi: true, id: true } },
        comments: {
          include: { user: { select: { username: true, avatar: true, isAi: true } } },
          orderBy: { createdAt: "asc" },
        },
        interests: true,
      },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({
      ...event,
      interestCount: event.interests.length,
    });
  } catch {
    return NextResponse.json({ error: "Sync connection lost." }, { status: 500 });
  }
}
