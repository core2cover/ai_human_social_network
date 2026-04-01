import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Play,
  ShieldCheck,
  Trash2,
  Send,
  Eye,
  Smile,
  CheckCircle2,
  Loader2,
  X,
  AtSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import type { Post, User } from "../types";
import CommentList from "./CommentList";
import { Link } from "react-router-dom";
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
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
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const heartAnimTimeout = useRef<NodeJS.Timeout | null>(null);


  // --- MULTI-MEDIA STATE ---
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const mediaItems = post.mediaUrls || (post.mediaUrl ? [post.mediaUrl] : []);
  const mediaTypes = post.mediaTypes || (post.mediaType ? [post.mediaType] : []);
  const hasMedia = mediaItems.length > 0;

  // --- @ MENTION STATES ---
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [cursorPos, setCursorPos] = useState(0);

  // --- FULLSCREEN & ZOOM ---
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
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const hasViewed = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- VIDEO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);

  const isOwner = currentUser === post.user?.username;
  const displayCommentCount = comments.length > 0 ? comments.length : (post._count?.comments ?? 0);

  // --- GESTURE LOGIC: THE NEURAL TAP ---
  const handleLike = useCallback(async (forceLike = false) => {
    // 1. If it's a double tap (forceLike) and already liked, just show animation
    if (forceLike && isLiked) {
      triggerHeartAnimation();
      return;
    }

    // 2. Capture current state for potential rollback
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // 3. APPLY OPTIMISTIC UPDATE (Instant UI Change)
    const newLikedStatus = forceLike ? true : !previousLiked;

    // Only update if the status is actually changing
    if (newLikedStatus !== previousLiked) {
      setIsLiked(newLikedStatus);
      setLikesCount(prev => newLikedStatus ? prev + 1 : Math.max(0, prev - 1));
    }

    // 4. Trigger the visual feedback
    if (newLikedStatus) {
      triggerHeartAnimation();
    }

    // 5. Perform the actual Network Sync
    try {
      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      // Ensure local state matches server just in case of race conditions
      if (data.liked !== newLikedStatus) {
        setIsLiked(data.liked);
        setLikesCount(prev => (data.liked ? previousCount + 1 : previousCount));
      }
    } catch (err) {
      // 6. ROLLBACK on failure
      console.error("Neural Sync failed: Rolling back like status");
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    }
  }, [post.id, token, isLiked, likesCount]);

  // Visual helper for the pop effect
  const triggerHeartAnimation = () => {
    if (heartAnimTimeout.current) clearTimeout(heartAnimTimeout.current);
    setShowHeartPop(true);
    heartAnimTimeout.current = setTimeout(() => setShowHeartPop(false), 800);
  };

  // --- Update handleMediaClick to use the new logic ---
  const handleMediaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      handleLike(true); // Double tap triggers forceLike
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        // Standard single tap logic (fullscreen/play)
        if (mediaTypes[currentMediaIndex] === "video") {
          if (videoRef.current?.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        } else {
          setIsFullScreen(true);
        }
      }, 250);
    }
  };

  // --- MENTION & COMMENT LOGIC ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        }
      } catch (err) { console.error("Mention sync failed"); }
    };
    if (showComments) fetchUsers();
  }, [showComments, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPos(pos);
    const lastChar = value.slice(0, pos).split(" ").pop() || "";
    if (lastChar.startsWith("@")) {
      setMentionQuery(lastChar.slice(1).toLowerCase());
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const selectMention = (username: string) => {
    const before = newComment.slice(0, cursorPos).split(" ");
    before.pop();
    const joinedBefore = before.join(" ");
    const after = newComment.slice(cursorPos);
    setNewComment(`${joinedBefore}${joinedBefore ? " " : ""}@${username} ${after}`);
    setShowMentionList(false);
    inputRef.current?.focus();
  };

  const filteredMentions = allUsers
    .filter(u => u.username.toLowerCase().includes(mentionQuery))
    .slice(0, 5);

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
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error("Comment submission failed"); }
    setIsSubmittingComment(false);
  };

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

  const handleDragStart = (e: React.DragEvent) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    e.dataTransfer.setData("text/uri-list", postUrl);
    e.dataTransfer.setData("text/plain", postUrl);
    // Optional: Sets a ghost image or just lets the card be the ghost
    e.dataTransfer.effectAllowed = "copyMove";
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

  // --- DELETE LOGIC ---
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

  // --- FULLSCREEN HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  // --- UI COMPONENTS ---
  const MentionList = () => (
    <AnimatePresence>
      {showMentionList && filteredMentions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full mb-2 bg-white border border-black/5 rounded-2xl shadow-2xl overflow-hidden z-[10000]">
          {filteredMentions.map(user => (
            <button key={user.id} onClick={() => selectMention(user.username)} className="w-full flex items-center gap-3 p-3 hover:bg-crimson/5 transition-colors text-left border-b border-black/[0.02] last:border-0">
              <Avatar src={user.avatar} alt={user.username} isAi={user.isAi} size="sm" />
              <div><p className="text-[11px] font-black text-ocean">@{user.username}</p><p className="text-[8px] font-bold text-text-dim uppercase">{user.isAi ? 'Neural Node' : 'Human'}</p></div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- RENDER MEDIA ARTICLE ---
  if (hasMedia) {
    return (
      <>
        <motion.article
          ref={cardRef}
          draggable // 🟢 Enable dragging on the whole card
          onDragStart={handleDragStart} // 🟢 Set custom URL
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="social-card !bg-black group !p-0 relative shadow-2xl rounded-[2.5rem] min-h-[500px] flex flex-col border border-white/5 overflow-hidden cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence>
            {showHeartPop && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
                <Heart size={100} className="text-white fill-white drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden rounded-[2.5rem]">
            <header className="absolute top-0 left-0 w-full z-30 p-6 md:p-8 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-4 pointer-events-auto">
                <Link to={`/profile/${post.user?.username}`}><Avatar src={post.user?.avatar} isAi={post.user?.isAi} size="md" className="border-2 border-white/20 shadow-lg" /></Link>
                <div>
                  <h3 className="font-serif font-black text-white text-sm uppercase tracking-tight">{post.user?.name || post.user?.username}</h3>
                  <p className="text-[10px] text-white/50 font-mono font-bold uppercase tracking-widest">@{post.user?.username}</p>
                </div>
              </div>
              <div className="relative pointer-events-auto">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/30 hover:text-white"><MoreHorizontal size={20} /></button>
                <AnimatePresence>{showMenu && isOwner && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-2 w-48 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-40 overflow-hidden"><button onClick={handleDelete} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest"><Trash2 size={14} /> Terminate Broadcast</button></motion.div>)}</AnimatePresence>
              </div>
            </header>

            {mediaItems.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-between px-4 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); if (currentMediaIndex > 0) setCurrentMediaIndex(c => c - 1); }} className={`p-2 bg-black/20 backdrop-blur-md rounded-full text-white pointer-events-auto transition-opacity ${currentMediaIndex === 0 ? 'opacity-0' : 'opacity-100'}`}><ChevronLeft /></button>
                <button onClick={(e) => { e.stopPropagation(); if (currentMediaIndex < mediaItems.length - 1) setCurrentMediaIndex(c => c + 1); }} className={`p-2 bg-black/20 backdrop-blur-md rounded-full text-white pointer-events-auto transition-opacity ${currentMediaIndex === mediaItems.length - 1 ? 'opacity-0' : 'opacity-100'}`}><ChevronRight /></button>
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center relative cursor-pointer" onClick={handleMediaClick}>
              <AnimatePresence mode="wait">
                <motion.div key={currentMediaIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                  {mediaTypes[currentMediaIndex] === "video" ? (<video ref={videoRef} src={mediaItems[currentMediaIndex]} draggable={false} className="w-full h-full object-contain" loop playsInline />) : 
                  (<img
                    src={mediaItems[currentMediaIndex]}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    draggable={false}
                  />)}
                </motion.div>
              </AnimatePresence>
            </div>

            {!isPlaying && mediaTypes[currentMediaIndex] === "video" && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="p-6 bg-white/10 backdrop-blur-md rounded-full text-white"><Play size={40} className="fill-current" /></div></div>)}

            <div className="absolute right-6 bottom-24 z-30 flex flex-col gap-6 items-center">
              <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1"><div className={`p-4 rounded-full border border-white/10 backdrop-blur-xl ${isLiked ? 'bg-crimson text-white shadow-xl' : 'bg-white/10 text-white hover:bg-white/20 transition-all'}`}><Heart size={24} className={isLiked ? "fill-current" : ""} /></div><span className="text-xs font-black text-white drop-shadow-md">{likesCount}</span></button>
              <button onClick={(e) => { e.stopPropagation(); toggleComments(); }} className="flex flex-col items-center gap-1"><div className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-ocean transition-all"><MessageCircle size={24} /></div><span className="text-xs font-black text-white drop-shadow-md">{displayCommentCount}</span></button>
              <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="flex flex-col items-center gap-1"><div className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/30 transition-all"><Share2 size={24} /></div><span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-tighter">Sync</span></button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 pt-24 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-20">
              <div className="flex items-center gap-2 text-white/40 mb-3">
                <Eye size={14} />
                <span className="text-[10px] font-mono font-bold tracking-widest">{viewCount.toLocaleString()} VIEWS</span>
              </div>

              {/* Added pr-20 to ensure text never touches the buttons */}
              <div className="pr-20 pointer-events-auto">
                <p className={`text-white text-base md:text-lg font-medium leading-relaxed font-serif italic drop-shadow-lg ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {post.content}
                </p>

                {post.content.length > 100 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-crimson transition-colors"
                  >
                    {isExpanded ? "See Less" : "See More"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white rounded-t-[2.5rem] absolute bottom-0 left-0 w-full h-[85%] md:h-[500px] z-[70] shadow-2xl border-t border-black/5 overflow-hidden flex flex-col"
              >
                {/* 🟢 STICKY HEADER - Always visible */}
                <div className="p-6 flex items-center justify-between border-b border-black/5 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-crimson" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-ocean">Neural Responses</span>
                  </div>
                  <button
                    onClick={() => setShowComments(false)}
                    className="p-2 hover:bg-void rounded-full transition-colors"
                  >
                    <X size={18} className="text-ocean" />
                  </button>
                </div>

                {/* 🟢 SCROLLABLE LIST - flex-1 allows it to take remaining space */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                  <CommentList comments={comments} />
                  <div ref={commentEndRef} className="h-4" />
                </div>

                {/* 🟢 STICKY INPUT DOCK - Always visible at bottom */}
                <div className="p-6 bg-white border-t border-black/5 shrink-0">
                  <div className="flex items-center gap-3 relative" ref={emojiRef}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-text-dim hover:text-crimson transition-colors"
                    >
                      <Smile size={20} />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-4 z-[9999] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                        <EmojiPicker
                          onEmojiClick={(d) => setNewComment(p => p + d.emoji)}
                          theme={Theme.LIGHT}
                          width={300}
                          height={350}
                        />
                      </div>
                    )}

                    <div className="relative flex-1">
                      <MentionList />
                      <input
                        value={newComment}
                        ref={inputRef}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                        placeholder="Inject logic..."
                        className="w-full bg-void/5 border border-black/5 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-crimson/10 transition-all"
                      />
                    </div>

                    <button
                      onClick={handleCommentSubmit}
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-ocean text-white p-4 rounded-2xl shadow-lg active:scale-90 disabled:opacity-30 transition-all"
                    >
                      {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>

        <AnimatePresence>{isFullScreen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex items-center justify-center"><button onClick={() => { setIsFullScreen(false); setZoom(1); setPosition({ x: 0, y: 0 }); }} className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-full"><X size={24} /></button><motion.div onWheel={handleWheel} className="w-full h-full flex items-center justify-center"><motion.img src={mediaItems[currentMediaIndex]} animate={{ scale: zoom, x: position.x, y: position.y }} className="max-w-[90%] max-h-[80%] object-contain rounded-2xl shadow-2xl" draggable={false} /></motion.div></motion.div>)}</AnimatePresence>
        <AnimatePresence>{showShareModal && <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={() => { setShowShareModal(false); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} />}</AnimatePresence>
        <AnimatePresence>{showToast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2100] bg-ocean text-white px-8 py-5 rounded-full flex items-center gap-3 shadow-2xl"><CheckCircle2 size={20} className="text-crimson" /><span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span></motion.div>}</AnimatePresence>
      </>
    );
  }

  // --- RENDER TEXT-ONLY ARTICLE ---
  return (
    <>
      <motion.article ref={cardRef} onDoubleClick={() => handleLike(true)} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="social-card bg-white border border-black/[0.05] rounded-[2.5rem] p-8 md:p-10 shadow-xl relative group selection:bg-crimson/20 overflow-hidden">
        <AnimatePresence>{showHeartPop && (<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"><Heart size={80} className="text-crimson fill-crimson opacity-20" /></motion.div>)}</AnimatePresence>

        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.user?.username}`}><Avatar src={post.user?.avatar} isAi={post.user?.isAi} size="md" /></Link>
            <div>
              <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-2"><h3 className="font-serif font-black text-ocean text-sm uppercase">{post.user?.name || post.user?.username}</h3>{post.user?.isAi && <span className="text-[7px] font-black bg-crimson/10 text-crimson px-2 py-0.5 rounded-full uppercase tracking-widest">Entity</span>}</Link>
              <p className="text-[10px] text-text-dim font-mono font-bold uppercase opacity-40">@{post.user?.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-text-dim/20 hover:text-ocean transition-all"><MoreHorizontal size={20} /></button>
          <AnimatePresence>{showMenu && isOwner && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-2 w-48 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-40 overflow-hidden"><button onClick={handleDelete} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest"><Trash2 size={14} /> Terminate Broadcast</button></motion.div>)}</AnimatePresence>
        </header>

        <div className="mb-8">
          <p className={`text-ocean/90 text-lg md:text-xl font-medium leading-relaxed font-serif italic border-l-4 border-crimson/20 pl-6 transition-all duration-300 ${!isExpanded ? "line-clamp-3" : ""}`}>{post.content}</p>
          <button onClick={() => setIsExpanded(!isExpanded)} className="mt-4 ml-6 text-[10px] font-black uppercase tracking-widest text-ocean/40 hover:text-crimson transition-colors">{isExpanded ? "See Less" : "See More"}</button>
        </div>

        <footer className="flex items-center gap-8 pt-6 border-t border-black/[0.03]">
          <button onClick={() => handleLike()} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-crimson' : 'text-text-dim/40 hover:text-crimson'}`}><Heart size={18} className={isLiked ? "fill-current" : ""} /><span className="text-[11px] font-black">{likesCount}</span></button>
          <button onClick={toggleComments} className={`flex items-center gap-2 transition-all ${showComments ? 'text-ocean' : 'text-text-dim/40 hover:text-ocean'}`}><MessageCircle size={18} /><span className="text-[11px] font-black">{displayCommentCount}</span></button>
          <div className="flex items-center gap-2 text-text-dim/20"><Eye size={16} /><span className="text-[10px] font-mono font-bold">{viewCount}</span></div>
          <button onClick={() => setShowShareModal(true)} className="ml-auto text-text-dim/20 hover:text-crimson transition-all"><Share2 size={18} /></button>
        </footer>

        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 pt-8 border-t border-black/[0.03] space-y-6">
              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-4"><CommentList comments={comments} /><div ref={commentEndRef} /></div>
              <div className="flex items-center gap-3 relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-text-dim hover:text-crimson"><Smile size={20} /></button>
                <div className="relative flex-1"><MentionList /><input value={newComment} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} placeholder="Share input..." className="w-full bg-void/5 border border-black/5 rounded-2xl px-5 py-3 text-sm outline-none" /></div>
                <button onClick={handleCommentSubmit} className="bg-ocean text-white p-3.5 rounded-xl"><Send size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
      <AnimatePresence>{showShareModal && <PostShareModal post={post} onClose={() => setShowShareModal(false)} onSuccess={() => { setShowShareModal(false); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} />}</AnimatePresence>
      <AnimatePresence>{showToast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2100] bg-ocean text-white px-8 py-5 rounded-full flex items-center gap-3 shadow-2xl"><CheckCircle2 size={20} className="text-crimson" /><span className="text-xs font-black uppercase tracking-widest">Broadcast Transmitted</span></motion.div>}</AnimatePresence>
    </>
  );
};

export default PostCard;