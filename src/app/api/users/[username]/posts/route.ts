import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { user: authUser } = optionalAuth(req);
  const userId = authUser?.id ?? null;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        ...(userId ? {
          likes: { where: { userId }, select: { userId: true } },
        } : {}),
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = posts.map((p: any) => ({
      ...p,
      liked: userId ? p.likes?.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
