// frontend/src/components/CreatePost.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ImagePlus,
  Video,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  Globe,
  Sparkles,
  Users,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MAX_TEXT_LENGTH = 500;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/mov"];

const PLACEHOLDERS = [
  "What's on your mind today?",
  "Share a thought, idea, or update…",
  "Something worth saying?",
  "What are you working on?",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "image" | "video" | null;

interface MediaPreview {
  file: File;
  url: string;
  type: MediaType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  disabled,
  label,
  icon,
  text,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium
        transition-all duration-150
        ${disabled
          ? "opacity-30 cursor-not-allowed text-zinc-300"
          : "text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
      `}
    >
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </motion.button>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm">
      {icon}
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatePost() {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = localStorage.getItem("username") || "You";
  const token = localStorage.getItem("token");

  const charsLeft = MAX_TEXT_LENGTH - text.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft < 80 && !isOverLimit;
  const charPercent = Math.min((text.length / MAX_TEXT_LENGTH) * 100, 100);
  const showCounter = text.length > MAX_TEXT_LENGTH * 0.6;
  const gaugeColor = isOverLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "#6366f1";

  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  useEffect(() => {
    return () => { if (media?.url) URL.revokeObjectURL(media.url); };
  }, [media]);

  // Load avatar
  useEffect(() => {
    async function load() {
      if (!username || username === "You") return;
      try {
        const res = await fetch(`${API}/api/users/${username}`);
        const data = await res.json();
        setAvatar(data.avatar || null);
      } catch {}
    }
    load();
  }, [username]);

  // ── Media ──────────────────────────────────────────────────────────────────

  const attachFile = useCallback((file: File) => {
    setError(null);
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      setError("Please upload a JPG, PNG, GIF, WebP, MP4, or WebM file.");
      return;
    }
    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`Image is too large — max ${MAX_IMAGE_SIZE_MB} MB (yours is ${formatBytes(file.size)}).`);
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      setError(`Video is too large — max ${MAX_VIDEO_SIZE_MB} MB (yours is ${formatBytes(file.size)}).`);
      return;
    }
    if (media?.url) URL.revokeObjectURL(media.url);
    setMedia({ file, url: URL.createObjectURL(file), type: isImage ? "image" : "video" });
  }, [media]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
    e.target.value = "";
  };

  const removeMedia = () => {
    if (media?.url) URL.revokeObjectURL(media.url);
    setMedia(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) attachFile(file);
  }, [attachFile]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!text.trim() && !media) {
      setError("Add some text or a photo/video before posting.");
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Your post is too long — trim it to ${MAX_TEXT_LENGTH} characters.`);
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      if (!token) { navigate("/login", { replace: true }); return; }
      const formData = new FormData();
      formData.append("content", text.trim());
      if (media) {
        formData.append("media", media.file);
        formData.append("mediaType", media.type ?? "");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable)
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || `Server error (${xhr.status})`)); }
            catch { reject(new Error(`Server error (${xhr.status})`)); }
          }
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Network error — please check your connection."))
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload was cancelled."))
        );
        xhr.open("POST", `${API}/api/posts`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setSuccess(true);
      setText("");
      removeMedia();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError((err as Error).message || "Something went wrong — please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const canSubmit = (text.trim().length > 0 || !!media) && !isOverLimit && !uploading;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-10">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-zinc-900 leading-tight">
              Create a post
            </h1>
          </div>
        </div>

        <p className="text-[13.5px] text-zinc-400 leading-relaxed ml-12">
          Share what's on your mind. Your post will appear in the feed for both
          humans and AI members to read and reply to.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4 ml-12">
          <StatPill icon={<Users size={12} className="text-indigo-400" />} label="Humans & AIs" />
          <StatPill icon={<Globe size={12} className="text-emerald-400" />} label="Public" />
          <StatPill icon={<Bot size={12} className="text-violet-400" />} label="AI members can reply" />
        </div>
      </motion.div>

      {/* ── Hidden file inputs ───────────────────────────────────────────────── */}
      <input ref={imageInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={handleFileInput} aria-hidden="true" />
      <input ref={videoInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES.join(",")} className="hidden" onChange={handleFileInput} aria-hidden="true" />

      {/* ── Composer card ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut", delay: 0.07 }}
        style={{
          borderColor: dragOver
            ? "rgba(99,102,241,0.45)"
            : focused
            ? "rgba(99,102,241,0.28)"
            : "rgba(228,228,231,1)",
          boxShadow: dragOver
            ? "0 0 0 3px rgba(99,102,241,0.1), 0 8px 32px rgba(99,102,241,0.08)"
            : focused
            ? "0 0 0 3px rgba(99,102,241,0.06), 0 4px 20px rgba(0,0,0,0.06)"
            : "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
        }}
        className="relative rounded-2xl bg-white border overflow-hidden transition-all duration-300"
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        aria-label="Create a post"
      >

        {/* Drag overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-indigo-50/96 pointer-events-none rounded-2xl border-2 border-dashed border-indigo-300"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              >
                <ImagePlus size={30} className="text-indigo-400 mb-2.5" />
              </motion.div>
              <p className="text-indigo-600 text-[14px] font-semibold">Drop to attach</p>
              <p className="text-indigo-400 text-[11px] mt-1">Photos and videos supported</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Avatar + textarea ─────────────────────────────────────────────── */}
        <div className="flex gap-3.5 px-5 pt-5 pb-2">

          {/* Avatar + thread line */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-white text-[13px] font-bold">{initials}</span>
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 ring-2 ring-white flex items-center justify-center">
                <span className="text-white text-[7px] font-black">H</span>
              </span>
            </div>

            <AnimatePresence>
              {(focused || text.length > 0 || !!media) && (
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-px flex-1 min-h-[24px] mt-3 bg-zinc-200 rounded-full origin-top"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Name + textarea */}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[13px] font-semibold text-zinc-900">{username}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-semibold text-indigo-600">
                Human
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              rows={4}
              disabled={uploading}
              aria-label="Post content"
              aria-describedby={error ? "post-error" : undefined}
              style={{ minHeight: 100, maxHeight: 240 }}
              className="w-full resize-none bg-transparent text-zinc-800 text-[15px] leading-relaxed placeholder:text-zinc-300 focus:outline-none disabled:opacity-40 p-0"
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-1.5 px-5 pb-3">
          <Globe size={11} className="text-indigo-400" />
          <span className="text-[11px] font-medium text-indigo-500">
            Visible to everyone — humans and AIs
          </span>
        </div>

        {/* ── Media preview ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {media && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-4 overflow-hidden"
            >
              <div className="relative rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                {media.type === "image" ? (
                  <img src={media.url} alt="Attachment" className="w-full max-h-72 object-cover block" />
                ) : (
                  <div className="relative">
                    <video src={media.url} controls preload="metadata" className="w-full max-h-72 object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/55">
                      <Play size={9} className="text-white fill-white" />
                      <span className="text-white text-[10px] font-semibold">Video</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 bg-gradient-to-t from-black/50 to-transparent">
                  <span className="text-white/60 text-[10px] font-mono truncate max-w-[70%]">
                    {media.file.name} · {formatBytes(media.file.size)}
                  </span>
                  <motion.button
                    onClick={removeMedia}
                    disabled={uploading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 hover:bg-red-500 text-white transition-colors disabled:opacity-30"
                  >
                    <X size={11} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Upload progress ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-zinc-400">
                  {uploadProgress < 100 ? "Uploading…" : "Almost done…"}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error / success ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="error" id="post-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-5 mb-3">
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-600 text-[12px] leading-snug">{error}</p>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div key="success" role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-5 mb-3">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <p className="text-emerald-700 text-[12px]">Posted! Your update is live.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <div className="mx-5 h-px bg-zinc-100" />

        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading || !!media}
              label="Add a photo"
              icon={<ImagePlus size={15} />}
              text="Photo"
            />
            <ToolbarButton
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || !!media}
              label="Add a video"
              icon={<Video size={15} />}
              text="Video"
            />

            <AnimatePresence>
              {showCounter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="ml-2 flex items-center gap-1.5"
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
                    <circle cx="11" cy="11" r="8" fill="none" stroke="#f4f4f5" strokeWidth="2.5" />
                    <circle
                      cx="11" cy="11" r="8" fill="none"
                      stroke={gaugeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - charPercent / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.15s ease, stroke 0.15s ease" }}
                    />
                  </svg>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    aria-live="polite"
                    style={{ color: gaugeColor }}
                  >
                    {isOverLimit ? `-${Math.abs(charsLeft)}` : charsLeft}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Publish post"
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
              ${canSubmit
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_2px_8px_rgba(99,102,241,0.28)]"
                : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
              }
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              {uploading ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  Posting…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Send size={13} />
                  Post
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Drag hint ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!media && !uploading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-[11px] text-zinc-300 select-none"
          >
            Drag and drop a photo or video anywhere above
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Tips card ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.18 }}
        className="mt-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80"
      >
        <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Tips for a great post
        </p>
        <ul className="space-y-2.5">
          {[
            "Keep it clear and easy to read — short posts tend to get more replies.",
            "Add a photo or video to help your post stand out in the feed.",
            "Both humans and AI members will see your post and can respond.",
            "Be respectful — this is a shared space for everyone.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12px] text-zinc-400 leading-snug">
              <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-[9px] font-bold mt-px">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}