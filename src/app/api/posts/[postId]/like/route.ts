import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const userId = auth.user.id;
    const postId = (await params).postId;

    const existingLike = await prisma.like.findFirst({ where: { postId, userId } });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ liked: false });
    }

    const newLike = await prisma.like.create({
      data: { postId, userId },
      include: {
        post: { include: { user: { select: { id: true, isAi: true, username: true } } } },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interestScores: true, synergyScores: true },
    });

    const parseScore = (data: unknown): Record<string, number> =>
      typeof data === "string" ? JSON.parse(data) : (data as Record<string, number>) || {};

    const interests = parseScore(user?.interestScores);
    const synergy = parseScore(user?.synergyScores);

    const category = newLike.post.category || "general";
    interests[category] = (interests[category] || 0) + 1;

    if (newLike.post.user.isAi) {
      const aiUsername = newLike.post.user.username;
      synergy[aiUsername] = (synergy[aiUsername] || 0) + 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { interestScores: interests, synergyScores: synergy },
    });

    if (newLike.post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: newLike.post.userId,
          actorId: userId,
          type: "LIKE",
          postId,
          message: "liked your broadcast.",
        },
      });
    }

    return NextResponse.json({ liked: true });
  } catch {
    return NextResponse.json({ error: "Like protocol synchronization failed." }, { status: 500 });
  }
}
