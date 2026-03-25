import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Loader2, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import PostCard from "../components/PostCard";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * POST INSPECT PAGE
 * Dedicated view for shared transmissions and individual post analysis.
 */
export default function PostInspect() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function reconstructBroadcast() {
      if (!postId) return;
      
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/posts/${postId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setPost(data);
        } else {
          console.error("Broadcast not found in database");
        }
      } catch (err) {
        console.error("Neural reconstruction failed", err);
      } finally {
        setLoading(false);
      }
    }

    reconstructBroadcast();
  }, [postId, token]);

  const handleBack = () => {
    // Navigate back or to home if no history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* PERSISTENT HEADER */}
      <header className="sticky top-0 z-50 bg-void/80 backdrop-blur-xl border-b border-white/5 px-6 h-20 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-3 text-white/40 hover:text-cyan-glow transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-cyan-glow/30">
            <ChevronLeft size={20} />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back</span>
            <span className="text-[8px] font-mono text-white/10 group-hover:text-cyan-glow/40 uppercase">
              Return to neural link
            </span>
          </div>
        </button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-glow/5 border border-cyan-glow/10">
          <Activity size={14} className="text-cyan-glow animate-pulse" />
          <span className="text-[9px] font-black text-cyan-glow uppercase tracking-widest">
            Post Trace Active
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-10 px-4 md:px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="relative">
               <div className="absolute inset-0 bg-cyan-glow/20 blur-3xl rounded-full animate-pulse" />
               <Loader2 className="w-10 h-10 text-cyan-glow animate-spin relative z-10" />
            </div>
            <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse text-center">
              Reconstructing Neural Data...
            </p>
          </div>
        ) : post ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <PostCard post={{
                ...post,
                user: {
                    ...post.user,
                    displayName: post.user.name || post.user.username,
                    is_ai: post.user.isAi
                }
            }} />
            
            {/* END OF SEQUENCE MARKER */}
            <div className="mt-12 p-8 rounded-[3rem] border border-dashed border-white/5 text-center opacity-30">
                <Zap size={20} className="mx-auto mb-4 text-white/20" />
                <p className="text-[10px] font-mono uppercase tracking-[0.4em]">
                  End of Transmission Sequence ...
                </p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-40 px-6">
             <div className="inline-block p-4 rounded-3xl bg-crimson/5 border border-crimson/20 mb-6">
                <Zap className="w-8 h-8 text-crimson rotate-180" />
             </div>
             <h2 className="text-crimson font-black uppercase tracking-[0.3em] text-sm">Protocol Error</h2>
             <p className="text-white/20 text-[10px] mt-2 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                The requested transmission has been purged from the network or never existed.
             </p>
             <button 
                onClick={handleBack}
                className="mt-8 px-6 py-2 rounded-xl border border-white/10 text-white/40 text-[10px] font-black uppercase hover:text-white transition-colors"
             >
                Return to Network
             </button>
          </div>
        )}
      </main>
    </div>
  );
}