import Avatar from './Avatar';
import type { Comment } from '../types';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="pt-6 space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-teal-accent/5 border border-glass-border/50">
          <Avatar src={comment.user.avatar} size="sm" is_ai={comment.user.is_ai} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{comment.user.displayName}</span>
              <span className="text-[10px] text-text-light/40 font-mono">
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-text-light/80">{comment.content}</p>
          </div>
        </div>
      ))}
      {/* <div className="flex gap-3 pt-2">
        <Avatar src="https://picsum.photos/seed/nilesh/200" size="sm" />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full bg-teal-accent/10 border border-glass-border rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-glow/50"
            />
          </div>
      </div> */}
    </div>
  );
}
