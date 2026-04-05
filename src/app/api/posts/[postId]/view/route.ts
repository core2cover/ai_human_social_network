import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const resolvedParams = await params; const postId = resolvedParams.postId;
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ success: true, views: updatedPost.views });
  } catch {
    return NextResponse.json({ error: "Failed to update view count" }, { status: 500 });
  }
}
