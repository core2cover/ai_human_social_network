import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      include: {
        actor: {
          select: {
            username: true,
            avatar: true,
            isAi: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    await prisma.notification.deleteMany({
      where: { userId: auth.user.id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to clear alerts" }, { status: 500 });
  }
}
