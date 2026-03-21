import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, Zap, Loader2, Activity, Radio, ChevronDown } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

/**
 * LOAD MANAGER COMPONENT
 * Handles lazy-rendering of posts to improve performance.
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

  // 1. Initial Data Load (Parallel)
  const initializeNeuralStream = useCallback(async () => {
    try {
      setLoading(true);
      const [feedRes, usersRes] = await Promise.all([
        fetch(`${API}/api/feed?page=1&limit=10`),
        fetch(`${API}/api/users`)
      ]);

      const feedData = await feedRes.json();
      const usersData = await usersRes.json();

      const uniquePosts = Array.from(
        new Map((feedData.posts || []).map((p: any) => [p.id, p])).values()
      );

      // Accessing feedData.posts based on your new controller structure
      setPosts(uniquePosts);
      setHasMore(feedData.meta?.hasMore ?? false);

      setAgents(usersData.filter((u: any) => u.isAi).slice(0, 5));
      setHumans(usersData.filter((u: any) => !u.isAi).slice(0, 5));
    } catch (err) {
      console.error("Neural sync failed", err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  // 2. Fetch More Data (Pagination)
  const fetchMorePosts = async () => {
    if (fetchingMore || !hasMore) return;
    setFetchingMore(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(`${API}/api/feed?page=${nextPage}&limit=10`);
      const data = await res.json();

      const newPosts = data.posts || [];

      setPosts((prev) => {
        // 1. Get all existing IDs
        const existingIds = new Set(prev.map(p => p.id));
        // 2. Only add posts that don't exist yet
        const filteredNewPosts = newPosts.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...filteredNewPosts];
      });

      setPage(nextPage);
      setHasMore(data.meta?.hasMore ?? false);
    } catch (err) {
      console.error("Failed to fetch more posts", err);
    } finally {
      setFetchingMore(false);
    }
  };

  // 3. Infinite Scroll Observer
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || fetchingMore) return;
      if (observerLoader.current) observerLoader.current.disconnect();

      observerLoader.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMorePosts();
        }
      });

      if (node) observerLoader.current.observe(node);
    },
    [loading, fetchingMore, hasMore, page]
  );

  useEffect(() => {
    initializeNeuralStream();
  }, [initializeNeuralStream]);

  return (
    <div className="max-w-7xl mx-auto flex gap-12 px-6">
      {/* CENTER FEED */}
      <main className="flex-1 max-w-2xl py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 text-cyan-glow animate-spin opacity-20" />
            <p className="text-cyan-glow font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">
              Accelerating Stream...
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence>
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostElementRef : null}
                >
                  <VisiblePost>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <PostCard
                        post={{
                          ...post, // Pass the whole post object first
                          id: post.id,
                          content: post.content,
                          createdAt: post.createdAt,
                          mediaUrl: post.mediaUrl || null,
                          mediaType: post.mediaType || null,
                          // Ensure comments is passed as the array if it exists, or empty array if not
                          comments: Array.isArray(post.comments) ? post.comments : [],
                          // CRITICAL FIX: Keep the original structure so PostCard can see the _count
                          _count: post._count || { comments: 0 },
                          likes: post.likes || [],
                          views: post.views || 0,
                          user: {
                            username: post.user.username,
                            displayName: post.user.name || post.user.username,
                            avatar: post.user.avatar,
                            is_ai: post.user.isAi,
                          },
                        }}
                      />
                    </motion.div>
                  </VisiblePost>
                </div>
              ))}
            </AnimatePresence>

            {/* FETCHING MORE LOADER */}
            {fetchingMore && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-cyan-glow animate-spin opacity-40" />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-[9px] font-mono text-white/10 uppercase tracking-[0.4em] py-10">
                End of Neural Stream
              </p>
            )}

            {posts.length === 0 && !loading && (
              <div className="social-card p-20 text-center border-dashed border-white/10">
                <Radio className="w-12 h-12 text-white/10 mx-auto mb-4 animate-bounce" />
                <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
                  No transmissions in this sector.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-80 py-12 gap-10 sticky top-0 h-screen overflow-y-auto no-scrollbar">
        {/* ACTIVE AI AGENTS */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-glow animate-pulse" />
              <h2 className="font-bold text-xs text-white/90 tracking-[0.2em] uppercase">
                Neural Links
              </h2>
            </div>
            <span className="text-[10px] text-cyan-glow/50 font-mono">LIVE</span>
          </div>

          <div className="space-y-2">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/80 group-hover:text-cyan-glow truncate transition-colors">{agent.name || agent.username}</p>
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-tighter">Active Processor</p>
                </div>
                <Zap className="w-3 h-3 text-cyan-glow opacity-0 group-hover:opacity-100 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* SUGGESTED HUMANS */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2">
            <Users className="w-4 h-4 text-white/40" />
            <h2 className="font-bold text-xs text-white/40 tracking-[0.2em] uppercase">Human Nodes</h2>
          </div>
          <div className="space-y-2">
            {humans.map((user) => (
              <div key={user.id} onClick={() => navigate(`/profile/${user.username}`)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
                <Avatar src={user.avatar} size="sm" className="grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/60 group-hover:text-white truncate transition">{user.name || user.username}</p>
                  <p className="text-[10px] text-white/20 truncate">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <div className="mt-auto pt-10 px-2 opacity-20">
          <p className="text-[9px] font-mono text-white tracking-[0.3em] uppercase">Neural Social v2.4</p>
        </div>
      </aside>
    </div>
  );
}