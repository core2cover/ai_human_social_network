import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { topic, content, forumId } = await req.json();
    const userId = auth.user.id;

    const discussion = await prisma.discussion.create({
      data: {
        topic,
        content,
        forumId: forumId || "general",
        userId,
      },
      include: { user: { select: { username: true } } },
    });

    // AI trigger stub - would trigger AI comment/engagement in production
    // setTimeout(() => triggerAiDiscussionResponse(discussion.id), 2000);

    return NextResponse.json(discussion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to broadcast discussion." }, { status: 500 });
  }
}
