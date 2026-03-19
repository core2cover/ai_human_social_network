import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Avatar from "./Avatar";
import type { Post } from "../types";
import CommentList from "./CommentList";
import { Link } from "react-router-dom";

interface PostCardProps {
  post: Post;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PostCard: React.FC<PostCardProps> = ({ post }) => {

  const token = localStorage.getItem("token");
  const currentUser = localStorage.getItem("username");

  const [showMenu, setShowMenu] = useState(false);

  const [isLiked, setIsLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [showComments, setShowComments] = useState(false);

  const [comments, setComments] = useState(post.comments ?? []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const isOwner = currentUser === post.user?.username;

  // ===============================
  // VIDEO CONTROLS
  // ===============================

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

  // ===============================
  // LIKE POST
  // ===============================

  const handleLike = async () => {

    try {

      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  // ===============================
  // COMMENT POST
  // ===============================

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
          content: newComment
        })
      });

      const comment = await res.json();

      setComments(prev => [...prev, comment]);
      setNewComment("");

    } catch (err) {
      console.error("Comment failed", err);
    }

    setIsSubmittingComment(false);

  };

  // ===============================
  // SHARE POST
  // ===============================

  const handleShare = async () => {

    const url = `${window.location.origin}/post/${post.id}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Post link copied!");
    } catch {
      console.log("Share failed");
    }

  };

  // ===============================
  // DELETE POST
  // ===============================

  const handleDelete = async () => {

    if (!confirm("Delete this post?")) return;

    try {

      const res = await fetch(`${API}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        window.location.reload();
      }

    } catch (err) {
      console.error("Delete failed", err);
    }

  };

  return (

    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6 hover:shadow-cyan-glow/10 transition-all duration-500"
    >

      {/* HEADER */}

      <header className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-3">

          <Link to={`/profile/${post.user?.username}`}>
            <Avatar
              src={post.user?.avatar}
              alt={post.user?.displayName || "User"}
              is_ai={post.user?.is_ai}
            />
          </Link>

          <div>

            <Link to={`/profile/${post.user?.username}`}>
              <h3 className="font-bold text-text-light hover:text-cyan-glow transition-colors cursor-pointer">
                {post.user?.displayName || post.user?.username}
              </h3>
            </Link>

            <p className="text-xs text-text-light/50 font-mono">
              @{post.user?.username} •{" "}
              {new Date(post.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>

          </div>

        </div>

        {/* THREE DOT MENU */}

        <div className="relative">

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-teal-accent/20 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-text-light/50" />
          </button>

          {showMenu && isOwner && (

            <div className="absolute right-0 mt-2 w-40 glass-card border border-glass-border rounded-lg shadow-lg z-20">

              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete Post
              </button>

            </div>

          )}

        </div>

      </header>

      {/* CONTENT */}

      <div className="mb-4">
        <p className="text-text-light/90 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* MEDIA */}

      {post.mediaUrl && (

        <div className="mb-4 rounded-xl overflow-hidden border border-glass-border shadow-inner relative">

          {post.mediaType === "video" ? (

            <>
              <video
                ref={videoRef}
                src={post.mediaUrl}
                className="w-full max-h-[600px] object-contain bg-black"
              />

              <div className="absolute bottom-3 left-3 flex gap-3 bg-black/50 backdrop-blur px-3 py-2 rounded-lg">

                <button onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>

                <button onClick={toggleMute}>
                  {muted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

              </div>

            </>

          ) : (

            <img
              src={post.mediaUrl}
              alt="Post content"
              className="w-full object-cover max-h-[500px]"
              referrerPolicy="no-referrer"
            />

          )}

        </div>

      )}

      {/* ACTIONS */}

      <footer className="flex items-center gap-6 pt-4 border-t border-glass-border">

        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-all hover:scale-110 ${isLiked
            ? "text-red-400"
            : "text-text-light/60 hover:text-red-400"
            }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-mono">{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-text-light/60 hover:text-cyan-glow transition-all hover:scale-110"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-mono">{comments.length}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-text-light/60 hover:text-cyan-glow transition-all hover:scale-110"
        >
          <Share2 className="w-5 h-5" />
        </button>

      </footer>

      {/* COMMENTS */}

      <AnimatePresence>

        {showComments && (

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >

            <CommentList comments={comments} />

            <div className="flex gap-2 mt-4">

              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-background/50 border border-glass-border rounded-lg px-3 py-2 text-sm"
              />

              <button
                disabled={isSubmittingComment}
                onClick={handleCommentSubmit}
                className="btn-primary px-4 py-2 text-sm"
              >
                Post
              </button>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </motion.article>

  );

};

export default PostCard;