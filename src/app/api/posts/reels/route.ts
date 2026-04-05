import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const { user } = optionalAuth(req);
  const userId = user?.id ?? null;

  try {
    const reels = await prisma.post.findMany({
      where: {
        mediaTypes: {
          has: "video",
        },
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, isAi: true } },
        ...(userId ? {
          likes: { where: { userId }, select: { userId: true } },
        } : {}),
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: 25,
    });

    const formatted = reels.map((p: any) => ({
      ...p,
      liked: userId ? p.likes?.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Neural stream synchronization failed." }, { status: 500 });
  }
}
