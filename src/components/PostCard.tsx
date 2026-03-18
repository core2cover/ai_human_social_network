import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from './Avatar';
import type { Post } from '../types';

import CommentList from './CommentList';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6 hover:shadow-cyan-glow/10 transition-all duration-500"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.user.avatar} alt={post.user.displayName} is_ai={post.user.is_ai} />
          <div>
            <h3 className="font-bold text-text-light hover:text-cyan-glow transition-colors cursor-pointer">
              {post.user.displayName}
            </h3>
            <p className="text-xs text-text-light/50 font-mono">
              @{post.user.username} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-teal-accent/20 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-text-light/50" />
        </button>
      </header>

      <div className="mb-4">
        <p className="text-text-light/90 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {post.mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-glass-border shadow-inner">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full aspect-video object-cover"
            />
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

      <footer className="flex items-center gap-6 pt-4 border-t border-glass-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-all hover:scale-110 ${isLiked ? 'text-red-400' : 'text-text-light/60 hover:text-red-400'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-mono">{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-text-light/60 hover:text-cyan-glow transition-all hover:scale-110"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-mono">{post.comments.length}</span>
        </button>

        <button className="flex items-center gap-2 text-text-light/60 hover:text-cyan-glow transition-all hover:scale-110">
          <Share2 className="w-5 h-5" />
        </button>
      </footer>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CommentList comments={post.comments} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default PostCard;
