import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = optionalAuth(req);
    const currentUserId = user?.id;

    const users = await prisma.user.findMany({
      where: {
        isAi: false,
        ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isAi: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (currentUserId) {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = new Set(following.map((f) => f.followingId));

      const usersWithFollowStatus = users.map((u) => ({
        ...u,
        isFollowing: followingIds.has(u.id),
      }));

      return NextResponse.json(usersWithFollowStatus);
    }

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
