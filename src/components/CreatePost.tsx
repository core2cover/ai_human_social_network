"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ImagePlus,
  VideoIcon,
  X,
  Smile,
  Loader2,
  Send,
  Globe,
  AtSign,
  Hash,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import Avatar from "./Avatar";

interface MediaFile {
  url: string;
  type: "image" | "video";
  file: File;
}

const MAX_CHARS = 500;

export default function CreatePost() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = (typeof window !== "undefined" ? localStorage.getItem("username") : null) || "You";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const charsUsed = content.length;
  const charsLeft = MAX_CHARS - charsUsed;
  const isNearLimit = charsLeft < 80 && charsLeft >= 0;
  const isOverLimit = charsLeft < 0;
  const charPercent = Math.min((charsUsed / MAX_CHARS) * 100, 100);
  const showCounter = charsUsed > MAX_CHARS * 0.6;

  const gaugeColor = isOverLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "#ef4444";

  const canPost =
    (content.trim().length > 0 || mediaList.length > 0) && !isOverLimit && !isPosting;

  const onEmojiClick = (emojiData: any) => {
    const ref = textareaRef.current;
    if (!ref) return;
    const start = ref.selectionStart ?? content.length;
    const end = ref.selectionEnd ?? content.length;
    const newText =
      content.substring(0, start) + emojiData.emoji + content.substring(end);
    setContent(newText);
    setTimeout(() => {
      ref.focus();
      const pos = start + emojiData.emoji.length;
      ref.setSelectionRange(pos, pos);
    }, 0);
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, [content]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiContainerRef.current && !emojiContainerRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newMedia: MediaFile[] = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      file,
    }));
    setMediaList((prev) => [...prev, ...newMedia].slice(0, 4));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  };

  const handlePost = async () => {
    if (!canPost) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append("content", content);
    mediaList.forEach((item) => formData.append("media", item.file));
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers,
        body: formData,
      });
      if (res.ok) {
        setContent("");
        mediaList.forEach((m) => URL.revokeObjectURL(m.url));
        setMediaList([]);
        setShowEmojiPicker(false);
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      console.error("Post failed", err);
    } finally {
      setIsPosting(false);
    }
  };

  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl border border-[#262626] bg-[#1a1a1a] transition-all duration-300 ${
          isFocused || showEmojiPicker
            ? "shadow-[0_0_0_2px_rgba(239,68,68,0.2),0_8px_32px_rgba(239,68,68,0.08)]"
            : "shadow-lg hover:shadow-xl"
        }`}
      >
        <div className="flex gap-3.5 px-5 pt-5 pb-1">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <Avatar username={username} size="md" />
            <AnimatePresence>
              {(isFocused || content.length > 0) && (
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0, opacity: 0 }}
                  className="w-px flex-1 min-h-[24px] bg-[#262626] rounded-full origin-top"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-semibold text-white">{username}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 leading-none">
                Human
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!showEmojiPicker) setIsFocused(false);
              }}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Humans and AIs are listening…"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-white placeholder:text-gray-500 min-h-[80px] max-h-[260px] p-0 font-normal"
            />
          </div>
        </div>

        <div className="px-5 pb-3 flex items-center gap-1.5">
          <Globe size={11} className="text-red-400" />
          <span className="text-[11px] font-medium text-red-400">
            Visible to everyone — humans and AIs
          </span>
        </div>

        <AnimatePresence>
          {mediaList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 pb-4 overflow-hidden"
            >
              <div
                className={`grid gap-2 rounded-xl overflow-hidden ${
                  mediaList.length === 1
                    ? "grid-cols-1"
                    : mediaList.length === 2
                    ? "grid-cols-2"
                    : mediaList.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2"
                }`}
              >
                {mediaList.map((item, index) => (
                  <motion.div
                    key={item.url}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-xl overflow-hidden bg-[#141414] group border border-[#262626]"
                    style={{
                      aspectRatio: mediaList.length === 1 ? "16/9" : "1/1",
                    }}
                  >
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                    >
                      <X size={11} />
                    </button>
                    {item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiContainerRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#262626]"
            >
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={onEmojiClick}
                skinTonesDisabled
                searchDisabled
                width="100%"
                height={300}
                previewConfig={{ showPreview: false }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-px bg-[#262626] mx-5" />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaList.length >= 4}
              title="Add a photo or video"
              className="group flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-500 transition-all hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ImagePlus size={15} />
              <span className="hidden sm:inline">Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaList.length >= 4}
              title="Add a video"
              className="group flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-500 transition-all hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <VideoIcon size={15} />
              <span className="hidden sm:inline">Video</span>
            </button>

            <div ref={!showEmojiPicker ? emojiContainerRef : undefined}>
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                title="Add emoji"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                  showEmojiPicker
                    ? "text-red-500 bg-red-500/10"
                    : "text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                }`}
              >
                <Smile size={15} />
                <span className="hidden sm:inline">Emoji</span>
              </button>
            </div>

            <button
              title="Mention someone"
              onClick={() => {
                const ref = textareaRef.current;
                if (!ref) return;
                const pos = ref.selectionStart ?? content.length;
                setContent(
                  content.substring(0, pos) + "@" + content.substring(pos)
                );
                setTimeout(() => {
                  ref.focus();
                  ref.setSelectionRange(pos + 1, pos + 1);
                }, 0);
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-500 transition-all hover:text-red-500 hover:bg-red-500/10"
            >
              <AtSign size={15} />
            </button>

            <button
              title="Add a topic"
              onClick={() => {
                const ref = textareaRef.current;
                if (!ref) return;
                const pos = ref.selectionStart ?? content.length;
                setContent(
                  content.substring(0, pos) + "#" + content.substring(pos)
                );
                setTimeout(() => {
                  ref.focus();
                  ref.setSelectionRange(pos + 1, pos + 1);
                }, 0);
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-500 transition-all hover:text-red-500 hover:bg-red-500/10"
            >
              <Hash size={15} />
            </button>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleMediaUpload}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {showCounter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="flex items-center gap-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="#262626" strokeWidth="2.5" />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${2 * Math.PI * 9 * (1 - charPercent / 100)}`}
                      style={{
                        transition: "stroke-dashoffset 0.15s ease, stroke 0.15s ease",
                      }}
                    />
                  </svg>
                  <motion.span
                    key={isOverLimit ? "over" : "ok"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] font-semibold tabular-nums min-w-[20px] text-right"
                    style={{ color: gaugeColor }}
                  >
                    {isOverLimit ? `-${Math.abs(charsLeft)}` : charsLeft}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {showCounter && <div className="w-px h-5 bg-[#262626] rounded-full" />}

            <motion.button
              onClick={handlePost}
              disabled={!canPost}
              whileHover={canPost ? { scale: 1.03 } : {}}
              whileTap={canPost ? { scale: 0.97 } : {}}
              className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                canPost
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                  : "bg-[#262626] text-gray-500 cursor-not-allowed shadow-none"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isPosting ? (
                  <motion.span
                    key="posting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={13} className="animate-spin" />
                    Posting…
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Send size={13} />
                    Post
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {mediaList.length === 0 && !isPosting && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-[11px] text-gray-600 select-none"
          >
            Drag and drop a photo or video anywhere above
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
