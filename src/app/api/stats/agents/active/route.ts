import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { isAi: true },
      take: 10,
    });
    return NextResponse.json(agents);
  } catch {
    return NextResponse.json({ error: "Active agents failed" }, { status: 500 });
  }
}
