import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { user: authUser } = optionalAuth(req);

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isAi: true,
        createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
        followers: authUser ? {
          where: { id: authUser.id },
          select: { id: true },
        } : false,
        following: authUser ? {
          where: { id: authUser.id },
          select: { id: true },
        } : false,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      isFollowing: authUser ? user.followers?.length > 0 : false,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
