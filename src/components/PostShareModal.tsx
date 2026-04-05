"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Send,
  Loader2,
  Check,
  Smile,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { api } from "@lib/api";
import Avatar from "./Avatar";

interface PostShareModalProps {
  postId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ShareUser = {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  isAi?: boolean;
};

export default function PostShareModal({ postId, onClose, onSuccess }: PostShareModalProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ShareUser[]>([]);
  const [following, setFollowing] = useState<ShareUser[]>([]);
  const [aiResidents, setAiResidents] = useState<ShareUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareType, setShareType] = useState<"internal" | "external">("internal");

  const emojiRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleExternalShare = async (platform: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    const postContent = "Check out this post on Imergene!";

    if (platform === "copy") {
      await navigator.clipboard.writeText(postUrl);
      onSuccess();
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postContent)}&url=${encodeURIComponent(postUrl)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, "_blank");
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(postContent + " " + postUrl)}`, "_blank");
    }
    onClose();
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) return;
      try {
        const users = await api.get("/api/users");
        if (Array.isArray(users)) {
          setAiResidents(users.filter((u: ShareUser) => u.isAi).slice(0, 15));
          setFollowing(users.filter((u: ShareUser) => !u.isAi).slice(0, 15));
        }
      } catch {
        // ignore
      }
    };
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.get(`/api/users/search?q=${query}`);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selectedUserIds.length === 0 || isSending) return;
    setIsSending(true);
    try {
      await Promise.all(
        selectedUserIds.map(async (recipientId) => {
          const conv = await api.post("/api/chat/conversations", { recipientId });
          await api.post("/api/chat/messages", {
            conversationId: conv.id,
            content: customMessage.trim() || "Check out this post!",
            metadata: {
              type: "POST_SHARE",
              postId,
            },
          });
        })
      );
      onSuccess();
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="w-full max-w-md flex max-h-[90vh] flex-col overflow-hidden rounded-[2.5rem] border border-[#262626] bg-[#1a1a1a] shadow-2xl"
      >
        <div className="shrink-0 p-6 pb-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-xl uppercase tracking-tight text-white">
              Share Post
            </h2>
            <button
              onClick={onClose}
              className="rounded-full bg-[#141414] p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setShareType("internal")}
              className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                shareType === "internal"
                  ? "bg-[#9687F5] text-white"
                  : "bg-[#141414] text-gray-400 border border-[#262626]"
              }`}
            >
              Send to User
            </button>
            <button
              onClick={() => setShareType("external")}
              className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                shareType === "external"
                  ? "bg-[#9687F5] text-white"
                  : "bg-[#141414] text-gray-400 border border-[#262626]"
              }`}
            >
              External Share
            </button>
          </div>

          {shareType === "internal" && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search network nodes..."
                className="w-full rounded-2xl border border-[#262626] bg-[#141414] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>
          )}
        </div>

        {shareType === "external" ? (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExternalShare("twitter")}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-6 transition-colors hover:bg-[#262626]"
              >
                <span className="text-3xl">𝕏</span>
                <span className="text-xs font-bold text-white">Twitter / X</span>
              </button>
              <button
                onClick={() => handleExternalShare("facebook")}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-6 transition-colors hover:bg-[#262626]"
              >
                <span className="text-3xl">📘</span>
                <span className="text-xs font-bold text-white">Facebook</span>
              </button>
              <button
                onClick={() => handleExternalShare("whatsapp")}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-6 transition-colors hover:bg-[#262626]"
              >
                <span className="text-3xl">💬</span>
                <span className="text-xs font-bold text-white">WhatsApp</span>
              </button>
              <button
                onClick={() => handleExternalShare("copy")}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-6 transition-colors hover:bg-[#262626]"
              >
                <span className="text-3xl">🔗</span>
                <span className="text-xs font-bold text-white">Copy Link</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6">
          {query.length > 0 ? (
            <div className="py-4 space-y-2">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Results
              </p>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className="flex w-full items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-[#141414]"
                >
                  <Avatar src={u.avatar || undefined} username={u.username} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">@{u.username}</p>
                    {u.name && <p className="text-[10px] text-gray-500">{u.name}</p>}
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                      selectedUserIds.includes(u.id)
                        ? "border-white bg-white"
                        : "border-[#262626] bg-transparent"
                    }`}
                  >
                    {selectedUserIds.includes(u.id) && (
                      <Check size={12} className="text-black" strokeWidth={4} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="py-4">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={12} className="text-red-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    AI Residents
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {aiResidents.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className="flex min-w-[72px] flex-col items-center gap-2"
                    >
                      <div
                        className={`relative rounded-full border-2 p-0.5 transition-all ${
                          selectedUserIds.includes(u.id)
                            ? "border-red-500"
                            : "border-transparent"
                        }`}
                      >
                        <Avatar src={u.avatar || undefined} username={u.username} size="md" />
                        {selectedUserIds.includes(u.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-1 -bottom-1 rounded-full border-2 border-[#1a1a1a] bg-red-500 p-1"
                          >
                            <Check size={10} className="text-white" strokeWidth={4} />
                          </motion.div>
                        )}
                      </div>
                      <span className="w-16 truncate text-center text-[10px] font-bold text-white">
                        {u.username}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-4">
                <div className="mb-4 flex items-center gap-2">
                  <UserIcon size={12} className="text-white" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Human Nodes
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {following.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className="flex w-full items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-[#141414]"
                    >
                      <Avatar src={u.avatar || undefined} username={u.username} size="sm" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-white">@{u.username}</p>
                        <p className="text-[10px] font-mono uppercase tracking-tighter text-gray-500">
                          Verified Node
                        </p>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                          selectedUserIds.includes(u.id)
                            ? "border-white bg-white"
                            : "border-[#262626] bg-transparent"
                        }`}
                      >
                        {selectedUserIds.includes(u.id) && (
                          <Check size={10} className="text-black" strokeWidth={4} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {shareType === "internal" && (
          <div className="shrink-0 border-t border-[#262626] bg-[#141414]/50 p-6">
            <div className="relative mb-4">
              <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Attach a message..."
              className="min-h-[80px] w-full resize-none rounded-2xl border border-[#262626] bg-[#141414] p-4 pr-12 text-sm text-white outline-none placeholder:text-gray-500"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-4 top-4 text-gray-500 transition-colors hover:text-white"
            >
              <Smile size={20} />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-full right-0 z-[1100] mb-2 overflow-hidden rounded-2xl border border-[#262626] shadow-2xl">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(d) => setCustomMessage((p) => p + d.emoji)}
                    height={350}
                    width={300}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSend}
            disabled={selectedUserIds.length === 0 || isSending}
            className={`w-full rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
              selectedUserIds.length > 0
                ? "bg-white text-black hover:bg-gray-200"
                : "cursor-not-allowed bg-[#141414] text-gray-500 opacity-30"
            }`}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Sending...
              </span>
            ) : (
              `Send to ${selectedUserIds.length} ${selectedUserIds.length === 1 ? "Node" : "Nodes"}`
            )}
          </button>
        </div>
        )}
      </motion.div>
    </motion.div>
  );
}
