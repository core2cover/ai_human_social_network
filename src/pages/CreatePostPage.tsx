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
  Sparkles,
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-semibold tracking-wide
        transition-all duration-150
        ${disabled
          ? "opacity-30 cursor-not-allowed text-zinc-400"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50
      `}
    >
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </motion.button>
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
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (media?.url) URL.revokeObjectURL(media.url);
    };
  }, [media]);

  // ── Media validation & attachment ─────────────────────────────────────────

  const attachFile = useCallback(
    (file: File) => {
      setError(null);
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        setError("Unsupported file type. Please upload a JPG, PNG, GIF, WebP, MP4, or WebM.");
        return;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`Image must be under ${MAX_IMAGE_SIZE_MB} MB. Yours is ${formatBytes(file.size)}.`);
        return;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
        setError(`Video must be under ${MAX_VIDEO_SIZE_MB} MB. Yours is ${formatBytes(file.size)}.`);
        return;
      }

      if (media?.url) URL.revokeObjectURL(media.url);

      setMedia({
        file,
        url: URL.createObjectURL(file),
        type: isImage ? "image" : "video",
      });
    },
    [media]
  );

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

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) attachFile(file);
    },
    [attachFile]
  );

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!text.trim() && !media) {
      setError("Add some text or a photo/video before posting.");
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Post too long — trim it down to ${MAX_TEXT_LENGTH} characters.`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const formData = new FormData();
      formData.append("content", text.trim());
      if (media) {
        formData.append("media", media.file);
        formData.append("mediaType", media.type ?? "");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error || `Server error (${xhr.status})`));
            } catch {
              reject(new Error(`Server error (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Network error. Please check your connection."))
        );
        xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));

        xhr.open("POST", `${API}/api/posts`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setSuccess(true);
      setText("");
      removeMedia();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const charsLeft = MAX_TEXT_LENGTH - text.length;
  const isOverLimit = charsLeft < 0;
  const nearLimit = charsLeft < 80 && !isOverLimit;
  const canSubmit = (text.trim().length > 0 || !!media) && !isOverLimit && !uploading;

  // Gauge: 0–1
  const charRatio = Math.min(text.length / MAX_TEXT_LENGTH, 1);
  const gaugeColor = isOverLimit
    ? "#ef4444"
    : nearLimit
    ? "#f59e0b"
    : "#a78bfa";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full font-sans">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={handleFileInput}
        aria-hidden="true"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={handleFileInput}
        aria-hidden="true"
      />

      {/* ── Card shell ──────────────────────────────────────────────────── */}
      <motion.div
        animate={{
          boxShadow: dragOver
            ? "0 0 0 2px #a78bfa, 0 8px 40px rgba(167,139,250,0.15)"
            : focused
            ? "0 0 0 1.5px rgba(167,139,250,0.5), 0 4px 24px rgba(0,0,0,0.06)"
            : "0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden"
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
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-violet-50/90 dark:bg-violet-950/80 backdrop-blur-sm pointer-events-none rounded-2xl"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <ImagePlus size={32} className="text-violet-500 mb-3" />
              </motion.div>
              <p className="text-violet-600 dark:text-violet-300 text-sm font-semibold tracking-wide">
                Drop to attach
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Text area ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={3}
            disabled={uploading}
            aria-label="Post content"
            aria-describedby={error ? "post-error" : undefined}
            style={{ minHeight: 72, maxHeight: 240 }}
            className="w-full resize-none bg-transparent text-zinc-800 dark:text-zinc-100 text-[15px] leading-relaxed placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* ── Media preview ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {media && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-3"
            >
              <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {media.type === "image" ? (
                  <img
                    src={media.url}
                    alt="Attachment preview"
                    className="w-full max-h-64 object-cover"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={media.url}
                      controls
                      preload="metadata"
                      className="w-full max-h-64 object-cover"
                      aria-label="Video attachment"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                      <Play size={9} className="text-white fill-white" />
                      <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                        Video
                      </span>
                    </div>
                  </div>
                )}

                {/* Overlay strip */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white/60 text-[10px] font-mono truncate max-w-[75%]">
                    {media.file.name} · {formatBytes(media.file.size)}
                  </span>
                  <motion.button
                    onClick={removeMedia}
                    disabled={uploading}
                    aria-label="Remove attachment"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-red-500/80 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40"
                  >
                    <X size={11} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Upload progress ────────────────────────────────────────────── */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pb-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  {uploadProgress < 100 ? "Uploading" : "Finishing up"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-violet-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error / success ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              id="post-error"
              role="alert"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 mb-3 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
                <AlertCircle
                  size={14}
                  className="text-red-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-red-600 dark:text-red-400 text-[12px] leading-snug">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              role="status"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 mb-3 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-emerald-700 dark:text-emerald-400 text-[12px]">
                  Posted! Your update is live.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: attach + char counter */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading || !!media}
              label="Add a photo"
              icon={<ImagePlus size={15} aria-hidden="true" />}
              text="Photo"
            />
            <ToolbarButton
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || !!media}
              label="Add a video"
              icon={<Video size={15} aria-hidden="true" />}
              text="Video"
            />

            {/* Character gauge — appears when 70% full */}
            <AnimatePresence>
              {text.length > MAX_TEXT_LENGTH * 0.7 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="ml-2 flex items-center gap-2"
                >
                  {/* Ring gauge */}
                  <svg width="22" height="22" viewBox="0 0 22 22" className="shrink-0 -rotate-90">
                    <circle
                      cx="11" cy="11" r="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    <circle
                      cx="11" cy="11" r="8"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - charRatio)}`}
                      style={{ transition: "stroke-dashoffset 0.2s ease, stroke 0.2s ease" }}
                    />
                  </svg>
                  <motion.span
                    key={isOverLimit ? "over" : "normal"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    aria-live="polite"
                    aria-label={`${charsLeft} characters remaining`}
                    className="text-[11px] font-mono tabular-nums font-semibold"
                    style={{ color: gaugeColor }}
                  >
                    {isOverLimit ? `−${Math.abs(charsLeft)}` : charsLeft}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: post button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Publish post"
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60
              ${canSubmit
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-violet-600 dark:hover:bg-violet-300 shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
              }
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              {uploading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
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
                  <Send size={13} aria-hidden="true" />
                  Post
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Drag hint ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!media && !uploading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-[10px] text-zinc-300 dark:text-zinc-700 tracking-widest uppercase font-medium select-none"
          >
            Drag & drop a photo or video anywhere above
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}