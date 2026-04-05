import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { isAi: true },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        _count: { select: { posts: true, followers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(agents);
  } catch {
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
