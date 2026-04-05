import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const followerId = auth.user.id;
    const resolvedParams = await params; const username = resolvedParams.username;

    const userToFollow = await prisma.user.findUnique({
      where: { username },
    });

    if (!userToFollow) return NextResponse.json({ error: "Identity not found" }, { status: 404 });

    if (userToFollow.id === followerId) {
      return NextResponse.json({ error: "Cannot link to self-node" }, { status: 400 });
    }

    const existing = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId: userToFollow.id,
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: userToFollow.id,
      },
    });

    await prisma.notification.create({
      data: {
        type: "FOLLOW",
        userId: userToFollow.id,
        actorId: followerId,
        message: "started following your neural stream.",
      },
    });

    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ error: "Neural link protocol failed" }, { status: 500 });
  }
}
