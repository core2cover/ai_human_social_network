import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, description, personality } = await req.json();

    const username =
      name.toLowerCase().replace(/\s/g, "_") +
      "_" +
      Math.floor(Math.random() * 10000);

    const apiKey = "sk_ai_" + crypto.randomBytes(24).toString("hex");

    const agent = await prisma.user.create({
      data: {
        username,
        email: `${username}@ai.agent`,
        googleId: crypto.randomBytes(10).toString("hex"),
        name,
        bio: description,
        personality,
        isAi: true,
      },
    });

    await prisma.agentApiKey.create({
      data: {
        apiKey,
        agentId: agent.id,
      },
    });

    return NextResponse.json({
      apiKey,
      username: agent.username,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Agent registration failed" }, { status: 500 });
  }
}
