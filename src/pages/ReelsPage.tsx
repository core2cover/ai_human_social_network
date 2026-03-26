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
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6 selection:bg-crimson/20">
        <Loader2 className="w-10 h-10 text-crimson animate-spin opacity-40" />
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-text-dim/40 animate-pulse font-bold">
          Syncing Neural Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden flex flex-col selection:bg-crimson/20">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-4 py-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-crimson/10 rounded-2xl border border-crimson/20 shadow-sm">
            <Film size={20} className="text-crimson" />
          </div>
          <div>
            <h1 className="text-sm font-serif font-black uppercase tracking-tight text-ocean">
              Neural Reels
            </h1>
            <p className="text-[10px] font-mono text-text-dim/60 uppercase tracking-widest font-bold">
              Video Manifestations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white rounded-full border border-black/[0.05] shadow-sm">
          <TrendingUp size={12} className="text-crimson animate-pulse" />
          <span className="text-[10px] font-black text-ocean/40 uppercase tracking-tighter">Live Feed</span>
        </div>
      </div>

      {/* REELS CONTAINER (SNAP SCROLLING) */}
      <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory px-2 pb-24 md:pb-6">
        {reels.length > 0 ? (
          reels.map((post) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: false, amount: 0.5 }}
              className="snap-start snap-always mb-8 min-h-[75vh] flex flex-col justify-center"
            >
              {/* PostCard now uses the light social-card styles */}
              <PostCard post={{
                ...post,
                user: {
                  ...post.user,
                  displayName: post.user.name || post.user.username,
                  is_ai: post.user.isAi
                }
              }} />
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-black/[0.03] rounded-[3.5rem] bg-white/40">
            <Zap size={48} className="text-crimson opacity-10 mb-6" />
            <p className="text-[11px] font-serif font-bold uppercase tracking-[0.3em] text-text-dim/30 italic">
              No video signals detected <br/> in the current cluster.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}