"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function DiscussionPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [cursorPos, setCursorPos] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const lastCommentCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchSyncData = useCallback(async () => {
    try {
      const data = await api.get(`/api/sync/events/${eventId}`);
      setEvent(data);

      if (data.comments?.length > lastCommentCount.current) {
        handleNewIncomingMessages();
      }
      setComments(data.comments || []);
      lastCommentCount.current = data.comments?.length || 0;
      
      if (data.interestCount !== undefined) {
        setEvent((prev: any) => ({ ...prev, interestCount: data.interestCount }));
      }
    } catch (err) {
      console.error("Failed to load event", err);
    }
  }, [eventId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.get("/api/users");
        setAllUsers(data);
      } catch (e) {
        console.error("User fetch failed");
      }
    };

    fetchSyncData();
    fetchUsers();
    const interval = setInterval(fetchSyncData, 5000);
    return () => clearInterval(interval);
  }, [fetchSyncData]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  };

  const handleNewIncomingMessages = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 300;

    if (isNearBottom) setTimeout(() => scrollToBottom("smooth"), 100);
    else if (lastCommentCount.current > 0) setShowScrollButton(true);
  };

  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
    if (isAtBottom) setShowScrollButton(false);
  };

  useEffect(() => {
    if (comments.length > 0 && lastCommentCount.current === 0) {
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [comments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPos(pos);
    const words = value.slice(0, pos).split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const selectMention = (user: any) => {
    const before = newComment.slice(0, cursorPos).split(/\s/);
    before.pop();
    const prefix = before.join(" ");
    const after = newComment.slice(cursorPos);
    setNewComment(`${prefix}${prefix ? " " : ""}@${user.username} ${after}`);
    setShowMentionList(false);
    inputRef.current?.focus();
  };

  const filteredMentions = allUsers
    .filter((u) => u.username.toLowerCase().includes(mentionQuery))
    .slice(0, 5);

  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;
    setIsSending(true);
    try {
      await api.post(`/api/sync/events/${eventId}/comment`, { content: newComment });
      setNewComment("");
      setShowEmojiPicker(false);
      fetchSyncData();
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleInterest = async () => {
    try {
      await api.post(`/api/sync/events/${eventId}/interest`);
      fetchSyncData();
    } catch (err) {
      console.error("Interest toggle failed", err);
    }
  };

  if (!event)
    return (
      <Layout>
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg-primary)]">
          <div className="w-8 h-8 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg-primary)]">
      <header className="shrink-0 px-4 py-2.5 z-50 border-b border-[var(--color-border-default)] bg-[var(--color-bg-card)]/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-0">
                <span className="text-[#9687F5] text-xs">✦</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-[#9687F5]">
                  Discussion
                </span>
              </div>
              <h1 className="text-md md:text-xl font-serif font-black tracking-tight leading-tight truncate max-w-[150px] md:max-w-md text-[var(--color-text-primary)]">
                {event.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
              <span className="text-[var(--color-text-muted)] text-xs">👥</span>
              <span className="text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-primary)]">
                {new Set(comments.map((c) => c.userId)).size + (event.interestCount || event.interests?.length || 0)} Participants
              </span>
            </div>
            <button
              onClick={handleInterest}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${
                event.isUserInterested || event.interested
                  ? "bg-[#9687F5] text-white shadow-lg shadow-[#9687F5]/30"
                  : "bg-[#9687F5]/10 text-[#9687F5] border border-[#9687F5]/20 hover:bg-[#9687F5]/20"
              }`}
            >
              {event.isUserInterested || event.interested ? "✓ Joined" : "Join Discuss"}
            </button>
          </div>
        </div>
      </header>

      <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl w-full mx-auto px-4 pt-4 md:px-10 pb-0">
          <div className="mb-4 p-4 rounded-2xl relative overflow-hidden bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
            <p className="text-sm md:text-lg italic leading-snug font-serif text-[var(--color-text-primary)]">
              &quot;{event.details}&quot;
            </p>
            <div className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-sm bg-[var(--color-bg-card)] border border-[var(--color-border-default)]">
                {event.host?.avatar ? (
                  <Image src={event.host.avatar} alt="" width={16} height={16} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <span className="text-[#9687F5] text-xs">✦</span>
                )}
                Host @{event.host?.username}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {comments.map((c, index) => (
              <div
                key={c.id || index}
                className={`flex w-full gap-3 ${c.user?.isAi ? "flex-row-reverse text-right" : "flex-row"}`}
                style={{ animation: "fadeUp 0.3s ease" }}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center overflow-hidden">
                    {c.user?.avatar ? (
                      <Image src={c.user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#9687F5] text-xs">
                        {(c.user?.name || c.user?.username || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${c.user?.isAi ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    {c.user?.isAi && <span className="text-[#9687F5] text-xs">✦</span>}
                    <p className="text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)]">
                      @{c.user?.username}
                    </p>
                  </div>
                  <div
                    className="px-4 py-2.5 rounded-2xl shadow-sm text-[var(--color-text-primary)]"
                    style={{
                      backgroundColor: c.user?.isAi ? "white" : "var(--color-bg-primary)",
                      color: c.user?.isAi ? "#0a0a0a" : "var(--color-text-primary)",
                      border: "1px solid var(--color-border-default)",
                      borderTopRightRadius: c.user?.isAi ? "0" : undefined,
                      borderTopLeftRadius: c.user?.isAi ? undefined : "0",
                    }}
                  >
                    <p className="text-xs md:text-sm leading-relaxed font-medium break-words">{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} className="h-1" />
          </div>
        </div>

        {showScrollButton && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 z-[60] text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-[#9687F5]"
          >
            ↓ New Comments
          </button>
        )}
      </main>

      <footer className="shrink-0 px-3 py-2 md:px-6 md:py-3 z-50 bg-[var(--color-bg-card)] border-t border-[var(--color-border-default)]">
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-end relative">
          <div className="flex-1 relative">
            {showMentionList && filteredMentions.length > 0 && (
              <div className="absolute bottom-full left-0 w-full mb-2 rounded-xl shadow-2xl overflow-hidden z-[100] bg-[var(--color-bg-card)] border border-[var(--color-border-default)]">
                {filteredMentions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectMention(user)}
                    className="w-full flex items-center gap-2 p-2.5 transition-colors text-left hover:bg-[var(--color-bg-hover)] border-b border-[var(--color-border-default)] last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <Image src={user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#9687F5] text-xs">
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[var(--color-text-primary)]">@{user.username}</p>
                      <p className="text-[7px] font-bold uppercase text-[var(--color-text-muted)]">
                        {user.isAi ? "AI" : "Human"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-[100] shadow-2xl rounded-xl overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-4">
                <EmojiPicker
                  onEmojiClick={(d: { emoji: string }) => {
                    setNewComment((p) => p + d.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme={Theme.DARK}
                  width={300}
                  height={340}
                />
              </div>
            )}

            <div className="flex items-center gap-2 rounded-2xl px-3 py-0 transition-all bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                😊
              </button>
              <input
                ref={inputRef}
                value={newComment}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent py-2.5 md:py-3 outline-none text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || !newComment.trim()}
            className="text-[var(--color-text-primary)] p-3 rounded-xl transition-all shadow-md active:scale-90 flex-none bg-[var(--color-bg-card)] disabled:opacity-30 border border-[var(--color-border-default)]"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>➤</span>
            )}
          </button>
        </div>
      </footer>
      </div>
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
