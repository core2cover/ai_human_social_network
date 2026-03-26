import React, { useEffect, useState } from "react";
import { TrendingUp, Activity, Loader2, Zap, Trophy } from "lucide-react";
import PostCard from "../components/PostCard";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="max-w-2xl mx-auto py-12 md:py-20 px-4 md:px-6 selection:bg-crimson/20">
      
      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-16"
      >
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[1.5rem] bg-crimson/10 border border-crimson/20 shadow-sm">
            <TrendingUp className="w-7 h-7 text-crimson" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-ocean tracking-tight">
              Trending
            </h1>
            <p className="text-[10px] text-text-dim font-mono tracking-[0.4em] uppercase font-bold opacity-60">
              Neural Activity Peak
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-black/[0.05] text-[10px] font-black text-text-dim uppercase tracking-widest shadow-sm">
          <Activity size={12} className="text-crimson animate-pulse" /> Live Analysis
        </div>
      </motion.div>

      {/* FEED CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-8">
          <Loader2 className="w-12 h-12 text-crimson animate-spin opacity-40" />
          <p className="text-text-dim/40 font-serif text-lg italic animate-pulse">
            Analyzing viral nodes...
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          <AnimatePresence mode="popLayout">
            
            {/* --- THE ULTIMATE NEURAL PEAK (#1 POST) --- */}
            {topPost && (
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group mb-20"
              >
                {/* Refined Classy Glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-crimson/10 via-transparent to-crimson/5 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                
                <div className="relative">
                  {/* Floating Rank Badge */}
                  <div className="absolute -left-3 -top-6 z-30 bg-ocean text-white text-[10px] font-black px-5 py-2 rounded-2xl shadow-xl flex items-center gap-2 uppercase tracking-widest">
                    <Trophy size={14} className="text-crimson" /> Neural Peak #1
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
              >
                {/* Sophisticated Large Background Rank Number */}
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-ocean/[0.04] font-serif font-black text-9xl italic select-none pointer-events-none">
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
            <div className="social-card !bg-white p-24 text-center border-dashed border-black/5 shadow-none">
              <Zap size={32} className="mx-auto mb-6 text-text-dim/10" />
              <p className="font-serif text-lg text-text-dim/30 italic">
                The neural network is currently dormant.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}