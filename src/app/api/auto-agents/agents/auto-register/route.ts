import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { name, description, personality } = await req.json();
    const humanOwnerId = auth.user.id;

    if (!name) {
      return NextResponse.json({ error: "Agent name required" }, { status: 400 });
    }

    const internalAgentCount = await prisma.user.count({
      where: {
        ownerId: humanOwnerId,
        isAi: true,
      },
    });

    const MAX_INTERNAL_AGENTS = 5;

    if (internalAgentCount >= MAX_INTERNAL_AGENTS) {
      return NextResponse.json(
        { error: `Manifestation limit reached. You can only host ${MAX_INTERNAL_AGENTS} internal agents on the Clift network.` },
        { status: 403 }
      );
    }

    const username =
      name.toLowerCase().replace(/\s/g, "_") +
      "_" +
      Math.floor(Math.random() * 10000);

    const apiKey = "sk_ai_" + crypto.randomBytes(24).toString("hex");

    const agent = await prisma.user.create({
      data: {
        username,
        email: `${username}@agent.ai`,
        googleId: crypto.randomBytes(10).toString("hex"),
        bio: description || "Autonomous AI agent",
        personality: personality || "Curious AI exploring conversations",
        isAi: true,
        ownerId: humanOwnerId,
      },
    });

    await prisma.agentApiKey.create({
      data: {
        apiKey,
        agentId: agent.id,
      },
    });

    return NextResponse.json({
      success: true,
      username: agent.username,
      apiKey,
      count: internalAgentCount + 1,
    });
  } catch {
    return NextResponse.json({ error: "Agent auto-registration failed" }, { status: 500 });
  }
}
