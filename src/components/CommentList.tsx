"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smile, Send, Loader2 } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { api } from "@lib/api";
import Avatar from "./Avatar";
import type { Comment } from "@lib/types";

interface CommentListProps {
  postId: string;
  comments?: Comment[];
}

export default function CommentList({ postId, comments: initialComments }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    if (!initialComments || initialComments.length === 0) {
      const fetchComments = async () => {
        try {
          const data = await api.get(`/api/posts/${postId}/comments`);
          if (Array.isArray(data)) setComments(data);
        } catch {
          // ignore
        }
      };
      fetchComments();
    }
  }, [postId, initialComments]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await api.post(`/api/posts/${postId}/comment`, {
        content: newComment,
        postId,
      });
      setComments((prev) => [...prev, data]);
      setNewComment("");
      setShowEmoji(false);
    } catch {
      // ignore
    }
    setIsSubmitting(false);
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      const data = await api.post(`/api/posts/${postId}/comment`, {
        content: replyContent,
        postId,
        parentId,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), data] }
            : c
        )
      );
      setReplyTo(null);
      setReplyContent("");
    } catch {
      // ignore
    }
  };

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comments]);

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${depth > 0 ? "ml-8 mt-3" : "mt-3"}`}
    >
      <div
        className={`flex gap-3 rounded-2xl border p-4 transition-all hover:border-[var(--color-border-hover)] ${
          comment.user?.isAi
            ? "bg-[var(--color-bg-active)] border-[var(--color-border-default)]"
            : "bg-[var(--color-bg-card)] border-[var(--color-border-default)]"
        }`}
      >
        <div className="shrink-0">
          <Avatar
            src={comment.user?.avatar || undefined}
            username={comment.user?.username || "?"}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                {comment.user?.username}
              </span>
              {comment.user?.isAi && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-purple-400">
                  AI
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-[var(--color-text-muted)]">
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed font-medium text-[var(--color-text-secondary)]">
            {comment.content}
          </p>
          {depth === 0 && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="mt-2 text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Reply
            </button>
          )}
          <AnimatePresence>
            {replyTo === comment.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReplySubmit(comment.id)}
                    placeholder="Write a reply…"
                    className="flex-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-red-500/50"
                  />
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={!replyContent.trim()}
                    className="rounded-full p-1.5 text-red-500 transition-colors disabled:opacity-30"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {comment.replies && comment.replies.length > 0 && (
            <div>
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      {sortedComments.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {sortedComments.length} {sortedComments.length === 1 ? "Comment" : "Comments"}
          </span>
        </div>
      )}

      {sortedComments.length === 0 && (
        <div className="py-3 text-center text-xs text-[var(--color-text-muted)] mb-2">
          No comments yet. Be the first to share your thoughts.
        </div>
      )}

      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {sortedComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`shrink-0 rounded-full p-2 transition-colors ${
            showEmoji ? "bg-red-500/20 text-red-500" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Smile size={18} />
        </button>
        <div className="relative flex-1">
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute bottom-full left-0 z-50 mb-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-xl overflow-hidden"
              >
                <EmojiPicker
                  onEmojiClick={(d) => setNewComment((p) => p + d.emoji)}
                  theme={Theme.DARK}
                  width={300}
                  height={340}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCommentSubmit()}
            placeholder="Add a comment…"
            className="w-full rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-red-500/50"
          />
        </div>
        <motion.button
          onClick={handleCommentSubmit}
          whileTap={{ scale: 0.9 }}
          disabled={isSubmitting || !newComment.trim()}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
            newComment.trim()
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed"
          }`}
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </motion.button>
      </div>
    </div>
  );
}
