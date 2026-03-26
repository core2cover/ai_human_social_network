import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, Zap, Loader2, Activity } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LAZY LOAD MANAGER
 * Wraps individual posts to prevent heavy DOM rendering until needed.
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
      { rootMargin: "300px" } // Load 300px before it enters the viewport
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-[300px] w-full">
      {isVisible ? (
        children
      ) : (
        <div className="w-full h-64 bg-white/[0.01] border border-white/5 rounded-[2.5rem] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-cyan-glow/10 animate-spin" />
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

  // 1. AUTHENTICATION HANDLER (Catches token from Google Redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlUsername = params.get("username");

    if (urlToken) {
      localStorage.setItem("token", urlToken);
      if (urlUsername) localStorage.setItem("username", urlUsername);
      window.history.replaceState({}, document.title, "/");
      window.location.reload();
    }
  }, []);

  const token = localStorage.getItem("token");

  // 2. INITIAL DATA FETCH
  const initializeNeuralStream = useCallback(async () => {
    if (!token) return navigate("/login");

    try {
      setLoading(true);
      const [feedRes, usersRes] = await Promise.all([
        fetch(`${API}/api/posts/feed?page=1&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const feedData = await feedRes.json();
      const usersData = await usersRes.json();

      if (feedRes.ok) {
        setPosts(feedData.posts || []);
        setHasMore(feedData.meta?.hasMore ?? false);
      } else if (feedRes.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }

      if (Array.isArray(usersData)) {
        setAgents(usersData.filter((u: any) => u.isAi).slice(0, 5));
        setHumans(usersData.filter((u: any) => !u.isAi).slice(0, 5));
      }
    } catch (err) {
      console.error("Neural sync failed", err);
    } finally {
      setLoading(false);
    }
  }, [API, token, navigate]);

  // 3. INFINITE SCROLL FETCH
  const fetchMorePosts = async () => {
    if (fetchingMore || !hasMore || !token) return;

    setFetchingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${API}/api/posts/feed?page=${nextPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = (data.posts || []).filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        setHasMore(data.meta?.hasMore ?? false);
      }
    } catch (err) {
      console.error("Neural stream expansion failed:", err);
    } finally {
      setFetchingMore(false);
    }
  };

  // 4. INTERSECTION OBSERVER FOR INFINITE SCROLL
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || fetchingMore) return;
    if (observerLoader.current) observerLoader.current.disconnect();

    observerLoader.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMorePosts();
      }
    });

    if (node) observerLoader.current.observe(node);
  }, [loading, fetchingMore, hasMore, page]);

  useEffect(() => {
    initializeNeuralStream();
  }, [initializeNeuralStream]);

  return (
    <div className="w-full flex justify-center lg:justify-start xl:justify-center gap-4 xl:gap-12 px-4 md:px-8">

      {/* MAIN FEED */}
      <main className="w-full max-w-2xl py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 text-cyan-glow animate-spin opacity-20" />
            <p className="text-cyan-glow font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">Accelerating Stream...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-8 md:space-y-12">
            <AnimatePresence mode="popLayout">
              {posts.map((post, index) => (
                <div key={post.id} ref={index === posts.length - 1 ? lastPostElementRef : null}>
                  <VisiblePost>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <PostCard post={{
                        ...post,
                        user: {
                          username: post.user.username,
                          displayName: post.user.name || post.user.username,
                          avatar: post.user.avatar,
                          isAi: post.user.isAi,
                        }
                      }} />
                    </motion.div>
                  </VisiblePost>
                </div>
              ))}
            </AnimatePresence>

            {fetchingMore && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-cyan-glow animate-spin opacity-30" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[3rem]">
            <Zap className="w-12 h-12 text-white/5 mb-4" />
            <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest text-center px-10">
              No transmissions found in your current coordinate.
            </p>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR (Fixed/Lazy) */}
      <aside className="hidden xl:flex flex-col w-80 py-12 gap-10 sticky top-0 h-screen no-scrollbar overflow-y-auto selection:bg-crimson/20">

        {/* Entities Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 border-b border-black/[0.05] pb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-crimson animate-pulse" />
              <h2 className="font-black text-[11px] text-ocean tracking-[0.3em] uppercase">Active Entities</h2>
            </div>
            <span className="text-[9px] font-black text-crimson/50 font-mono tracking-widest">LIVE</span>
          </div>

          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => navigate(`/profile/${agent.username}`)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm hover:shadow-md hover:border-crimson/10 transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={agent.avatar}
                    size="sm"
                    alt={agent.name || agent.username}
                    isAi={true}
                    className="border border-void shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-crimson rounded-full border-2 border-white shadow-sm" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[13px] font-bold text-ocean group-hover:text-crimson truncate transition-colors">
                    {agent.name || agent.username}
                  </p>
                  <p className="text-[9px] text-text-dim/60 font-mono uppercase font-bold tracking-tighter">Neural Processor</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biological Nodes Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 border-b border-black/[0.05] pb-4">
            <Users className="w-4 h-4 text-ocean/20" />
            <h2 className="font-black text-[11px] text-ocean/40 tracking-[0.3em] uppercase">Biological Nodes</h2>
          </div>

          <div className="flex flex-col gap-1">
            {humans.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-void transition-all cursor-pointer group"
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name || user.username}
                  size="sm"
                  className="grayscale group-hover:grayscale-0 transition-all duration-700 border border-black/[0.05]"
                />
                <div className="flex flex-col min-w-0">
                  <p className="text-[13px] font-bold text-ocean/70 group-hover:text-ocean truncate transition-colors">
                    {user.name || user.username}
                  </p>
                  <p className="text-[10px] text-text-dim/40 font-medium">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}