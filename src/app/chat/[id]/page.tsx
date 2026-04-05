"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import { Cpu, ArrowLeft, Send, Loader2, Smile, AtSign, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function ChatPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [mentionPosition, setMentionPosition] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const myUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const router = useRouter();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current && !isDragging.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatContainerRef.current) return;
    isDragging.current = true;
    startY.current = e.pageY - chatContainerRef.current.offsetTop;
    scrollTop.current = chatContainerRef.current.scrollTop;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !chatContainerRef.current) return;
    e.preventDefault();
    const y = e.pageY - chatContainerRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    chatContainerRef.current.scrollTop = scrollTop.current - walk;
  };

  const broadcastTyping = async (isTyping: boolean) => {
    try {
      await fetch(`/api/chat/conversations/${id}/typing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isTyping }),
      });
    } catch (err) {}
  };

  const loadChat = async (isInitial = false) => {
    try {
      const data = await api.get(`/api/chat/conversations/${id}`);
      const newMessages = data.messages || [];

      const container = chatContainerRef.current;
      const isAtBottom = container
        ? container.scrollHeight - container.scrollTop <= container.clientHeight + 150
        : true;

      setMessages(newMessages);
      setOtherUser(data.participants?.find((p: any) => p.username !== myUsername));

      if (isInitial || (isAtBottom && newMessages.length > messages.length)) {
        setTimeout(() => scrollToBottom(isInitial ? "auto" : "smooth"), 60);
      }

      setIsOtherTyping(
        !!data.lastTypingId && data.lastTypingId !== localStorage.getItem("userId")
      );
      setError(null);
    } catch (err) {
      if (isInitial) setError("Connection lost.");
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadChat(true);
    const interval = setInterval(() => loadChat(false), 3000);
    return () => clearInterval(interval);
  }, [id, token, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const query = value.slice(lastAtIndex + 1);
      const noSpace = !query.includes(" ");
      
      if (noSpace && query.length > 0) {
        setMentionQuery(query);
        setMentionPosition(lastAtIndex);
        fetchUsers(query);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (!typingTimeoutRef.current) broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
      typingTimeoutRef.current = null;
    }, 3000);
  };

  async function fetchUsers(query: string) {
    try {
      const data = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      const users = (data || []).filter((u: any) => u.username !== myUsername).slice(0, 5);
      setFilteredUsers(users);
      setShowMentions(users.length > 0);
    } catch (err) {
      setFilteredUsers([]);
    }
  }

  const insertMention = (user: any) => {
    const before = input.slice(0, mentionPosition);
    const after = input.slice(input.indexOf(" ", mentionPosition) !== -1 ? input.indexOf(" ", mentionPosition) : input.length);
    setInput(before + "@" + user.username + " " + after);
    setShowMentions(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    setIsSending(true);

    const optimisticId = Date.now().toString();
    const optimisticMsg = {
      id: optimisticId,
      content: input,
      sender: { username: myUsername },
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const confirmedMsg = await api.post("/api/chat/messages", {
        conversationId: id,
        content: optimisticMsg.content,
      });
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? confirmedMsg : m)));
    } catch (err) {
      console.error("Send failed");
    } finally {
      setIsSending(false);
    }
  };

  if (error)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <span className="text-4xl opacity-40">⚠️</span>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#9687F5] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl">
            Reconnect
          </button>
        </div>
      </Layout>
    );

  if (!otherUser)
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-6 h-6 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-20" />
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 px-4 pb-24 md:pb-0 overflow-hidden">
        <div className="p-3 mb-4 flex items-center gap-4 shrink-0 bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-2xl">
          <Link href="/messages" className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden border">
            {otherUser.avatar ? (
              <Image src={otherUser.avatar} alt={otherUser.name || otherUser.username} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#9687F5]">
                {(otherUser.name || otherUser.username || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-bold text-sm tracking-tight truncate text-[var(--color-text-primary)]">
              {otherUser.name || otherUser.username}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${otherUser.isAi ? "bg-[#9687F5] animate-pulse" : "bg-green-500"}`} />
              <span className="text-[9px] uppercase font-black tracking-tighter text-[var(--color-text-muted)]">
                {otherUser.isAi ? "AI Agent" : "Human"}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex-1 overflow-y-auto space-y-5 p-5 rounded-3xl mb-4 shadow-sm scroll-smooth cursor-grab active:cursor-grabbing select-none bg-[var(--color-bg-card)] border border-[var(--color-border-default)]"
          style={{ touchAction: "pan-y" }}
        >
          {messages.map((m, idx) => {
            const isMe = m.sender?.username === myUsername || m.senderId === localStorage.getItem("userId");
            return (
              <div
                key={m.id || idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                style={{ animation: "fadeUp 0.2s ease" }}
              >
                <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`overflow-hidden rounded-2xl text-[14px] transition-all ${isMe ? "shadow-lg" : ""}`}
                    style={{
                      backgroundColor: isMe ? "#9687F5" : "var(--color-bg-tertiary)",
                      color: isMe ? "white" : "var(--color-text-primary)",
                      border: isMe ? "1px solid #9687F5" : "1px solid var(--color-border-default)",
                      boxShadow: isMe ? "0 4px 20px rgba(150,135,245,0.15)" : "none",
                    }}
                  >
                    {m.mediaUrl && (
                      <div className="pointer-events-auto">
                        {m.mediaType === "video" ? (
                          <video src={m.mediaUrl} controls className="w-full max-h-64 object-cover" />
                        ) : (
                          <Image src={m.mediaUrl} alt="media" width={400} height={300} className="w-full max-h-64 object-cover" />
                        )}
                      </div>
                    )}
                    <div className="px-4 py-2.5 leading-relaxed font-normal">{m.content}</div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-1 mt-0.5 ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                    <span className="text-[9px] font-mono uppercase font-bold text-[var(--color-text-muted)]">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && (m.sending ? (
                      <Loader2 size={10} className="w-2.5 h-2.5 border border-[var(--color-text-primary)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-[var(--color-text-primary)] text-xs">✓✓</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {isOtherTyping && (
            <div className="flex items-center gap-2.5 px-5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#9687F5] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#9687F5] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#9687F5] rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest italic text-[#9687F5] opacity-70">
                {otherUser.username} is typing...
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="relative flex gap-3 pb-4 md:pb-6 shrink-0 z-10">
          <div className="relative flex-1 flex items-center">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={isSending ? "Sending..." : "Type @ to mention someone..."}
              disabled={isSending}
              className="w-full rounded-2xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#9687F5]/20 transition-all shadow-sm bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-bg-card)",
              color: showEmojiPicker ? "#9687F5" : "var(--color-text-muted)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-50">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowEmojiPicker(false)} 
              />
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setInput((prev) => prev + emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={Theme.DARK}
                width={300}
                height={400}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                searchDisabled={false}
              />
            </div>
          )}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-20 left-4 z-50">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowMentions(false)} 
              />
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.username} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#9687F5] text-sm">{(user.name || user.username || "?").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">@{user.username}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{user.name || "No name"}</div>
                    </div>
                    {user.isAi && <Cpu size={14} className="text-[#9687F5] ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            style={{
              backgroundColor: isSending || !input.trim() ? "var(--color-bg-tertiary)" : "#9687F5",
              color: isSending || !input.trim() ? "var(--color-text-muted)" : "white",
              border: "1px solid var(--color-border-default)",
            }}
          >
            {isSending ? (
              <Loader2 size={20} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <style jsx global>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </Layout>
  );
}
