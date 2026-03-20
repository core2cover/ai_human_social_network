import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Image, Video, Send, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Avatar from "./Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

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
    const url = URL.createObjectURL(file);
    setMedia(url);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handlePost = async () => {
    if (!content.trim() && !fileInputRef.current?.files?.[0]) return;
    const formData = new FormData();
    formData.append("content", content);
    if (fileInputRef.current?.files?.[0]) {
      formData.append("media", fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      await res.json();
      
      // Reset
      setContent("");
      setMedia(null);
      setMediaType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Post failed", err);
    }
  };

  return (
    <div className={`social-card !p-6 transition-all duration-500 ${isFocused ? 'ring-1 ring-cyan-glow/30 border-cyan-glow/20' : ''}`}>
      <div className="flex gap-5">
        {/* USER AVATAR */}
        <div className="shrink-0">
          <div className="relative p-0.5 rounded-full bg-gradient-to-b from-cyan-glow to-transparent">
             <Avatar 
                src={avatar || undefined} 
                alt={username || "User"} 
                className="w-12 h-12 border-2 border-void"
             />
          </div>
        </div>

        <div className="flex-1">
          {/* POST TEXT AREA */}
          <textarea
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's manifesting in your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-white text-lg placeholder:text-white/20 resize-none min-h-[120px] font-light leading-relaxed transition-all"
          />

          {/* MEDIA PREVIEW */}
          <AnimatePresence>
            {media && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mb-6 rounded-3xl overflow-hidden border border-white/10 group"
              >
                <button
                  onClick={() => {
                    setMedia(null);
                    setMediaType(null);
                    if(fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 p-2 bg-void/80 hover:bg-crimson rounded-full transition-all z-10 text-white border border-white/10 shadow-xl"
                >
                  <X className="w-4 h-4" />
                </button>

                {mediaType === "video" ? (
                  <video src={media} className="w-full aspect-video object-cover" controls />
                ) : (
                  <img src={media} alt="Preview" className="w-full object-cover max-h-[450px]" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOOLBAR */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-cyan-glow/10 rounded-xl transition-all group"
                title="Add Imagery"
              >
                <Image className="w-5 h-5 text-cyan-glow opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-white/5 rounded-xl transition-all group"
                title="Add Stream"
              >
                <Video className="w-5 h-5 text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />
              </button>

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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePost}
              disabled={!content.trim() && !media}
              className="btn-action !py-2.5 !px-6 flex items-center gap-3 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-lg"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-black">Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* DECORATIVE AI SPARKLE */}
      {content.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mt-4 text-[10px] text-cyan-glow/40 uppercase tracking-[0.3em] font-bold px-1"
        >
          <Sparkles size={10} /> Syncing with neural network...
        </motion.div>
      )}
    </div>
  );
}