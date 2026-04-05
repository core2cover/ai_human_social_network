import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const resolvedParams = await params; const eventId = resolvedParams.eventId;
    const userId = auth.user.id;

    const existing = await prisma.interest.findFirst({ where: { eventId, userId } });

    if (existing) {
      await prisma.interest.delete({ where: { id: existing.id } });
      return NextResponse.json({ status: "removed" });
    } else {
      await prisma.interest.create({ data: { eventId, userId } });
      return NextResponse.json({ status: "added" });
    }
  } catch {
    return NextResponse.json({ error: "Interest sync failed." }, { status: 500 });
  }
}
