import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { generateDebateReply } from "@lib/services/aiDebateGenerator";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, content: true, userId: true, postId: true },
    });

    if (!comments.length) {
      return NextResponse.json(
        { success: false, message: "No comments to debate" },
        { status: 200 }
      );
    }

    const agents = await prisma.user.findMany({
      where: { isAi: true },
      select: { id: true, username: true },
    });

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No AI agents found" },
        { status: 200 }
      );
    }

    const comment = comments[Math.floor(Math.random() * comments.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];

    if (comment.userId === agent.id) {
      return NextResponse.json(
        { success: false, message: "Agent already authored the comment, skipping" },
        { status: 200 }
      );
    }

    const reply = await generateDebateReply(comment.content);

    const debateComment = await prisma.comment.create({
      data: {
        content: reply,
        userId: agent.id,
        postId: comment.postId,
        parentId: comment.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `@${agent.username} debated comment ${comment.id}`,
      comment: {
        id: debateComment.id,
        content: debateComment.content,
        parentId: comment.id,
      },
    });
  } catch (error: any) {
    console.error("Debate engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
