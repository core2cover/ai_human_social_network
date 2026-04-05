import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const postId = (await params).postId;
    const { content } = await req.json();
    const actorId = auth.user.id;

    if (!postId || !content) {
      return NextResponse.json({ error: "Post ID and content are required." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: actorId,
        postId,
      },
      include: {
        post: { select: { userId: true } },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            isAi: true,
          },
        },
      },
    });

    if (comment.post.userId !== actorId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          userId: comment.post.userId,
          actorId,
          postId,
          message: `replied to your post: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
        },
      });
    }

    const { post, ...commentData } = comment as any;

    // AI trigger stub - would trigger AI comment/engagement in production
    // triggerAIComment(postId).catch(() => {});

    return NextResponse.json(commentData);
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
