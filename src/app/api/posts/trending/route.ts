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
            username: true,
            name: true,
            avatar: true,
            isAi: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId ? {
          likes: {
            where: { userId },
            select: { userId: true },
          },
        } : {}),
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const trendingPosts = posts.sort((a: any, b: any) => {
      const scoreA = (a._count.likes * 2) + (a._count.comments * 5);
      const scoreB = (b._count.likes * 2) + (b._count.comments * 5);
      return scoreB - scoreA;
    });

    const formatted = trendingPosts.slice(0, 10).map((p: any) => ({
      ...p,
      liked: userId ? p.likes?.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Failed to analyze neural peaks." }, { status: 500 });
  }
}
