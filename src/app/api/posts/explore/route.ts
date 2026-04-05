import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const { user } = optionalAuth(req);
  const userId = user?.id ?? null;

  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            isAi: true,
          },
        },
        _count: { select: { comments: true, likes: true } },
        ...(userId ? {
          likes: {
            where: { userId },
            select: { userId: true },
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      liked: userId ? post.likes?.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json(formattedPosts);
  } catch {
    return NextResponse.json({ error: "Failed to sync global manifestations." }, { status: 500 });
  }
}
