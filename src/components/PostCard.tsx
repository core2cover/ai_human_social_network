import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  ShieldCheck,
  Trash2,
  Send,
  Eye,
  Smile,
  CheckCircle2,
  Loader2,
  X,
  ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import type { Post } from "../types";
import CommentList from "./CommentList";
import { Link } from "react-router-dom";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import PostShareModal from "./PostShareModal";

interface PostCardProps {
  post: Post;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const token = localStorage.getItem("token");
  const currentUser = localStorage.getItem("username");

  // --- CORE STATES ---
  const [showMenu, setShowMenu] = useState(false);

  // 🟢 INITIALIZATION: Set state based on 'post.liked' boolean from backend
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // --- FULLSCREEN & ZOOM STATES ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- UI FEEDBACK ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- REFS ---
  const cardRef = useRef<HTMLDivElement>(null);
  const hasViewed = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // --- VIDEO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const isOwner = currentUser === post.user?.username;
  const displayCommentCount = comments.length > 0 ? comments.length : (post._count?.comments ?? 0);

  // Sync state if post prop changes (useful for feed refreshes)
  useEffect(() => {
    setIsLiked(post.liked ?? false);
    setLikesCount(post._count?.likes ?? 0);
  }, [post]);

  // Auto-scroll to bottom and click-outside handler
  useEffect(() => {
    if (showComments) commentEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [comments, showComments]);

  // ---------------- VIEW TRACKER (Observer) ----------------
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasViewed.current) {
          const timer = setTimeout(async () => {
            try {
              const res = await fetch(`${API}/api/posts/${post.id}/view`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                setViewCount(data.views);
                hasViewed.current = true;
              }
            } catch (err) { console.error("View tracking failed"); }
          }, 2000);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.7 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id, token]);

  // ---------------- ZOOM & PAN HANDLERS ----------------
  const handleWheel = (e: React.WheelEvent) => {
    let newZoom = zoom - e.deltaY * 0.001;
    newZoom = Math.min(Math.max(1, newZoom), 3);
    setZoom(newZoom);
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setDragging(false);

  // ---------------- DATA ACTION HANDLERS ----------------
  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      try {
        const res = await fetch(`${API}/api/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Comment fetch failed");
        const data = await res.json();
        if (Array.isArray(data)) setComments(data);
      } catch (err) { console.error("Neural response sync failed", err); }
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // Update UI immediately based on response
      setIsLiked(data.liked);
      setLikesCount(prev => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error("Like protocol failed");
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment, postId: post.id })
      });
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setNewComment("");
      setShowEmojiPicker(false);
    } catch (err) { console.error("Comment submission failed"); }
    setIsSubmittingComment(false);
  };

  const handleDelete = async () => {
    if (!confirm("Terminate this broadcast?")) return;
    try {
      const res = await fetch(`${API}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) window.location.reload();
    } catch (err) { console.error("Delete failed"); }
  };

  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="social-card !bg-white group !p-0 overflow-hidden relative shadow-xl border border-black/[0.03] selection:bg-crimson/20"
      >
        <div className="p-5 md:p-8">
          {/* HEADER */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${post.user?.username}`} className="relative block hover:scale-105 transition-transform">
                <Avatar src={post.user?.avatar} alt={post.user?.name || post.user?.username} isAi={post.user?.isAi} size="md" className="border border-black/[0.05]" />
                {post.user?.isAi && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md border border-black/5">
                    <ShieldCheck className="w-3 h-3 text-crimson" />
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-2">
                  <h3 className="font-serif font-black text-ocean text-sm tracking-tight hover:text-crimson transition-colors uppercase">
                    {post.user?.name || post.user?.username}
                  </h3>
                  {post.user?.isAi && (
                    <span className="text-[7px] font-black bg-crimson/10 text-crimson px-2 py-0.5 rounded-full tracking-widest uppercase">Entity</span>
                  )}
                </Link>
                <p className="text-[10px] text-text-dim font-mono font-bold uppercase tracking-widest opacity-40">
                  @{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-text-dim/30 hover:text-ocean hover:bg-void rounded-xl transition-all">
                <MoreHorizontal size={20} />
              </button>
              <AnimatePresence>
                {showMenu && isOwner && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-2 w-48 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-20 overflow-hidden">
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest">
                      <Trash2 size={14} /> Terminate Broadcast
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* BODY */}
          <div className="mb-6 px-1">
            <p className="text-ocean/90 text-base md:text-lg font-medium leading-relaxed font-serif italic">
              {post.content}
            </p>
          </div>

          {/* MEDIA SECTION */}
          {post.mediaUrl && (
            <div className="mb-8 rounded-[2.5rem] overflow-hidden border border-black/[0.03] bg-void relative group/media shadow-inner">
              {post.mediaType === "video" ? (
                <div className="relative aspect-video flex items-center justify-center bg-ocean/5">
                  <video ref={videoRef} src={post.mediaUrl} className="w-full max-h-[600px] object-contain" loop playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover/media:opacity-100 transition-opacity">
                    <button onClick={() => { if (!videoRef.current) return; videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); setIsPlaying(!isPlaying); }} className="p-6 bg-white/90 backdrop-blur-md rounded-full shadow-2xl text-ocean hover:scale-110 transition-transform">
                      {isPlaying ? <X size={24} /> : <Play size={24} className="fill-current ml-1" />}
                    </button>
                  </div>
                  <div className="absolute bottom-6 right-6 flex gap-2">
                    <button onClick={() => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); }} className="p-3 bg-white border border-black/5 rounded-2xl text-ocean shadow-lg hover:bg-crimson hover:text-white transition-all">
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative cursor-zoom-in group/img" onClick={() => setIsFullScreen(true)}>
                  <motion.img whileHover={{ scale: 1.02 }} transition={{ duration: 0.5 }} src={post.mediaUrl} className="w-full object-cover max-h-[600px]" loading="lazy" />
                  <div className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-black/5 shadow-lg opacity-0 group-hover/img:opacity-100 transition-all flex items-center gap-2">
                    <ZoomIn size={16} className="text-crimson" />
                    <span className="text-[10px] text-ocean font-black uppercase tracking-widest">Inspect</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <footer className="flex items-center gap-8 md:gap-12 pt-4 border-t border-black/[0.03]">
            {/* 🟢 HIGHLIGHTED LIKE BUTTON: Uses Crimson text and fill-current if isLiked is true */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2.5 transition-all duration-300 group/like ${isLiked ? "text-crimson" : "text-text-dim/40 hover:text-crimson"
                }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover/like:scale-125 ${isLiked ? "fill-current scale-110" : ""
                  }`}
              />
              <span className={`text-xs font-black ${isLiked ? "opacity-100" : "opacity-70"}`}>
                {likesCount}
              </span>
            </button>

            <button onClick={toggleComments} className={`flex items-center gap-2.5 transition-colors ${showComments ? "text-ocean" : "text-text-dim/40 hover:text-ocean"}`}>
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-black">{displayCommentCount}</span>
            </button>
            <div className="flex items-center gap-2.5 text-text-dim/20">
              <Eye size={18} />
              <span className="text-[11px] font-mono font-bold tracking-widest">{viewCount.toLocaleString()}</span>
            </div>
            <button onClick={() => setShowShareModal(true)} className="ml-auto p-2 text-text-dim/30 hover:text-crimson hover:bg-crimson/5 rounded-xl transition-all">
              <Share2 size={20} />
            </button>
          </footer>
        </div>

        {/* COMMENTS SECTION */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-void/30 border-t border-black/[0.03] overflow-hidden flex flex-col">
              <div className="max-h-[400px] overflow-y-auto no-scrollbar p-6 space-y-4">
                {comments.length === 0 && displayCommentCount > 0 ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-crimson animate-spin opacity-40" />
                  </div>
                ) : (
                  <CommentList comments={comments} />
                )}
                <div ref={commentEndRef} />
              </div>
              <div className="p-6 bg-white border-t border-black/[0.03] sticky bottom-0">
                <div className="flex items-center gap-3 relative" ref={emojiRef}>
                  <div className="flex-1 relative flex items-center">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                      placeholder="Share your neural input..."
                      className="w-full bg-void border border-black/5 rounded-2xl px-5 py-3.5 text-sm text-ocean placeholder:text-text-dim/40 focus:ring-2 focus:ring-crimson/10 outline-none transition-all"
                    />
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`absolute right-4 transition-colors ${showEmojiPicker ? 'text-crimson' : 'text-text-dim/40 hover:text-crimson'}`}>
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-4 shadow-2xl rounded-3xl overflow-hidden border border-black/10">
                        <EmojiPicker theme={Theme.LIGHT} onEmojiClick={(d) => setNewComment(p => p + d.emoji)} height={350} width={280} searchDisabled />
                      </div>
                    )}
                  </div>
                  <button onClick={handleCommentSubmit} disabled={isSubmittingComment || !newComment.trim()} className="bg-ocean text-white p-4 rounded-2xl shadow-lg hover:bg-crimson transition-all">
                    {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* FULLSCREEN PAN MODAL */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-0 w-full p-8 flex items-center justify-between z-[2100]">
              <div className="flex items-center gap-4">
                <Avatar src={post.user?.avatar} alt={post.user?.name || post.user?.username} size="sm" />
                <div>
                  <p className="text-[11px] font-black text-ocean uppercase tracking-widest">{post.user?.name || post.user?.username}</p>
                  <p className="text-[9px] font-mono text-text-dim uppercase tracking-tighter opacity-40">Inspect Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => { setZoom(zoom === 1 ? 2 : 1); setPosition({ x: 0, y: 0 }); }} className="p-4 bg-void border border-black/5 rounded-full text-ocean hover:text-crimson transition-all"><ZoomIn size={24} /></button>
                <button onClick={() => { setIsFullScreen(false); setZoom(1); setPosition({ x: 0, y: 0 }); }} className="p-4 bg-ocean text-white rounded-full hover:bg-crimson transition-all shadow-xl"><X size={24} /></button>
              </div>
            </div>
            <div className="w-full h-full flex items-center justify-center overflow-hidden" onWheel={handleWheel} onDoubleClick={handleDoubleClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <motion.img
                src={post.mediaUrl}
                onMouseDown={handleMouseDown}
                animate={{ scale: zoom, x: position.x, y: position.y }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`max-w-[90%] max-h-[80%] object-contain rounded-2xl shadow-2xl ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                draggable={false}
              />
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-ocean text-white rounded-full shadow-2xl">
              <p className="text-[10px] uppercase font-black tracking-[0.3em]">{zoom > 1 ? "Drag to pan • Double click to reset" : "Scroll or double click to zoom"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} />}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1100] bg-ocean text-white px-8 py-5 rounded-full flex items-center gap-3 shadow-2xl">
            <CheckCircle2 size={20} className="text-crimson" />
            <span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostCard;