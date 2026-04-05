"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import { Cpu } from "lucide-react";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const myUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const router = useRouter();

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) {
      router.push("/login");
      return;
    }
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [router]);

  async function loadConversations() {
    try {
      const data = await api.get("/api/chat/conversations");
      if (!data || data.error === "Unauthorized") {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        router.push("/login");
        return;
      }
      const sortedData = data.sort((a: any, b: any) => {
        const timeA = new Date(a.messages[a.messages.length - 1]?.createdAt || a.updatedAt).getTime();
        const timeB = new Date(b.messages[b.messages.length - 1]?.createdAt || b.updatedAt).getTime();
        return timeB - timeA;
      });
      setConversations(sortedData);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenConversation = async (convId: string) => {
    try {
      await api.put(`/api/chat/conversations/${convId}/read`);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            const updatedMessages = [...c.messages];
            if (updatedMessages.length > 0) {
              updatedMessages[updatedMessages.length - 1].read = true;
            }
            return { ...c, messages: updatedMessages };
          }
          return c;
        })
      );
    } catch (err) {}
    router.push(`/chat/${convId}`);
  };

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] font-bold text-[var(--color-text-muted)]">
            Loading Messages...
          </span>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto py-12 px-4 md:px-6 pb-32 box-border overflow-x-hidden">
      <div className="flex items-center gap-6 mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight italic shrink-0 text-[var(--color-text-primary)]">
          Messages
        </h1>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border-default)] to-transparent" />
      </div>

      <div className="space-y-4">
        {conversations.length > 0 ? (
          conversations.map((conv) => {
            const otherUser = conv.participants.find((p: any) => p.username !== myUsername);
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isUnread = lastMsg && lastMsg.sender?.username !== myUsername && !lastMsg.read;

            return (
              <div
                key={conv.id}
                onClick={() => handleOpenConversation(conv.id)}
                className="w-full box-border p-4 md:p-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6 cursor-pointer transition-all relative overflow-hidden bg-[var(--color-bg-card)] border rounded-2xl hover:border-[#9687F5]/20"
                style={
                  isUnread
                    ? {
                        backgroundColor: "rgba(150,135,245,0.03)",
                        borderLeft: "4px solid #9687F5",
                        boxShadow: "0 10px 25px -10px rgba(150,135,245,0.2)",
                      }
                    : { borderLeft: "4px solid transparent" }
                }
              >
                <div className="relative flex-none">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden border">
                    {otherUser?.avatar ? (
                      <Image
                        src={otherUser.avatar}
                        alt={otherUser.name || otherUser.username}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#9687F5] text-lg">
                        {(otherUser?.name || otherUser?.username || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {otherUser?.isAi && (
                    <div className="absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-md z-30 bg-[var(--color-bg-card)] border border-[var(--color-border-default)]">
                      <Cpu size={12} className="text-[#9687F5]" />
                    </div>
                  )}
                  {isUnread && (
                    <div
                      className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-[#9687F5] rounded-full z-30"
                      style={{
                        border: `2px solid var(--color-bg-card)`,
                        boxShadow: "0 0 8px #9687F5",
                      }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className="font-serif font-bold text-sm md:text-base tracking-tight truncate"
                      style={{ color: isUnread ? "#9687F5" : "var(--color-text-primary)" }}
                    >
                      {otherUser?.name || otherUser?.username}
                    </h3>
                    <span
                      className="text-[9px] font-mono font-bold shrink-0"
                      style={{ color: isUnread ? "#9687F5" : "var(--color-text-muted)" }}
                    >
                      {lastMsg
                        ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p
                    className="text-[11px] md:text-sm truncate leading-tight"
                    style={{
                      color: isUnread ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      fontWeight: isUnread ? 600 : 400,
                    }}
                  >
                    {lastMsg ? lastMsg.content : "No messages yet..."}
                  </p>
                </div>

                <div className="flex items-center justify-center w-8 shrink-0">
                  {isUnread ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[#9687F5] text-sm">⚡</span>
                      <span className="text-[6px] font-black text-[#9687F5] uppercase mt-1 tracking-tighter">
                        New
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-muted)] opacity-20 text-lg">›</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border-default)] rounded-3xl">
            <p className="uppercase tracking-[0.4em] text-[10px] font-black italic text-[var(--color-text-muted)] opacity-20">
              No Messages Yet
            </p>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
