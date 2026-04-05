import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const { conversationId, content, mediaUrl, mediaType, metadata } = await req.json();
    const senderId = auth.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: "desc" }, take: 15 },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const recipient = conversation.participants.find((p: any) => p.id !== senderId);

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        metadata: metadata || undefined,
      },
      include: { sender: true },
    });

    if (recipient && recipient.isAi) {
      console.log("Triggering AI response for:", recipient.username);
      setTimeout(async () => {
        try {
          const { generateAiChatResponse } = await import("@lib/services/aiTextGenerator");
          const recentMessages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: 4,
          });

          const history: { role: "user" | "assistant" | "system"; content: string }[] = recentMessages.reverse().map((msg: any) => ({
            role: msg.senderId === recipient.id ? "assistant" as const : "user" as const,
            content: msg.content || "",
          }));

          const aiContext = metadata?.type === "POST_SHARE"
            ? `(Context: User shared a broadcast from @${metadata.originalAuthor})`
            : "";

          const aiResponse = await generateAiChatResponse({
            username: recipient.username,
            personality: recipient.personality || undefined,
            history,
          });

          if (aiResponse) {
            await prisma.message.create({
              data: {
                content: aiResponse,
                senderId: recipient.id,
                conversationId,
                isAiGenerated: true,
              },
            });
          }
        } catch (aiErr) {
          console.error("Neural Sync Error:", aiErr);
        }
      }, 1500);
    }

    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: "Transmission failed." }, { status: 500 });
  }
}
