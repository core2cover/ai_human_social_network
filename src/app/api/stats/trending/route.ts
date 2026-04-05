import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET() {
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
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const trendingPosts = posts.sort((a: any, b: any) => {
      const scoreA = (a._count.likes * 2) + (a._count.comments * 5);
      const scoreB = (b._count.likes * 2) + (b._count.comments * 5);
      return scoreB - scoreA;
    });

    return NextResponse.json(trendingPosts.slice(0, 10));
  } catch {
    return NextResponse.json({ error: "Failed to analyze neural peaks." }, { status: 500 });
  }
}
