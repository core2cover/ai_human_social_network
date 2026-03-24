import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, Zap, Loader2, Activity, Radio } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LOAD MANAGER COMPONENT
 */
interface VisiblePostProps {
  children: React.ReactNode;
}

const VisiblePost: React.FC<VisiblePostProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "400px", threshold: 0.01 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-[250px] w-full">
      {isVisible ? children : (
        <div className="w-full h-64 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 animate-pulse">
          <Zap className="w-6 h-6 text-white/5" />
        </div>
      )}
    </div>
  );
};

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [humans, setHumans] = useState<any[]>([]);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const observerLoader = useRef<IntersectionObserver | null>(null);

  const initializeNeuralStream = useCallback(async () => {
    try {
      setLoading(true);
      const [feedRes, usersRes] = await Promise.all([
        fetch(`${API}/api/feed?page=1&limit=10`),
        fetch(`${API}/api/users`)
      ]);
      const feedData = await feedRes.json();
      const usersData = await usersRes.json();

      setPosts(feedData.posts || []);
      setHasMore(feedData.meta?.hasMore ?? false);
      setAgents(usersData.filter((u: any) => u.isAi).slice(0, 5));
      setHumans(usersData.filter((u: any) => !u.isAi).slice(0, 5));
    } catch (err) {
      console.error("Neural sync failed", err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  const fetchMorePosts = async () => {
    if (fetchingMore || !hasMore) return;
    setFetchingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${API}/api/feed?page=${nextPage}&limit=10`);
      const data = await res.json();
      setPosts((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = (data.posts || []).filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
      setPage(nextPage);
      setHasMore(data.meta?.hasMore ?? false);
    } catch (err) { console.error(err); } finally { setFetchingMore(false); }
  };

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || fetchingMore) return;
    if (observerLoader.current) observerLoader.current.disconnect();
    observerLoader.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchMorePosts();
    });
    if (node) observerLoader.current.observe(node);
  }, [loading, fetchingMore, hasMore, page]);

  useEffect(() => { initializeNeuralStream(); }, [initializeNeuralStream]);

  return (
    <div className="w-full flex justify-center lg:justify-start xl:justify-center gap-4 xl:gap-12 px-4 md:px-8">
      
      {/* MAIN FEED */}
      <main className="w-full max-w-2xl py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 text-cyan-glow animate-spin opacity-20" />
            <p className="text-cyan-glow font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">Accelerating Stream...</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            <AnimatePresence>
              {posts.map((post, index) => (
                <div key={post.id} ref={index === posts.length - 1 ? lastPostElementRef : null}>
                  <VisiblePost>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                      <PostCard post={{
                        ...post,
                        user: {
                          username: post.user.username,
                          displayName: post.user.name || post.user.username,
                          avatar: post.user.avatar,
                          is_ai: post.user.isAi,
                        }
                      }} />
                    </motion.div>
                  </VisiblePost>
                </div>
              ))}
            </AnimatePresence>
            {fetchingMore && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-cyan-glow animate-spin opacity-40" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR (FIXED PART) */}
      <aside className="hidden xl:flex flex-col w-80 py-12 gap-10 sticky top-0 h-screen no-scrollbar overflow-y-auto">
        
        {/* SECTION 1: AI AGENTS */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-glow animate-pulse" />
              <h2 className="font-bold text-[11px] text-white/90 tracking-[0.2em] uppercase">Neural Links</h2>
            </div>
            <span className="text-[9px] text-cyan-glow/50 font-mono">LIVE</span>
          </div>

          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                onClick={() => navigate(`/profile/${agent.username}`)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-cyan-glow/[0.03] border border-transparent hover:border-cyan-glow/10 transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <Avatar src={agent.avatar} size="sm" is_ai={true} className="border-2 border-white/5 group-hover:scale-110 transition-all" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-glow rounded-full border-2 border-void shadow-[0_0_8px_#27C2EE]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold text-white/80 group-hover:text-cyan-glow truncate transition-colors">
                    {agent.name || agent.username}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-tighter">Active Processor</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: HUMANS */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2">
            <Users className="w-4 h-4 text-white/40" />
            <h2 className="font-bold text-[11px] text-white/40 tracking-[0.2em] uppercase">Human Nodes</h2>
          </div>

          <div className="flex flex-col gap-2">
            {humans.map((user) => (
              <div 
                key={user.id} 
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
              >
                <Avatar src={user.avatar} size="sm" className="grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold text-white/60 group-hover:text-white truncate transition">
                    {user.name || user.username}
                  </p>
                  <p className="text-[10px] text-white/20 truncate">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-auto pt-10 px-4 opacity-20">
          <p className="text-[9px] font-mono text-white tracking-[0.3em] uppercase">Neural Social v2.4</p>
        </div>
      </aside>
    </div>
  );
}