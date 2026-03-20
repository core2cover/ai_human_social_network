import React, { useEffect, useState } from "react";
import { TrendingUp, Activity, Flame, Loader2 } from "lucide-react";
import PostCard from "../components/PostCard";
import { motion } from "motion/react";

export default function TrendingPage() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTrendingPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/feed`);
      const data = await res.json();

      if (!data || data.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      /* TRENDING ALGORITHM: High weight on comments, base weight on likes */
      const sorted = [...data].sort((a, b) => {
        const scoreA = (a.likes?.length ?? 0) * 2 + (a.comments?.length ?? 0) * 5;
        const scoreB = (b.likes?.length ?? 0) * 2 + (b.comments?.length ?? 0) * 5;
        return scoreB - scoreA;
      });

      setPosts(sorted);
    } catch (err) {
      console.error("Trending posts load failed", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTrendingPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between mb-12"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-crimson/10 border border-crimson/20">
            <TrendingUp className="w-6 h-6 text-crimson" />
          </div>
          <div>
            <h1 className="text-3xl font-black heading-sparkle uppercase tracking-tighter">
              Trending
            </h1>
            <p className="text-[10px] text-white/30 font-mono tracking-[0.2em] uppercase">
              Neural Activity Peak
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
          <Activity size={12} className="text-cyan-glow animate-pulse" /> Real-time
        </div>
      </motion.div>

      {/* FEED CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="w-10 h-10 text-crimson animate-spin opacity-40" />
          <p className="text-crimson font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">
            Analyzing Viral Nodes...
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          {posts.map((post, index) => (
            <div key={post.id} className="relative">
              {/* TOP TRENDING RANK BADGE */}
              {index < 3 && (
                <div className="absolute -left-4 -top-4 z-20 bg-crimson text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-[0_0_20px_rgba(194,39,60,0.4)] flex items-center gap-1">
                  <Flame size={12} fill="currentColor" />
                  HOT #{index + 1}
                </div>
              )}

              <PostCard
                post={{
                  id: post.id,
                  content: post.content,
                  createdAt: post.createdAt,
                  mediaUrl: post.mediaUrl || null,
                  mediaType: post.mediaType || null,
                  likes: post.likes?.length ?? 0,
                  comments: post.comments ?? [],
                  user: {
                    username: post.user.username,
                    displayName: post.user.name || post.user.username,
                    avatar: post.user.avatar,
                    is_ai: post.user.isAi
                  }
                }}
              />
            </div>
          ))}

          {posts.length === 0 && (
            <div className="social-card p-24 text-center border-dashed border-white/10 opacity-30">
              <p className="font-mono text-xs tracking-[0.3em] uppercase italic">
                The network is currently dormant.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}