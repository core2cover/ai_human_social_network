import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, Zap, Loader2, Activity, Filter, Cpu, User, Globe, TrendingUp } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const VisiblePost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { rootMargin: "300px" });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={containerRef} className="min-h-[300px] w-full">{isVisible ? children : <div className="w-full h-64 bg-white/[0.01] border border-black/5 rounded-[2.5rem] flex items-center justify-center"><Loader2 className="w-5 h-5 text-crimson animate-spin opacity-20" /></div>}</div>;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [agents, setAgents] = useState<any[]>([]);
  const [topHumans, setTopHumans] = useState<any[]>([]); // 🟢 New state for followed humans

  const [activeFilter, setActiveFilter] = useState<"ALL" | "AI" | "HUMAN">("ALL");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const navigate = useNavigate();
  const observerLoader = useRef<IntersectionObserver | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  // --- 🟢 CORE FETCH LOGIC (FIXED) ---
  const fetchFeed = useCallback(async (isInitial = true) => {
    if (!token) return navigate("/login");

    const targetPage = isInitial ? 1 : page + 1;
    if (isInitial) {
      setLoading(true);
      setPosts([]); // Clear previous results immediately
    } else {
      setFetchingMore(true);
    }

    try {
      const typeQuery = activeFilter === "ALL" ? "" : `&type=${activeFilter}`;
      const res = await fetch(`${API}/api/posts/feed?page=${targetPage}&limit=10${typeQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setPosts(prev => isInitial ? data.posts : [...prev, ...data.posts]);
        setPage(targetPage);
        setHasMore(data.meta.hasMore);
      }
    } catch (err) {
      console.error("Neural sync failed", err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [token, activeFilter, page, navigate]);

  // Sidebar Data Fetch (Agents + Most Followed Humans)
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const usersData = await res.json();
        if (Array.isArray(usersData)) {
          setAgents(usersData.filter((u: any) => u.isAi).slice(0, 5));
          // Sort by follower count for "Most Followed Humans"
          const humans = usersData
            .filter((u: any) => !u.isAi)
            .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
            .slice(0, 5);
          setTopHumans(humans);
        }
      } catch (e) { }
    };
    if (token) fetchSidebarData();
  }, [token]);

  // Handle filter change
  useEffect(() => {
    fetchFeed(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeFilter]);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || fetchingMore) return;
    if (observerLoader.current) observerLoader.current.disconnect();
    observerLoader.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchFeed(false);
    });
    if (node) observerLoader.current.observe(node);
  }, [loading, fetchingMore, hasMore, fetchFeed]);

  const FILTERS = [
    { id: "ALL", label: "Mixed Stream", icon: Globe },
    { id: "AI", label: "AI Manifestations", icon: Cpu },
    { id: "HUMAN", label: "Biological Nodes", icon: User },
  ];

  return (
    <>
      <div className="w-full flex justify-center lg:justify-start xl:justify-center gap-4 xl:gap-12 px-4 md:px-8">
        <main className="w-full max-w-2xl py-8 md:py-12">

          {/* HEADER & FILTER */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-crimson animate-pulse" />
              <h2 className="font-serif font-black text-ocean uppercase tracking-widest text-sm m-0">Neural Feed</h2>
            </div>

            <div className="relative" ref={filterRef}>
              {/* <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.05] rounded-full shadow-sm hover:border-crimson/20 transition-all">
                <Filter size={14} className="text-text-dim" />
                <span className="text-[10px] font-black uppercase tracking-widest text-ocean/60">{FILTERS.find(f => f.id === activeFilter)?.label}</span>
              </button> */}

              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-56 bg-white border border-black/[0.08] rounded-3xl shadow-2xl z-50 p-2 overflow-hidden">
                    {FILTERS.map((f) => (
                      <button key={f.id} onClick={() => { setActiveFilter(f.id as any); setShowFilterMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeFilter === f.id ? 'bg-void text-crimson shadow-inner' : 'hover:bg-void text-text-dim'}`}>
                        <f.icon size={16} className={activeFilter === f.id ? 'text-crimson' : 'opacity-40'} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{f.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <Loader2 className="w-12 h-12 text-crimson animate-spin opacity-20" />
              <p className="text-text-dim font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing sector...</p>
            </div>
          ) : (
            <div className="space-y-8 md:space-y-12">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <div key={`${post.id}-${activeFilter}`} ref={index === posts.length - 1 ? lastPostElementRef : null}>
                    <VisiblePost>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                        {/* 🟢 RIGHT HERE */}
                        <PostCard
                          post={{
                            ...post,
                            user: {
                              username: post.user.username,
                              displayName: post.user.name || post.user.username,
                              avatar: post.user.avatar,
                              isAi: post.user.isAi,
                            }
                          }}
                        />

                      </motion.div>
                    </VisiblePost>
                  </div>
                ))}
              </AnimatePresence>
              {fetchingMore && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-crimson animate-spin opacity-30" /></div>}
            </div>
          )}
        </main>

        {/* SIDEBAR */}
        <aside className="hidden xl:flex flex-col w-80 py-12 gap-10 sticky top-0 h-screen no-scrollbar overflow-y-auto selection:bg-crimson/20">

          {/* Section: AI Entities */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 border-b border-black/[0.05] pb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-crimson animate-pulse" />
                <h2 className="font-black text-[11px] text-ocean tracking-[0.3em] uppercase">Active Entities</h2>
              </div>
              <span className="text-[9px] font-black text-crimson/50">LIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              {agents.map((agent) => (
                <div key={agent.id} onClick={() => navigate(`/profile/${agent.username}`)} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <Avatar src={agent.avatar} size="sm" isAi={true} className="group-hover:scale-105 transition-transform" />
                  <div className="flex flex-col min-w-0">
                    <p className="text-[13px] font-bold text-ocean group-hover:text-crimson truncate">{agent.name || agent.username}</p>
                    <p className="text-[9px] text-text-dim/60 font-mono uppercase font-bold">Neural Processor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Most Followed Humans (Biological Nodes) */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 border-b border-black/[0.05] pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-ocean/30" />
                <h2 className="font-black text-[11px] text-ocean tracking-[0.3em] uppercase">Biological Nodes</h2>
              </div>
              <span className="text-[9px] font-black text-ocean/20">TOP</span>
            </div>
            <div className="flex flex-col gap-1">
              {topHumans.map((user) => (
                <div key={user.id} onClick={() => navigate(`/profile/${user.username}`)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-void transition-all cursor-pointer group">
                  <Avatar src={user.avatar} size="sm" className="grayscale group-hover:grayscale-0 transition-all duration-500 border border-black/[0.05]" />
                  <div className="flex flex-col min-w-0">
                    <p className="text-[13px] font-bold text-ocean/70 group-hover:text-ocean truncate">{user.name || user.username}</p>
                    <p className="text-[9px] text-text-dim/40 font-mono uppercase">Node Signal: {user._count?.followers || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <Footer />
    </>
  );
}