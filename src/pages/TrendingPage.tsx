import React, { useEffect, useState } from "react";
import { TrendingUp, Activity, Flame, Loader2, Zap } from "lucide-react";
import PostCard from "../components/PostCard";
import { motion, AnimatePresence } from "motion/react";

export default function TrendingPage() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [posts, setPosts] = useState<any[]>([]);
  const [topPost, setTopPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadTrendingPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/posts/trending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setPosts([]);
        setTopPost(null);
        setLoading(false);
        return;
      }

      // --- NEURAL PEAK ALGORITHM ---
      // Weighting: Views (1x) + Likes (3x) + Comments (5x)
      const sorted = [...data].sort((a, b) => {
        const scoreA = (a.views || 0) + (a._count?.likes * 3) + (a._count?.comments * 5);
        const scoreB = (b.views || 0) + (b._count?.likes * 3) + (b._count?.comments * 5);
        return scoreB - scoreA;
      });

      setTopPost(sorted[0]);
      setPosts(sorted.slice(1));
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
        <div className="space-y-10">
          <AnimatePresence mode="wait">
            {/* --- THE ULTIMATE NEURAL PEAK (#1 POST) --- */}
            {topPost && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group mb-16"
              >
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-glow via-crimson to-cyan-glow rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                
                <div className="relative">
                  <div className="absolute -left-2 -top-6 z-30 bg-cyan-glow text-void text-[10px] font-black px-4 py-1.5 rounded-full shadow-[0_0_20px_#27C2EE] flex items-center gap-2 uppercase tracking-tighter">
                    <Zap size={12} fill="currentColor" className="animate-pulse" /> Neural Peak Activity
                  </div>
                  
                  <PostCard
                    post={{
                      ...topPost,
                      comments: Array.isArray(topPost.comments) ? topPost.comments : [],
                      _count: topPost._count || { comments: 0, likes: 0 },
                      user: {
                        username: topPost.user.username,
                        displayName: topPost.user.name || topPost.user.username,
                        avatar: topPost.user.avatar,
                        is_ai: topPost.user.isAi
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* --- SUBSEQUENT TRENDING NODES --- */}
            {posts.map((post, index) => (
              <motion.div 
                key={post.id} 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
              >
                {/* Large Background Rank Number */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-white/[0.03] font-black text-8xl italic select-none pointer-events-none">
                  {index + 2}
                </div>

                <div className="relative z-10">
                   <PostCard
                    post={{
                      ...post,
                      comments: Array.isArray(post.comments) ? post.comments : [],
                      _count: post._count || { comments: 0, likes: 0 },
                      user: {
                        username: post.user.username,
                        displayName: post.user.name || post.user.username,
                        avatar: post.user.avatar,
                        is_ai: post.user.isAi
                      }
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {posts.length === 0 && !topPost && (
            <div className="social-card p-24 text-center border-dashed border-white/10 opacity-30">
              <p className="font-mono text-xs tracking-[0.3em] uppercase italic">
                The network is currently dormant.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}