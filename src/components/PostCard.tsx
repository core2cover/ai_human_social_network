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
  Loader2
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

  // --- STATE ---
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(
    Array.isArray(post.comments) ? post.comments : []
  );
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // --- SHARE STATE ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- REFS ---
  const cardRef = useRef<HTMLDivElement>(null);
  const hasViewed = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- VIDEO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const isOwner = currentUser === post.user?.username;

  const displayCommentCount = comments.length > 0
    ? comments.length
    : (post._count?.comments ?? 0);

  // --- HANDLERS ---
  const onEmojiClick = (emojiData: any) => {
    setNewComment((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      try {
        const res = await fetch(`${API}/api/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 🛑 CRITICAL: Check if response is actually JSON/OK
        if (!res.ok) {
          console.error(`Neural link failed with status: ${res.status}`);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) setComments(data);
      } catch (err) {
        console.error("Failed to sync comments", err);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.liked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      } else {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          postId: post.id
        })
      });

      if (!res.ok) return;

      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setNewComment("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Comment failed", err);
    }
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
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // --- VIEW TRACKING ---
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
            } catch (err) {
              console.error("View tracking failed");
            }
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
                <Avatar
                  src={post.user?.avatar}
                  alt={post.user?.displayName || "User"}
                  is_ai={post.user?.is_ai}
                />
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
                    <span className="text-[8px] font-black bg-cyan-glow/10 text-cyan-glow px-1.5 py-0.5 rounded border border-cyan-glow/20 tracking-widest uppercase">
                      Agent
                    </span>
                  )}
                </Link>
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-tighter">
                  @{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showMenu && isOwner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 mt-2 w-48 bg-void/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                  >
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-crimson hover:bg-crimson/10 transition-colors uppercase tracking-widest"
                    >
                      <Trash2 size={14} /> Terminate Post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* CONTENT */}
          <div className="mb-4 mt-2 px-1 border-b border-white/5 pb-6">
            <p className="post-body-text text-white/90 font-medium leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* MEDIA SECTION */}
          {post.mediaUrl && (
            <div className="mb-6 rounded-[2rem] overflow-hidden border border-white/5 bg-void relative group/media">
              {post.mediaType === "video" ? (
                <div className="relative aspect-video flex items-center justify-center bg-black/20">
                  <video
                    ref={videoRef}
                    src={post.mediaUrl}
                    className="w-full max-h-[600px] object-contain"
                    onClick={togglePlay}
                    loop
                    playsInline
                  />
                  {/* PLAY OVERLAY */}
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-void/20 pointer-events-none"
                      >
                        <div className="p-5 bg-cyan-glow/20 backdrop-blur-md rounded-full border border-cyan-glow/40 shadow-[0_0_20px_rgba(39,194,238,0.3)]">
                          <Play className="text-cyan-glow fill-cyan-glow w-6 h-6 ml-1" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* VIDEO CONTROLS */}
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                    <button onClick={toggleMute} className="p-2.5 bg-void/60 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-cyan-glow hover:text-void transition-all">
                      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={post.mediaUrl}
                  alt="Broadcast visualization"
                  className="w-full object-cover max-h-[550px]"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* ACTIONS */}
          <footer className="flex items-center gap-8 pt-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${isLiked ? "text-crimson" : "text-white/20 hover:text-crimson"}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-[11px] font-bold">{likesCount}</span>
            </button>

            <button
              onClick={toggleComments} // <--- CHANGE THIS from setShowComments(!showComments)
              className={`flex items-center gap-2 transition-colors ${showComments ? "text-cyan-glow" : "text-white/20 hover:text-cyan-glow"}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-[11px] font-bold">{displayCommentCount}</span>
            </button>

            <div className="flex items-center gap-2 text-white/10 group-hover:text-white/30 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-[11px] font-bold font-mono tracking-tighter">
                {viewCount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 text-white/20 hover:text-cyan-glow ml-auto transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </footer>
        </div>

        {/* COMMENTS SECTION */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onAnimationComplete={() => {
                const el = document.getElementById(`comments-${post.id}`);
                if (el) el.style.overflow = "visible";
              }}
              id={`comments-${post.id}`}
              className="bg-white/[0.01] border-t border-white/5"
              style={{ overflow: "hidden" }}
            >
              <div className="p-6">
                {comments.length === 0 && displayCommentCount > 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-cyan-glow animate-spin opacity-20" />
                  </div>
                ) : (
                  <CommentList comments={comments} />
                )}
                <div className="flex items-center gap-3 mt-6 relative">
                  <div className="flex-1 relative flex items-center">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Neural response..."
                      className="w-full bg-void/50 border border-white/5 rounded-2xl px-5 py-3 pr-12 text-sm font-mono text-cyan-glow placeholder:text-white/10 focus:outline-none focus:border-cyan-glow/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute right-4 transition-colors ${showEmojiPicker ? 'text-cyan-glow' : 'text-white/20 hover:text-cyan-glow'}`}
                    >
                      <Smile size={18} />
                    </button>

                    {/* EMOJI PICKER POPUP */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-[calc(100%+10px)] right-0 z-[100] shadow-2xl"
                        >
                          <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={onEmojiClick}
                            skinTonesDisabled
                            searchDisabled
                            height={350}
                            width={280}
                            lazyLoadEmojis={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    disabled={isSubmittingComment || !newComment.trim()}
                    onClick={handleCommentSubmit}
                    className="btn-action !py-3 !px-5 flex items-center gap-2 disabled:opacity-20 h-[46px]"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* SEARCHABLE SHARE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <PostShareModal
            post={post}
            onClose={() => setShowShareModal(false)}
            onSuccess={() => {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }}
          />
        )}
      </AnimatePresence>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[1100] bg-cyan-glow text-void px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(39,194,238,0.4)]"
          >
            <CheckCircle2 size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostCard;