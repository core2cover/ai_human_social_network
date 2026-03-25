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
  Maximize2,
  ZoomIn,
  Search
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

  // --- STANDARD STATES ---
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // --- ZOOM & PAN STATES ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- SHARE & TOAST ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- REFS ---
  const cardRef = useRef<HTMLDivElement>(null);
  const hasViewed = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // --- VIDEO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const isOwner = currentUser === post.user?.username;
  const displayCommentCount = comments.length > 0 ? comments.length : (post._count?.comments ?? 0);

  // Auto-scroll to bottom when new comment added
  useEffect(() => {
    if (showComments) {
      commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, showComments]);

  // ---------------- ZOOM HANDLERS ----------------

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
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setDragging(false);

  // ---------------- STANDARD HANDLERS ----------------

  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      try {
        const res = await fetch(`${API}/api/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setComments(data);
      } catch (err) { console.error("Failed to sync comments", err); }
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIsLiked(data.liked);
      setLikesCount(prev => prev + (data.liked ? 1 : -1));
    } catch (err) { console.error("Like failed", err); }
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
    } catch (err) { console.error("Comment failed", err); }
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
    } catch (err) { console.error("Delete failed", err); }
  };

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

  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="social-card group !p-0 overflow-hidden relative"
      >
        <div className="p-6">
          {/* HEADER */}
          <header className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${post.user?.username}`} className="relative">
                <Avatar src={post.user?.avatar} is_ai={post.user?.is_ai} />
                {post.user?.is_ai && (
                  <div className="absolute -top-1 -right-1 bg-void rounded-full p-0.5 shadow-[0_0_10px_#27C2EE]">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-glow" />
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-2">
                  <h3 className="font-black text-white text-sm uppercase tracking-tight group-hover:text-cyan-glow transition-colors">
                    {post.user?.displayName || post.user?.username}
                  </h3>
                  {post.user?.is_ai && (
                    <span className="text-[8px] font-black bg-cyan-glow/10 text-cyan-glow px-1.5 py-0.5 rounded border border-cyan-glow/20 tracking-widest uppercase">Agent</span>
                  )}
                </Link>
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-tighter">
                  @{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showMenu && isOwner && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-48 bg-void/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-crimson hover:bg-crimson/10 transition-colors uppercase tracking-widest">
                      <Trash2 size={14} /> Terminate Post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <div className="mb-4 mt-2 px-1 border-b border-white/5 pb-6">
            <p className="post-body-text text-white/90 font-medium leading-relaxed">{post.content}</p>
          </div>

          {/* MEDIA SECTION */}
          {post.mediaUrl && (
            <div className="mb-6 rounded-[2rem] overflow-hidden border border-white/5 bg-void relative group/media">
              {post.mediaType === "video" ? (
                <div className="relative aspect-video flex items-center justify-center bg-black/20">
                  <video ref={videoRef} src={post.mediaUrl} className="w-full max-h-[600px] object-contain" onClick={() => { if (!videoRef.current) return; videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); setIsPlaying(!isPlaying); }} loop playsInline />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-void/20 pointer-events-none">
                      <div className="p-5 bg-cyan-glow/20 backdrop-blur-md rounded-full border border-cyan-glow/40 shadow-[0_0_20px_rgba(39,194,238,0.3)]">
                        <Play className="text-cyan-glow fill-cyan-glow w-6 h-6 ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                    <button onClick={() => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); }} className="p-2.5 bg-void/60 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-cyan-glow transition-all">
                      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative cursor-zoom-in overflow-hidden" onClick={() => setIsFullScreen(true)}>
                  <motion.img whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }} src={post.mediaUrl} className="w-full object-cover max-h-[550px]" loading="lazy" />
                  <div className="absolute top-4 right-4 p-2 bg-void/40 backdrop-blur-md rounded-lg opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center gap-2">
                    <ZoomIn size={14} className="text-cyan-glow" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">Enlarge</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <footer className="flex items-center gap-8 pt-2">
            <button onClick={handleLike} className={`flex items-center gap-2 transition-colors ${isLiked ? "text-crimson" : "text-white/20 hover:text-crimson"}`}>
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-[11px] font-bold">{likesCount}</span>
            </button>
            <button onClick={toggleComments} className={`flex items-center gap-2 transition-colors ${showComments ? "text-cyan-glow" : "text-white/20 hover:text-cyan-glow"}`}>
              <MessageCircle className="w-4 h-4" />
              <span className="text-[11px] font-bold">{displayCommentCount}</span>
            </button>
            <div className="flex items-center gap-2 text-white/10 group-hover:text-white/30 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-[11px] font-bold font-mono tracking-tighter">{viewCount.toLocaleString()}</span>
            </div>
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 text-white/20 hover:text-cyan-glow ml-auto transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </footer>
        </div>

        {/* FIXED COMMENTS SECTION */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/[0.01] border-t border-white/5 overflow-hidden flex flex-col"
            >
              {/* Scrollable Area */}
              <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto no-scrollbar p-4 space-y-1">
                {comments.length === 0 && displayCommentCount > 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-cyan-glow animate-spin opacity-20" />
                  </div>
                ) : (
                  <>
                    <CommentList comments={comments} />
                    <div ref={commentEndRef} />
                  </>
                )}
              </div>

              {/* Input Area - Tighter & Styled */}
              <div className="px-4 pb-4 pt-1 bg-void/60 backdrop-blur-xl sticky bottom-0 border-t border-white/[0.02]">
                <div className="flex items-center gap-2 relative">
                  <div className="flex-1 relative flex items-center group">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                      placeholder="Neural response..."
                      className="w-full bg-void/40 border border-white/5 rounded-xl px-4 py-2 text-sm font-mono text-cyan-glow placeholder:text-white/10 focus:outline-none focus:border-cyan-glow/30 focus:bg-void/80 transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute right-3 p-1 rounded-md transition-all ${showEmojiPicker ? 'text-cyan-glow bg-cyan-glow/10' : 'text-white/20 hover:text-white'}`}
                    >
                      <Smile size={16} />
                    </button>

                    {/* Styled Emoji Picker */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-[calc(100%+12px)] right-0 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] clift-emoji-picker"
                        >
                          <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={(emojiData) => setNewComment(prev => prev + emojiData.emoji)}
                            lazyLoadEmojis={true}
                            searchPlaceholder="Search Neural Icons..."
                            skinTonesDisabled
                            height={320}
                            width={280}
                            previewConfig={{ showPreview: false }} // Removes the "What's your mood" bar for better UX
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    disabled={isSubmittingComment || !newComment.trim()}
                    onClick={handleCommentSubmit}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow hover:bg-cyan-glow hover:text-void disabled:opacity-10 transition-all"
                  >
                    {isSubmittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* ZOOM MODAL (Untouched) */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-void/98 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden"
          >
            {/* TOP BAR */}
            <div className="absolute top-0 w-full p-6 flex items-center justify-between z-[2100] bg-gradient-to-b from-void/80 to-transparent">
              <div className="flex items-center gap-3">
                <Avatar src={post.user?.avatar} size="sm" />
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">{post.user?.displayName || post.user?.username}</p>
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Broadcast View</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={() => { setZoom(zoom === 1 ? 2 : 1); setPosition({ x: 0, y: 0 }); }} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-cyan-glow transition-all">
                  <ZoomIn size={20} />
                </button>
                <button onClick={() => { setIsFullScreen(false); setZoom(1); setPosition({ x: 0, y: 0 }); }} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-crimson transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* IMAGE CONTAINER */}
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <motion.img
                src={post.mediaUrl}
                onMouseDown={handleMouseDown}
                animate={{ scale: zoom, x: position.x, y: position.y }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`max-w-[95%] max-h-[85%] object-contain rounded-lg shadow-2xl ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                draggable={false}
                loading="lazy"
              />
            </div>

            {/* HINT BAR */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-glow/10 border border-cyan-glow/20 rounded-full backdrop-blur-md">
              <p className="text-cyan-glow text-[9px] uppercase font-black tracking-[0.3em]">
                {zoom > 1 ? "Drag to move • Double click to reset" : "Scroll or double click to zoom"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL & TOAST */}
      <AnimatePresence>
        {showShareModal && (
          <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[1100] bg-cyan-glow text-void px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(39,194,238,0.4)]">
            <CheckCircle2 size={16} /><span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostCard;