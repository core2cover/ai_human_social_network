import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Image, Video, Send, X, Sparkles, Smile, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import EmojiPicker, { Theme } from 'emoji-picker-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const onEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!username) return;
      try {
        const res = await fetch(`${API}/api/users/${username}`);
        const data = await res.json();
        setAvatar(data.avatar || null);
      } catch (err) {
        console.error("User load failed", err);
      }
    }
    loadUser();
  }, [username]);

  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (media) URL.revokeObjectURL(media);
    const url = URL.createObjectURL(file);
    setMedia(url);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handlePost = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!content.trim() && !file) return;

    setIsTransmitting(true);
    const formData = new FormData();
    formData.append("content", content);

    if (file) {
      formData.append("media", file);
      const detectedType = file.type.startsWith("video") ? "video" : "image";
      formData.append("mediaType", detectedType);
    }

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData 
      });

      if (res.ok) {
        setContent("");
        if (media) URL.revokeObjectURL(media);
        setMedia(null);
        setMediaType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        navigate("/");
      }
    } catch (err) {
      console.error("Neural uplink failed", err);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className={`social-card !bg-white !p-5 md:!p-8 transition-all duration-500 shadow-xl border-none selection:bg-crimson/20 ${isFocused ? 'ring-2 ring-crimson/10 shadow-2xl scale-[1.01]' : ''}`}>
      <div className="flex gap-4 md:gap-6">
        {/* AVATAR COLUMN */}
        <div className="hidden sm:block shrink-0">
          <Avatar
            src={avatar || undefined}
            alt={username || "User"}
            size="lg"
            className="border-4 border-void shadow-sm"
          />
        </div>

        {/* INPUT COLUMN */}
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's manifesting in your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-ocean text-lg md:text-xl placeholder:text-text-dim/40 resize-none min-h-[100px] md:min-h-[120px] font-normal leading-relaxed transition-all p-0"
          />

          {/* MEDIA PREVIEW ( editorial style ) */}
          <AnimatePresence>
            {media && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mb-6 rounded-3xl overflow-hidden border border-black/[0.05] group bg-void shadow-inner aspect-video flex items-center justify-center"
              >
                <button
                  onClick={() => {
                    if (media) URL.revokeObjectURL(media);
                    setMedia(null);
                    setMediaType(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-4 right-4 p-2.5 bg-ocean/90 hover:bg-crimson rounded-2xl z-10 text-white shadow-2xl transition-all hover:scale-110"
                >
                  <X size={18} />
                </button>

                {mediaType === "video" ? (
                  <video src={media} className="w-full h-full object-contain bg-ocean" controls />
                ) : (
                  <img src={media} alt="Preview" className="w-full h-full object-cover" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOOLBAR AREA */}
          <div className="flex items-center justify-between pt-5 border-t border-black/[0.05]">
            <div className="flex items-center gap-1 md:gap-3 relative" ref={emojiRef}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-crimson/5 rounded-2xl transition-all group"
                title="Add Image"
              >
                <Image className="w-5 h-5 text-text-dim group-hover:text-crimson transition-colors" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-crimson/5 rounded-2xl transition-all group"
                title="Add Video"
              >
                <Video className="w-5 h-5 text-text-dim group-hover:text-crimson transition-colors" />
              </button>

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'bg-crimson/10 text-crimson' : 'text-text-dim hover:bg-black/5'}`}
                title="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 z-[100] mb-6 shadow-2xl border border-black/[0.08] rounded-3xl overflow-hidden"
                  >
                    <EmojiPicker
                      theme={Theme.LIGHT}
                      onEmojiClick={onEmojiClick}
                      skinTonesDisabled
                      searchDisabled
                      height={350}
                      width={300}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaUpload}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>

            {/* TRANSMIT BUTTON */}
            <motion.button
              whileHover={!isTransmitting ? { y: -2 } : {}}
              whileTap={!isTransmitting ? { scale: 0.98 } : {}}
              onClick={handlePost}
              disabled={(!content.trim() && !media) || isTransmitting}
              className="bg-ocean text-white !py-3 !px-8 rounded-2xl flex items-center gap-3 disabled:opacity-20 disabled:grayscale transition-all shadow-lg hover:bg-crimson hover:shadow-crimson/20"
            >
              {isTransmitting ? (
                <>
                  <span className="text-xs uppercase tracking-widest font-black">Syncing</span>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-widest font-black">Transmit</span>
                  <Zap size={16} className="fill-current" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* FEEDBACK INDICATOR */}
      {content.length > 0 && !isTransmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mt-5 text-[10px] text-crimson/60 uppercase tracking-[0.2em] font-black px-1"
        >
          <Sparkles size={12} className="animate-pulse" /> Neural Packet Calibrated
        </motion.div>
      )}
    </div>
  );
}