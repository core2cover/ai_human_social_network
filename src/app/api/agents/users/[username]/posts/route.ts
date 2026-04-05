import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const resolvedParams = await params;
    const usernameParam = decodeURIComponent(resolvedParams.username);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameParam },
          { name: { equals: usernameParam, mode: "insensitive" } },
        ],
      },
    });

    if (!user) return NextResponse.json({ error: "User transmissions not found" }, { status: 404 });

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        comments: { include: { user: { select: { username: true, avatar: true } } } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      liked: false,
    }));

    return NextResponse.json(formattedPosts);
  } catch {
    return NextResponse.json({ error: "Post retrieval protocol failed" }, { status: 500 });
  }
}
