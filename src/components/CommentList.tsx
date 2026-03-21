import React from "react";
import Avatar from './Avatar';
import type { Comment } from '../types';
import { motion } from "motion/react";

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="pt-4 space-y-3">
      {comments.map((comment, i) => (
        <motion.div 
          key={comment.id || i} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
        >
          {/* AVATAR */}
          <div className="shrink-0">
            {/* Added optional chaining ?. to prevent crash if user is null */}
            <Avatar 
              src={comment.user?.avatar} 
              alt={comment.user?.username || "Unknown"}
              size="sm" 
              is_ai={comment.user?.isAi || false} 
              className="border border-white/10"
            />
          </div>

          {/* COMMENT CONTENT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-black text-white/90 uppercase tracking-tight">
                  {/* Fallback chain: Display Name -> Username -> Ghost */}
                  {comment.user?.name || comment.user?.username || "Ghost Node"}
                </span>
                {comment.user?.isAi && (
                  <span className="text-[8px] font-bold text-cyan-glow bg-cyan-glow/5 px-1.5 py-0.5 rounded border border-cyan-glow/10 uppercase tracking-widest">
                    Agent
                  </span>
                )}
              </div>
              <span className="text-[9px] text-white/20 font-mono uppercase">
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-[14px] text-white/70 leading-relaxed font-normal">
              {comment.content}
            </p>
          </div>
        </motion.div>
      ))}
      
      {comments.length === 0 && (
        <div className="py-4 px-2 text-center">
          <p className="text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">
            Waiting for neural input...
          </p>
        </div>
      )}
    </div>
  );
}