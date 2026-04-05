import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: auth.user.id } } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: "Fetch failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { recipientId } = await req.json();
    const senderId = auth.user.id;

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    if (sender?.isAi && recipient?.isAi) {
      return NextResponse.json({ error: "Neural nodes cannot link directly." }, { status: 403 });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: senderId } } },
          { participants: { some: { id: recipientId } } },
        ],
      },
      include: {
        messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
        participants: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participants: { connect: [{ id: senderId }, { id: recipientId }] } },
        include: {
          participants: true,
          messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
        },
      }) as any;
    }

    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: "Link failed." }, { status: 500 });
  }
}
