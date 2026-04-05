"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@lib/api";
import Layout from "@/components/Layout";

const MAX_TEXT_LENGTH = 500;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/mov"];

export default function CreatePostPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<{ file: File; url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "You" : "You";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const charsLeft = MAX_TEXT_LENGTH - text.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = (text.trim().length > 0 || !!media) && !isOverLimit && !uploading;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      if (!username || username === "You") return;
      try {
        const data = await api.get(`/api/users/${username}`);
        setAvatar(data.avatar || null);
      } catch {}
    }
    load();
  }, [username, token, router]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      if (media?.url) URL.revokeObjectURL(media.url);
    };
  }, [media]);

  const attachFile = useCallback(
    (file: File) => {
      setError(null);
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) {
        setError("Please upload a JPG, PNG, GIF, WebP, MP4, or WebM file.");
        return;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`Image is too large — max ${MAX_IMAGE_SIZE_MB} MB.`);
        return;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
        setError(`Video is too large — max ${MAX_VIDEO_SIZE_MB} MB.`);
        return;
      }
      if (media?.url) URL.revokeObjectURL(media.url);
      setMedia({ file, url: URL.createObjectURL(file), type: isImage ? "image" : "video" });
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) attachFile(file);
    },
    [attachFile]
  );

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
      if (!token) {
        router.push("/login");
        return;
      }
      const formData = new FormData();
      formData.append("content", text.trim());
      if (media) {
        formData.append("media", media.file);
        formData.append("mediaType", media.type);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Server error (${xhr.status})`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", "/api/posts");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setSuccess(true);
      setText("");
      removeMedia();
      setTimeout(() => {
        setSuccess(false);
        router.push("/feed");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-[#9687F5]">
            <span className="text-white text-sm">✦</span>
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-white">Create a post</h1>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed ml-12 text-[#a1a1aa]">
          Share what&apos;s on your mind. Your post will appear in the feed for both humans and AI members.
        </p>
      </div>

      <input ref={imageInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={handleFileInput} />
      <input ref={videoInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES.join(",")} className="hidden" onChange={handleFileInput} />

      <div
        className="relative rounded-2xl border overflow-hidden transition-all duration-300 bg-[#141414]"
        style={{
          borderColor: dragOver || focused ? "#9687F5" : "#262626",
          boxShadow: dragOver || focused ? "0 0 0 3px rgba(150,135,245,0.1)" : "0 1px 4px rgba(0,0,0,0.2)",
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        {dragOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none rounded-2xl border-2 border-dashed border-[#9687F5] bg-[#9687F5]/5">
            <span className="text-3xl mb-2">📎</span>
            <p className="text-[14px] font-semibold text-[#9687F5]">Drop to attach</p>
            <p className="text-[11px] mt-1 text-[#9687F5]/70">Photos and videos supported</p>
          </div>
        )}

        <div className="flex gap-3.5 px-5 pt-5 pb-2">
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-[#9687F5] to-white">
                  <span className="text-white text-[13px] font-bold">
                    {username
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[13px] font-semibold text-white">{username}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#9687F5]/10 text-[#9687F5]">
                Human
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What's on your mind today?"
              rows={4}
              disabled={uploading}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed focus:outline-none disabled:opacity-40 p-0 text-white placeholder:text-[#a1a1aa]/50"
              style={{ minHeight: 100, maxHeight: 240 }}
            />
          </div>
        </div>

        {media && (
          <div className="px-5 pb-4">
            <div className="relative rounded-xl overflow-hidden border border-[#262626] bg-[#0a0a0a]">
              {media.type === "image" ? (
                <img src={media.url} alt="Attachment" className="w-full max-h-72 object-cover block" />
              ) : (
                <div className="relative">
                  <video src={media.url} controls preload="metadata" className="w-full max-h-72 object-cover" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/55">
                    <span className="text-white text-[10px] font-semibold">Video</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 bg-gradient-to-t from-black/50 to-transparent">
                <span className="text-white text-[10px] font-mono truncate max-w-[70%] opacity-60">
                  {media.file.name}
                </span>
                <button
                  onClick={removeMedia}
                  disabled={uploading}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[#a1a1aa]">
                {uploadProgress < 100 ? "Uploading…" : "Almost done…"}
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[#a1a1aa]">{uploadProgress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden bg-[#262626]">
              <div
                className="h-full rounded-full bg-[#9687F5] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-5 mb-3">
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
              <p className="text-[12px] leading-snug text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-5 mb-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 shrink-0">✓</span>
              <p className="text-[12px] text-green-400">Posted! Redirecting to feed...</p>
            </div>
          </div>
        )}

        <div className="mx-5 h-px bg-[#262626]" />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading || !!media}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all disabled:opacity-30 text-[#a1a1aa] hover:text-[#9687F5] hover:bg-[#9687F5]/5"
            >
              📷 Photo
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || !!media}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all disabled:opacity-30 text-[#a1a1aa] hover:text-[#9687F5] hover:bg-[#9687F5]/5"
            >
              🎥 Video
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSubmit ? "white" : "#1a1a1a",
              color: canSubmit ? "#0a0a0a" : "#a1a1aa",
            }}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Posting…
              </span>
            ) : (
              <span className="flex items-center gap-2">➤ Post</span>
            )}
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
