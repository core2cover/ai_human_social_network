import React, {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
} from "react";
import {
  Image,
  Video,
  X,
  Sparkles,
  Smile,
  Loader2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import EmojiPicker, { Theme } from "emoji-picker-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface MediaFile {
  url: string;
  type: "image" | "video";
  file: File;
}

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  // 🟢 Optimized Emoji Handler: Allows multiple selections at cursor position
  const onEmojiClick = (emojiData: any) => {
    const ref = textareaRef.current;
    if (!ref) return;

    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    
    // Insert emoji at cursor position instead of just appending
    const newText = content.substring(0, start) + emojiData.emoji + content.substring(end);
    setContent(newText);

    // Maintain focus and move cursor after the inserted emoji
    setTimeout(() => {
      ref.focus();
      const newCursorPos = start + emojiData.emoji.length;
      ref.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiContainerRef.current &&
        !emojiContainerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

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
    const files = e.target.files as FileList;
    if (!files) return;

    const newMedia: MediaFile[] = Array.from(files).map((file: File) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      file: file,
    }));

    setMediaList((prev) => [...prev, ...newMedia].slice(0, 10)); // Limit to 10
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => {
      const newList = [...prev];
      URL.revokeObjectURL(newList[index].url);
      newList.splice(index, 1);
      return newList;
    });
  };

  const handlePost = async () => {
    if (!content.trim() && mediaList.length === 0) return;

    setIsTransmitting(true);
    const formData = new FormData();
    formData.append("content", content);

    // Append multiple files
    mediaList.forEach((item) => {
      formData.append("media", item.file);
    });

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setContent("");
        mediaList.forEach((m) => URL.revokeObjectURL(m.url));
        setMediaList([]);
        setShowEmojiPicker(false);
        navigate("/");
      }
    } catch (err) {
      console.error("Neural uplink failed", err);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div
      className={`social-card !bg-white !p-5 md:!p-8 transition-all duration-500 shadow-xl border-none relative flex flex-col ${
        isFocused || showEmojiPicker ? "ring-2 ring-crimson/10 shadow-2xl scale-[1.01]" : ""
      }`}
    >
      <div className="flex gap-4 md:gap-6">
        <div className="hidden sm:block shrink-0">
          <Avatar
            src={avatar || undefined}
            alt={username || "User"}
            size="lg"
            className="border-4 border-void shadow-sm"
          />
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { if (!showEmojiPicker) setIsFocused(false); }}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's manifesting in your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-ocean text-lg md:text-xl placeholder:text-text-dim/40 resize-none min-h-[120px] font-normal leading-relaxed p-0"
          />

          {/* Media Preview Grid */}
          <AnimatePresence>
            {mediaList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {mediaList.map((item, index) => (
                  <motion.div
                    key={item.url}
                    layout
                    className="relative rounded-2xl overflow-hidden border border-black/[0.05] bg-void aspect-square flex items-center justify-center group"
                  >
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-crimson rounded-xl z-10 text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                    {item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover bg-black" />
                    ) : (
                      <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4 pt-5 border-t border-black/[0.05]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 md:gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-crimson/5 rounded-2xl transition-all group"
                  title="Add Media"
                >
                  <Image className="w-5 h-5 text-text-dim group-hover:text-crimson transition-colors" />
                </button>

                <div className="relative" ref={emojiContainerRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className={`p-3 rounded-2xl transition-all ${
                      showEmojiPicker ? "bg-crimson/10 text-crimson" : "text-text-dim hover:bg-black/5"
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>

              <motion.button
                whileHover={!isTransmitting ? { y: -2 } : {}}
                whileTap={!isTransmitting ? { scale: 0.98 } : {}}
                onClick={handlePost}
                disabled={(!content.trim() && mediaList.length === 0) || isTransmitting}
                className="bg-ocean text-white !py-3 !px-8 rounded-2xl flex items-center gap-3 disabled:opacity-20 transition-all shadow-lg hover:bg-crimson"
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

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 pb-4">
                    <EmojiPicker
                      theme={Theme.LIGHT}
                      onEmojiClick={onEmojiClick}
                      skinTonesDisabled
                      searchDisabled
                      width="100%"
                      height={350}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

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