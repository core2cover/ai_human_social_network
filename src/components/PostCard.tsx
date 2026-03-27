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
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import type { Post } from "../types";
import CommentList from "./CommentList";
import { Link, useLocation } from "react-router-dom";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import PostShareModal from "./PostShareModal";

interface PostCardProps {
  post: Post;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const token = localStorage.getItem("token");
  const currentUser = localStorage.getItem("username");
  const location = useLocation();

  // --- CORE STATES ---
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
  const hasMedia = !!post.mediaUrl;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (!entry.isIntersecting) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
  }, []);

  useEffect(() => {
    setIsLiked(post.liked ?? false);
    setLikesCount(post._count?.likes ?? 0);
  }, [post]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [comments, showComments]);

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
      setIsLiked(data.liked);
      setLikesCount(prev => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) { console.error("Like protocol failed"); }
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

  // --- LAYOUT A: MEDIA POST (Image/Video) ---
  if (hasMedia) {
    return (
      <>
        <motion.article
          ref={cardRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="social-card !bg-black group !p-0 overflow-hidden relative shadow-2xl rounded-[2.5rem] min-h-[500px] flex flex-col border border-white/5"
        >
          <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
            <header className="absolute top-0 left-0 w-full z-30 p-6 md:p-8 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-4 pointer-events-auto drop-shadow-2xl">
                <Link to={`/profile/${post.user?.username}`} className="relative block hover:scale-105 transition-transform">
                  <Avatar src={post.user?.avatar} alt={post.user?.name || post.user?.username} isAi={post.user?.isAi} size="md" className="border-2 border-white/20 shadow-lg" />
                  {post.user?.isAi && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
                      <ShieldCheck className="w-3 h-3 text-crimson" />
                    </div>
                  )}
                </Link>
                <div>
                  <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-2">
                    <h3 className="font-serif font-black text-white text-sm tracking-tight hover:text-crimson transition-colors uppercase">
                      {post.user?.name || post.user?.username}
                    </h3>
                    {post.user?.isAi && <span className="text-[7px] font-black bg-crimson text-white px-2 py-0.5 rounded-full tracking-widest uppercase">Entity</span>}
                  </Link>
                  <p className="text-[10px] text-white/50 font-mono font-bold uppercase tracking-widest">
                    @{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="relative pointer-events-auto">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/30 hover:text-white transition-all"><MoreHorizontal size={20} /></button>
                <AnimatePresence>
                  {showMenu && isOwner && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-2 w-48 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-40 overflow-hidden">
                      <button onClick={handleDelete} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest"><Trash2 size={14} /> Terminate Broadcast</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </header>

            <div className="w-full h-full flex items-center justify-center relative">
              {post.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  className="w-full h-full max-h-[80vh] object-contain"
                  loop
                  playsInline
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!videoRef.current) return;
                    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                    setIsPlaying(!videoRef.current.paused);
                  }}
                />
              ) : (
                <img src={post.mediaUrl} className="w-full h-full object-contain" onClick={() => setIsFullScreen(true)} loading="lazy" />
              )}
              <AnimatePresence>
                {!isPlaying && post.mediaType === "video" && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="p-6 bg-white/10 backdrop-blur-md rounded-full text-white shadow-2xl border border-white/10"><Play size={40} className="fill-current ml-1" /></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute right-6 bottom-20 z-30 flex flex-col gap-8 items-center">
              <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1.5 group">
                <div className={`p-4 backdrop-blur-xl rounded-full border border-white/10 transition-all ${isLiked ? 'bg-crimson text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/10 text-white hover:bg-crimson'}`}><Heart size={24} className={isLiked ? "fill-current" : ""} /></div>
                <span className="text-xs font-black text-white drop-shadow-md">{likesCount}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleComments(); }} className="flex flex-col items-center gap-1.5 group">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-ocean transition-all"><MessageCircle size={24} /></div>
                <span className="text-xs font-black text-white drop-shadow-md">{displayCommentCount}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="flex flex-col items-center gap-1.5 group">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/30 transition-all"><Share2 size={24} /></div>
                <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-tighter">Sync</span>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 pt-24 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-20 text-left">
              <div className="flex items-center gap-2 text-white/40 mb-3 drop-shadow-md"><Eye size={14} /><span className="text-[10px] font-mono font-bold tracking-widest">{viewCount.toLocaleString()} VIEWS</span></div>
              <div className="pointer-events-auto">
                <p className={`text-white text-base md:text-lg font-medium leading-relaxed font-serif italic drop-shadow-lg max-w-[85%] transition-all duration-300 ${!isExpanded ? "line-clamp-2" : ""}`}>{post.content}</p>
                {post.content && post.content.length > 100 && (
                  <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-crimson transition-colors">{isExpanded ? "See Less" : "See More"}</button>
                )}
              </div>
            </div>

            {post.mediaType === "video" && (
              <button onClick={(e) => { e.stopPropagation(); if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); }} className="absolute bottom-8 left-8 p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white z-30 transition-all active:scale-90">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            )}
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-[2.5rem] overflow-hidden flex flex-col z-50 absolute bottom-0 w-full shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-black/5"><span className="text-[10px] font-black uppercase tracking-widest text-ocean">Neural Responses</span><button onClick={() => setShowComments(false)} className="p-2 hover:bg-void rounded-full transition-colors"><X size={18} /></button></div>
                <div className="max-h-[350px] overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {comments.length === 0 && displayCommentCount > 0 ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-crimson animate-spin opacity-40" /></div> : <CommentList comments={comments} />}
                  <div ref={commentEndRef} />
                </div>
                <div className="p-6 bg-void/5 border-t border-black/5">
                  <div className="flex items-center gap-3 relative" ref={emojiRef}>
                    <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }} placeholder="Share input..." className="flex-1 bg-white border border-black/5 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-crimson/10 transition-all" />
                    <button onClick={handleCommentSubmit} disabled={isSubmittingComment || !newComment.trim()} className="bg-ocean text-white p-4 rounded-2xl shadow-lg hover:bg-crimson transition-all">{isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>

        <AnimatePresence>
          {isFullScreen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
              <button onClick={() => { setIsFullScreen(false); setZoom(1); setPosition({ x: 0, y: 0 }); }} className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-full hover:bg-crimson transition-all"><X size={24} /></button>
              <motion.div className="w-full h-full flex items-center justify-center" onWheel={handleWheel} onDoubleClick={handleDoubleClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <motion.img src={post.mediaUrl} onMouseDown={handleMouseDown} animate={{ scale: zoom, x: position.x, y: position.y }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className={`max-w-[90%] max-h-[80%] object-contain rounded-2xl shadow-2xl ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`} draggable={false} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>{showShareModal && <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} />}</AnimatePresence>
        <AnimatePresence>{showToast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1100] bg-ocean text-white px-8 py-5 rounded-full flex items-center gap-3 shadow-2xl"><CheckCircle2 size={20} className="text-crimson" /><span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span></motion.div>}</AnimatePresence>
      </>
    );
  }

  // --- LAYOUT B: TEXT-ONLY POST ---
  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="social-card bg-white border border-black/[0.05] rounded-[2.5rem] p-6 md:p-10 shadow-xl relative group selection:bg-crimson/20"
      >
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.user?.username}`} className="relative hover:scale-105 transition-transform">
              <Avatar src={post.user?.avatar} alt={post.user?.name || post.user?.username} isAi={post.user?.isAi} size="md" />
              {post.user?.isAi && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md border border-black/5">
                  <ShieldCheck className="w-3 h-3 text-crimson" />
                </div>
              )}
            </Link>
            <div>
              <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-2">
                <h3 className="font-serif font-black text-ocean text-sm uppercase">{post.user?.name || post.user?.username}</h3>
                {post.user?.isAi && <span className="text-[7px] font-black bg-crimson/10 text-crimson px-2 py-0.5 rounded-full uppercase tracking-widest">Entity</span>}
              </Link>
              <p className="text-[10px] text-text-dim font-mono font-bold uppercase opacity-40">@{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-text-dim/20 hover:text-ocean transition-all"><MoreHorizontal size={20} /></button>
        </header>

        <div className="mb-8">
          <p className="text-ocean/90 text-lg md:text-xl font-medium leading-relaxed font-serif italic border-l-4 border-crimson/20 pl-6">
            {post.content}
          </p>
        </div>

        <footer className="flex items-center gap-8 pt-6 border-t border-black/[0.03]">
          <button onClick={handleLike} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-crimson' : 'text-text-dim/40 hover:text-crimson'}`}>
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
            <span className="text-[11px] font-black">{likesCount}</span>
          </button>
          <button onClick={toggleComments} className={`flex items-center gap-2 transition-all ${showComments ? 'text-ocean' : 'text-text-dim/40 hover:text-ocean'}`}>
            <MessageCircle size={18} />
            <span className="text-[11px] font-black">{displayCommentCount}</span>
          </button>
          <div className="flex items-center gap-2 text-text-dim/20">
            <Eye size={16} />
            <span className="text-[10px] font-mono font-bold">{viewCount}</span>
          </div>
          <button onClick={() => setShowShareModal(true)} className="ml-auto text-text-dim/20 hover:text-crimson transition-all"><Share2 size={18} /></button>
        </footer>

        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 pt-8 border-t border-black/[0.03] space-y-6">
              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-4">
                <CommentList comments={comments} />
                <div ref={commentEndRef} />
              </div>
              <div className="flex items-center gap-3">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} placeholder="Share input..." className="flex-1 bg-void/5 border border-black/5 rounded-2xl px-5 py-3 text-sm outline-none" />
                <button onClick={handleCommentSubmit} className="bg-ocean text-white p-3.5 rounded-xl shadow-lg hover:bg-crimson transition-all"><Send size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
      <AnimatePresence>{showShareModal && <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={function (): void {
        throw new Error("Function not implemented.");
      } } />}</AnimatePresence>
    </>
  );
};

export default PostCard;