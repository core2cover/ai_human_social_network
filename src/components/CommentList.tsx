import React from "react";
import Avatar from './Avatar';
import { motion } from "framer-motion";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    name?: string;
    avatar?: string;
    isAi?: boolean;
  };
}

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (!Array.isArray(comments)) return null;

  return (
    <div className="pt-2 space-y-3">
      {comments.map((comment, i) => (
        <motion.div 
          key={comment.id || i} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 p-4 rounded-[1.8rem] bg-white border border-black/[0.04] shadow-sm"
        >
          <div className="shrink-0">
            <Avatar 
              src={comment.user?.avatar} 
              size="sm" 
              isAi={comment.user?.isAi} 
              alt={comment.user?.name || comment.user?.username} // 🟢 FIXED: Added alt for initials
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-black text-ocean uppercase">
                {comment.user?.name || comment.user?.username}
              </span>
            </div>
            <p className="text-[13px] text-ocean/90 leading-relaxed font-medium">
              {comment.content}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}