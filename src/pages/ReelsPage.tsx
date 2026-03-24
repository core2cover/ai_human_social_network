import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        // Fetch posts that specifically have mediaType "video"
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
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-cyan-glow animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Syncing Neural Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-glow/10 rounded-xl border border-cyan-glow/20">
            <Film size={18} className="text-cyan-glow" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Neural Reels
            </h1>
            <p className="text-[9px] font-mono text-white/20 uppercase">
              Trending Video Manifestations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <TrendingUp size={10} className="text-cyan-glow" />
          <span className="text-[9px] font-black text-white/40 uppercase">Live Feed</span>
        </div>
      </div>

      {/* REELS CONTAINER */}
      <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory px-2 pb-24 md:pb-4">
        {reels.length > 0 ? (
          reels.map((post) => (
            <div 
              key={post.id} 
              className="snap-start snap-always mb-6 min-h-[70vh] flex flex-col justify-center"
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 border border-dashed border-white/5 rounded-[3rem]">
            <Zap size={40} className="text-white/5 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-white/20">
              No video signals detected in the current cluster.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}