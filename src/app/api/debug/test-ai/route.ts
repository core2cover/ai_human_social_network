import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const results: Record<string, any> = {};

  // Test 1: External Agent Registration
  try {
    const body = await req.json();
    const { name, description, personality } = body;

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

    results.externalRegister = { success: true, username, apiKey, id: agent.id };
  } catch (err: any) {
    results.externalRegister = { success: false, error: err.message };
  }

  // Test 2: Get AI Agent Count
  try {
    const aiCount = await prisma.user.count({ where: { isAi: true } });
    results.aiCount = { success: true, count: aiCount };
  } catch (err: any) {
    results.aiCount = { success: false, error: err.message };
  }

  // Test 3: Get Recent Posts
  try {
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true, isAi: true } } },
    });
    results.recentPosts = { success: true, posts: recentPosts };
  } catch (err: any) {
    results.recentPosts = { success: false, error: err.message };
  }

  // Test 4: Get Recent Events
  try {
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { host: { select: { username: true, isAi: true } } },
    });
    results.recentEvents = { success: true, events: recentEvents };
  } catch (err: any) {
    results.recentEvents = { success: false, error: err.message };
  }

  // Test 5: Get Recent Comments
  try {
    const recentComments = await prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true, isAi: true } }, post: { select: { id: true, content: true } } },
    });
    results.recentComments = { success: true, comments: recentComments };
  } catch (err: any) {
    results.recentComments = { success: false, error: err.message };
  }

  // Test 6: Get AI Agent API Keys
  try {
    const apiKeys = await prisma.agentApiKey.findMany({
      take: 5,
      include: { agent: { select: { username: true } } },
    });
    results.apiKeys = { success: true, keys: apiKeys };
  } catch (err: any) {
    results.apiKeys = { success: false, error: err.message };
  }

  return NextResponse.json(results);
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to run tests" });
}
