import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Image, Video, Send, X, Sparkles, Smile, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const onEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

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
    
    // Revoke old URL to prevent memory leaks
    if (media) URL.revokeObjectURL(media);
    
    const url = URL.createObjectURL(file);
    setMedia(url);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handlePost = async () => {
    if (!content.trim() && !fileInputRef.current?.files?.[0]) return;
    
    setIsTransmitting(true);
    const formData = new FormData();
    formData.append("content", content);
    
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append("media", file);
      formData.append("mediaType", file.type.startsWith("video") ? "video" : "image");
    }

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setContent("");
        setMedia(null);
        setMediaType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // REDIRECT TO FEED SO USER SEES THEIR POST
        navigate("/"); 
      }
    } catch (err) {
      console.error("Post failed", err);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className={`social-card !p-4 md:!p-8 transition-all duration-500 ${isFocused ? 'ring-1 ring-cyan-glow/30 border-cyan-glow/20 bg-white/[0.04]' : ''}`}>
      <div className="flex gap-3 md:gap-5">
        {/* USER AVATAR - Hidden on very small screens to save space */}
        <div className="hidden sm:block shrink-0">
          <div className="relative p-0.5 rounded-full bg-gradient-to-b from-cyan-glow to-transparent shadow-[0_0_15px_rgba(39,194,238,0.2)]">
            <Avatar 
              src={avatar || undefined} 
              alt={username || "User"} 
              className="w-10 h-10 md:w-12 md:h-12 border-2 border-void" 
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* POST TEXT AREA */}
          <textarea
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's manifesting in your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-white text-base md:text-lg placeholder:text-white/20 resize-none min-h-[100px] md:min-h-[140px] font-light leading-relaxed transition-all p-0"
          />

          {/* MEDIA PREVIEW */}
          <AnimatePresence>
            {media && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative mb-6 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 group bg-void/50 aspect-video sm:aspect-auto"
              >
                <button 
                  onClick={() => { 
                    setMedia(null); 
                    setMediaType(null); 
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }} 
                  className="absolute top-3 right-3 p-2 bg-void/80 hover:bg-crimson rounded-full z-10 text-white border border-white/10 shadow-xl transition-colors"
                >
                  <X size={16} />
                </button>

                {mediaType === "video" ? (
                  <video src={media} className="w-full max-h-[400px] object-contain bg-black" controls />
                ) : (
                  <img src={media} alt="Preview" className="w-full object-cover max-h-[450px]" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOOLBAR */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-1 md:gap-2 relative">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 md:p-2.5 hover:bg-cyan-glow/10 rounded-xl transition-all group"
                title="Add Media"
              >
                <Image className="w-5 h-5 text-cyan-glow opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                className={`p-2 md:p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-cyan-glow/20 text-cyan-glow' : 'hover:bg-white/5 text-white/40'}`}
                title="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 z-[100] mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={onEmojiClick}
                    skinTonesDisabled
                    searchDisabled
                    height={350}
                    width={280}
                  />
                </div>
              )}

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
              whileHover={!isTransmitting ? { scale: 1.02 } : {}}
              whileTap={!isTransmitting ? { scale: 0.98 } : {}}
              onClick={handlePost}
              disabled={(!content.trim() && !media) || isTransmitting}
              className="btn-action !py-2 md:!py-2.5 !px-5 md:!px-8 flex items-center gap-3 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(39,194,238,0.15)]"
            >
              {isTransmitting ? (
                <>
                  <span className="text-[10px] uppercase tracking-widest font-black">Syncing...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  <span className="text-[10px] uppercase tracking-widest font-black">Transmit</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS INDICATOR */}
      {content.length > 0 && !isTransmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mt-4 text-[9px] md:text-[10px] text-cyan-glow/40 uppercase tracking-[0.3em] font-bold px-1"
        >
          <Sparkles size={10} className="animate-pulse" /> Finalizing Neural Packet
        </motion.div>
      )}
    </div>
  );
}