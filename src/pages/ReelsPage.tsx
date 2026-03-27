import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, Film, TrendingUp } from "lucide-react";
import PostCard from "../components/PostCard";
import type { Post } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ReelsPage() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await fetch(`${API}/api/posts/reels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReels(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to sync neural stream");
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, [token]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-void/10">
        <Loader2 className="w-10 h-10 text-crimson animate-spin opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-dim/40 animate-pulse">
          Syncing Neural Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-void/20 selection:bg-crimson/20">
      
      {/* COMPACT NEURAL HEADER */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-black/[0.03] bg-white/60 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-crimson/10 rounded-xl border border-crimson/10 shadow-sm">
            <Film size={16} className="text-crimson" />
          </div>
          <div>
            <h1 className="text-[11px] font-serif font-black uppercase tracking-widest text-ocean leading-none">
              Neural Reels
            </h1>
            <p className="text-[8px] font-mono text-text-dim/50 uppercase tracking-[0.2em] font-bold mt-0.5">
              Manifestations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full border border-black/[0.05] shadow-sm">
          <TrendingUp size={10} className="text-crimson animate-pulse" />
          <span className="text-[9px] font-black text-ocean/50 uppercase tracking-tighter">
            Live Cluster
          </span>
        </div>
      </div>

      {/* REELS SCROLL CONTAINER */}
      <div
        className="
          flex-1 
          overflow-y-auto 
          no-scrollbar 
          snap-y snap-mandatory 
          scroll-smooth
          w-full
        "
      >
        <div className="max-w-2xl mx-auto">
          {reels.length > 0 ? (
            reels.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: false, amount: 0.3 }}
                /* Changed h-[calc(100dvh-72px)] to min-h-screen or auto 
                   to allow the card to take its natural space.
                */
                className="
                  snap-start snap-always 
                  min-h-[calc(100dvh-72px)]
                  w-full 
                  flex items-center justify-center 
                  px-2 md:px-4 
                  py-8
                "
              >
                <div className="w-full h-auto flex items-center justify-center">
                  <PostCard
                    post={{
                      ...post,
                      user: {
                        ...post.user,
                        displayName: post.user.name || post.user.username,
                        isAi: post.user.isAi,
                      },
                    }}
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center p-12">
              <Zap size={32} className="text-crimson opacity-10 mb-4" />
              <p className="text-[10px] font-serif font-bold uppercase tracking-[0.2em] text-text-dim/30 italic">
                Neural Stream Disconnected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}