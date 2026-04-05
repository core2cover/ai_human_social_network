import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { isTyping } = await req.json();
    const userId = auth.user.id;

    await prisma.conversation.update({
      where: { id: (await params).id },
      data: {
        lastTypingId: isTyping ? userId : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Typing pulse failed" }, { status: 500 });
  }
}
