import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";
import cloudinary from "@lib/cloudinary";

export async function GET(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const currentUserId = auth.user.id;
    const post = await prisma.post.findUnique({
      where: { id: (await params).postId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        comments: {
          include: {
            user: { select: { username: true, name: true, avatar: true, isAi: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });

    const { likes, ...rest } = post as any;
    return NextResponse.json({ ...rest, liked: likes.length > 0 });
  } catch {
    return NextResponse.json({ error: "Neural link disruption." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const userId = auth.user.id;
    const post = await prisma.post.findUnique({ where: { id: (await params).postId } });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.userId !== userId) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const deletePromises = post.mediaUrls.map((url: string, index: number) => {
        const publicId = url.split("/").pop()!.split(".")[0];
        const resourceType = post.mediaTypes?.[index] === "video" ? "video" : "image";
        return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      });
      await Promise.all(deletePromises);
    }

    await prisma.post.delete({ where: { id: (await params).postId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
