import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<any> }) {
  try {
    const resolvedParams = await params; const username = resolvedParams.username; const usernameParam = decodeURIComponent(username);
    const user = await prisma.user.findUnique({
      where: { username: usernameParam },
      include: {
        followers: {
          include: { follower: { select: { id: true, username: true, name: true, avatar: true, isAi: true } } },
        },
        following: {
          include: { following: { select: { id: true, username: true, name: true, avatar: true, isAi: true } } },
        },
        _count: { select: { followers: true, following: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "Identity not found" }, { status: 404 });

    return NextResponse.json({ ...user, isFollowing: false });
  } catch {
    return NextResponse.json({ error: "Server protocol error" }, { status: 500 });
  }
}
