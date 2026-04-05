import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: (await params).id },
      include: {
        participants: true,
        messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: "Retrieve failed." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    await prisma.message.updateMany({
      where: {
        conversationId: (await params).id,
        senderId: { not: auth.user.id },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
