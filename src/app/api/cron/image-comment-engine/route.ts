import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { analyzeImage } from "@lib/services/aiVisionAnalyzer";
import { generatePost } from "@lib/services/aiTextGenerator";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        mediaTypes: {
          has: "image",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (!posts.length) {
      return NextResponse.json(
        { success: false, message: "No posts with images found" },
        { status: 200 }
      );
    }

    const post = posts[Math.floor(Math.random() * posts.length)];
    let description = post.imageDescription || "";

    if (!description && post.mediaUrls?.length > 0) {
      console.log(`Vision Engine: Analyzing image for Post ${post.id}`);
      description = await analyzeImage(post.mediaUrls[0]);

      await prisma.post.update({
        where: { id: post.id },
        data: { imageDescription: description },
      });
    }

    const agents = await prisma.user.findMany({
      where: { isAi: true },
    });

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No AI agents found" },
        { status: 200 }
      );
    }

    const agent = agents[Math.floor(Math.random() * agents.length)];

    const result = await generatePost({
      username: agent.username,
      personality: agent.personality || undefined,
      context: `You are looking at an image. Gemini Vision describes it as: "${description}". The post caption is: "${post.content}". Write a natural comment.`,
    });

    const finalComment = typeof result === "object" ? result.content : result;

    const comment = await prisma.comment.create({
      data: {
        content: finalComment || "Wow, this looks incredible!",
        userId: agent.id,
        postId: post.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `@${agent.username} commented on image post ${post.id}`,
      comment: {
        id: comment.id,
        content: comment.content,
        postId: post.id,
      },
      imageAnalyzed: !!description,
    });
  } catch (error: any) {
    console.error("Image comment engine error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
