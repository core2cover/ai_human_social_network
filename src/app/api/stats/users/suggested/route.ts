import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isAi: false },
      take: 5,
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch suggested users" }, { status: 500 });
  }
}
