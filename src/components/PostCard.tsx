"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Play,
  Trash2,
  Send,
  Eye,
  Smile,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@lib/api";
import Avatar from "./Avatar";
import CommentList from "./CommentList";
import PostShareModal from "./PostShareModal";
import type { Post, Comment } from "@lib/types";

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const currentUser = typeof window !== "undefined" ? localStorage.getItem("username") : null;

  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(Array.isArray(post.comments) ? post.comments : []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!showFullscreen) {
      setZoomLevel(1);
    }
  }, [showFullscreen]);

  const cardRef = useRef<HTMLDivElement>(null);
  const hasViewed = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwner = currentUser === post.user?.username;
  const mediaItems = post.mediaUrls || [];
  const mediaTypes = post.mediaTypes || [];
  const hasMedia = mediaItems.length > 0;
  const displayCommentCount = comments.length > 0 ? comments.length : (post._count?.comments ?? 0);

  const triggerHeartPop = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 750);
  };

  const handleLike = useCallback(async () => {
    const prev = isLiked;
    const newLiked = !prev;
    setIsLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    if (newLiked) triggerHeartPop();
    try {
      const data = await api.post(`/api/posts/${post.id}/like`);
      setIsLiked(data.liked);
      setLikesCount(data.likes ?? likesCount);
    } catch {
      setIsLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
    }
  }, [post.id, token, isLiked, likesCount]);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      try {
        const data = await api.get(`/api/posts/${post.id}/comments`);
        if (Array.isArray(data)) setComments(data);
      } catch {
        // ignore
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await api.post(`/api/posts/${post.id}/comment`, {
        content: newComment,
        postId: post.id,
      });
      setComments((p) => [...p, data]);
      setNewComment("");
      setShowEmoji(false);
    } catch {
      // ignore
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasViewed.current) {
          const t = setTimeout(async () => {
            try {
              const data = await api.post(`/api/posts/${post.id}/view`);
              if (data) {
                setViewCount(data.views);
                hasViewed.current = true;
              }
            } catch {
              // ignore
            }
          }, 2000);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.7 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id, token]);

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/posts/${post.id}`);
      onUpdate?.();
    } catch {
      // ignore
    }
  };

  const MenuDropdown = () => (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          className="absolute top-full right-0 z-10 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-xl"
        >
          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-3 px-5 py-3 text-sm text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={15} />
              Delete Post
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ActionBtn = ({
    icon,
    count,
    active,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    count?: number | string;
    active?: boolean;
    label?: string;
    onClick: (e: React.MouseEvent) => void;
  }) => (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
        active
          ? "border-[#9687F5]/40 bg-[#9687F5]/10 text-[#9687F5]"
          : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {icon}
      {(count !== undefined || label) && <span>{count ?? label}</span>}
    </motion.button>
  );

  const renderContent = () => (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-lg"
      >
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
            >
              <div className="rounded-full bg-red-500/20 p-6 backdrop-blur-sm">
                <Heart size={64} className="fill-red-500 text-red-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <Link href={`/profile/${post.user?.username}`} className="flex items-center gap-3">
            <Avatar src={post.user?.avatar || undefined} username={post.user?.username || "?"} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {post.user?.name || post.user?.username}
                </span>
                {post.user?.isAi && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-400">
                    <Cpu size={9} /> AI
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                @{post.user?.username} ·{" "}
                {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            >
              <MoreHorizontal size={20} />
            </button>
            <MenuDropdown />
          </div>
        </div>

        {hasMedia && (
          <div className="relative flex items-center justify-center bg-black">
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={() => currentMediaIndex > 0 && setCurrentMediaIndex((i) => i - 1)}
                  className={`absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-opacity ${
                    currentMediaIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    currentMediaIndex < mediaItems.length - 1 && setCurrentMediaIndex((i) => i + 1)
                  }
                  className={`absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-opacity ${
                    currentMediaIndex === mediaItems.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMediaIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex w-full cursor-zoom-in items-center justify-center"
                onClick={() => setShowFullscreen(true)}
              >
                {mediaTypes[currentMediaIndex] === "video" ? (
                  <div className="relative cursor-pointer w-full" onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsPlaying(true);
                      } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}>
                    <video
                      ref={videoRef}
                      src={mediaItems[currentMediaIndex]}
                      className="w-full max-h-[70vh] object-contain"
                      loop
                      playsInline
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="rounded-full bg-white/10 p-5 backdrop-blur-sm">
                          <Play size={36} className="fill-white text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full">
                    <Image
                      src={mediaItems[currentMediaIndex]}
                      alt="Post media"
                      width={1200}
                      height={900}
                      className="w-full h-auto max-h-[70vh] object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {mediaItems.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3">
                {mediaItems.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === currentMediaIndex ? 18 : 6,
                      opacity: i === currentMediaIndex ? 1 : 0.35,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`h-1.5 rounded-full ${
                      i === currentMediaIndex ? "bg-red-500" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {post.content && (
          <div className="px-5 py-4">
            {!hasMedia && (
              <div className="mb-3 h-0.5 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-400" />
            )}
            <p
              className={`text-sm leading-relaxed text-[var(--color-text-primary)] ${
                !isExpanded ? "line-clamp-3" : ""
              }`}
            >
              {post.content}
            </p>
            {post.content.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-xs font-semibold text-red-500"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--color-border-default)] px-5 py-3">
          <ActionBtn
            icon={
              <Heart
                size={16}
                className={isLiked ? "fill-[#9687F5] text-[#9687F5]" : "text-[var(--color-text-muted)]"}
              />
            }
            onClick={() => handleLike()}
            label={likesCount > 0 ? likesCount.toString() : ""}
          />
          <ActionBtn
            icon={<MessageCircle size={16} className={showComments ? "text-[#9687F5]" : "text-[var(--color-text-muted)]"} />}
            onClick={() => toggleComments()}
            label={displayCommentCount > 0 ? displayCommentCount.toString() : ""}
          />
          <ActionBtn
            icon={<Share2 size={16} className="text-[var(--color-text-muted)]" />}
            onClick={() => setShowShareModal(true)}
          />
          <div className="ml-auto flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <Eye size={14} />
            <span className="text-[11px] font-medium">{viewCount.toLocaleString()}</span>
          </div>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-[var(--color-border-default)]"
            >
              <CommentList postId={post.id} comments={comments} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      <AnimatePresence>
        {showShareModal && (
          <PostShareModal
            postId={post.id}
            onClose={() => setShowShareModal(false)}
            onSuccess={() => {
              setShowShareModal(false);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullscreen && hasMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          >
            <button
              className="absolute top-4 right-4 p-3 z-[10000] text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
              onClick={() => setShowFullscreen(false)}
            >
              <X size={28} />
            </button>

            {mediaTypes[currentMediaIndex] === "video" ? (
              <video
                src={mediaItems[currentMediaIndex]}
                controls
                className="max-h-[90vh] max-w-[90vw]"
                autoPlay
              />
            ) : (
              <div 
                className="relative w-full h-full flex items-center justify-center p-4"
                onClick={() => setShowFullscreen(false)}
              >
                <div 
                  className="relative flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={mediaItems[currentMediaIndex]}
                    alt="Fullscreen media"
                    width={1200}
                    height={900}
                    className="object-contain transition-transform duration-200"
                    style={{ 
                      transform: `scale(${zoomLevel})`,
                      maxHeight: zoomLevel > 1 ? "none" : "90vh",
                      maxWidth: zoomLevel > 1 ? "none" : "90vw",
                      cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel((z) => z === 1 ? 2 : 1);
                    }}
                  />
                  
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {mediaItems.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentMediaIndex(i);
                            setZoomLevel(1);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentMediaIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-xl"
          >
            Post shared!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return renderContent();
}
