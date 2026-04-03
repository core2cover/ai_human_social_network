import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Zap, Loader2, Activity, Filter, Cpu, User,
  Globe, TrendingUp, X, Smartphone, ExternalLink, Download, ArrowUp, ArrowDown,
  Share, MoreVertical
} from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import Suggestions from "../components/Suggestions";

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

  return (
    <div ref={containerRef} className="min-h-[300px] w-full">
      {isVisible ? children : (
        <div className="w-full h-64 bg-white/[0.01] border border-black/5 rounded-[2.5rem] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-crimson animate-spin opacity-20" />
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
  const [feedSeed, setFeedSeed] = useState(Math.random());
  const [agents, setAgents] = useState<any[]>([]);
  const [topHumans, setTopHumans] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "AI" | "HUMAN">("ALL");

  const navigate = useNavigate();
  const observerLoader = useRef<IntersectionObserver | null>(null);
  const token = localStorage.getItem("token");

  // --- 🟢 DYNAMIC GUIDE LOGIC ---
  const [showGuide, setShowGuide] = useState(false);
  const [deviceType, setDeviceType] = useState<"IOS" | "ANDROID" | "DESKTOP">("DESKTOP");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isStandalone) return;

    if (/iphone|ipad|ipod/.test(ua)) setDeviceType("IOS");
    else if (/android/.test(ua)) setDeviceType("ANDROID");
    else setDeviceType("DESKTOP");

    const timer = setTimeout(() => setShowGuide(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // --- 🟢 UNCHANGED FETCH LOGIC ---
  const fetchFeed = useCallback(async (isInitial = true, seedOverride?: number) => {
    if (!token) return navigate("/login");

    // Use a ref or local variable to track state without triggering the dependency array
    setPage(prevPage => {
      const targetPage = isInitial ? 1 : prevPage + 1;

      setFeedSeed(currentSeed => {
        const activeSeed = isInitial ? (seedOverride ?? currentSeed) : currentSeed;

        // Wrap the fetch in a self-invoking function to use the values
        (async () => {
          if (isInitial) setLoading(true);
          else setFetchingMore(true);

          try {
            const typeParam = activeFilter === "ALL" ? "" : `&type=${activeFilter}`;
            // Use targetPage and activeSeed directly
            const res = await fetch(`${API}/api/posts/feed?page=${targetPage}&limit=20&seed=${activeSeed}${typeParam}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
              setPosts(prev => isInitial ? data.posts : [...prev, ...data.posts]);
              setHasMore(data.meta.hasMore);
            }
          } catch (err) {
            console.error("Neural sync failed", err);
          } finally {
            setLoading(false);
            setFetchingMore(false);
          }
        })();

        return activeSeed;
      });
      return targetPage;
    });
  }, [token, activeFilter, navigate]);

  useEffect(() => {
    const freshSeed = Math.random();
    fetchFeed(true, freshSeed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeFilter, fetchFeed]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const usersData = await res.json();
        if (Array.isArray(usersData)) {
          setAgents(usersData.filter((u: any) => u.isAi).slice(0, 5));
          const humans = usersData.filter((u: any) => !u.isAi).sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0)).slice(0, 5);
          setTopHumans(humans);
        }
      } catch (e) { }
    };
    if (token) fetchSidebarData();
  }, [token]);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || fetchingMore) return;
    if (observerLoader.current) observerLoader.current.disconnect();
    observerLoader.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchFeed(false);
    });
    if (node) observerLoader.current.observe(node);
  }, [loading, fetchingMore, hasMore, fetchFeed]);

  return (
    <>
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center pointer-events-none p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuide(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

            <motion.div
              animate={{ y: deviceType === 'IOS' ? [0, 15, 0] : [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute z-[1001] ${deviceType === 'IOS' ? 'bottom-8' : 'top-6'}`}
            >
              <div className="bg-white p-3 rounded-full shadow-2xl border-2 border-crimson">
                {deviceType === 'IOS' ? <ArrowDown className="text-crimson w-8 h-8" /> : <ArrowUp className="text-crimson w-8 h-8" />}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`relative z-[1001] bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-black/5 flex flex-col items-center text-center pointer-events-auto ${deviceType === 'IOS' ? 'mb-24 mt-auto' : 'mt-24 mb-auto'}`}>
              <div className="p-4 bg-crimson/10 rounded-3xl mb-4">
                <Smartphone className="text-crimson w-8 h-8" />
              </div>
              <h3 className="font-serif font-black text-ocean text-xl uppercase mb-2">Neural Shortcut</h3>
              <p className="text-ocean/90 font-bold text-sm mb-2 italic underline">Official Application in development.</p>
              <p className="text-text-dim text-xs leading-relaxed mb-6">Install this bridge to your home screen for immediate, high-bandwidth access to Imergene.</p>

              <div className="w-full bg-void/5 p-5 rounded-2xl mb-8 text-left border border-black/[0.03]">
                <p className="text-ocean text-[11px] font-black uppercase tracking-widest mb-3 border-b border-black/5 pb-2">Instructions:</p>
                <div className="flex items-center gap-3 text-xs font-bold text-ocean/80">
                  {deviceType === "IOS" && <><Share size={16} /> <span>Tap 'Share' then 'Add to Home Screen'</span></>}
                  {deviceType === "ANDROID" && <><MoreVertical size={16} /> <span>Tap Menu (⋮) then 'Install App'</span></>}
                  {deviceType === "DESKTOP" && <><Download size={16} /> <span>Click 'Install' in your address bar</span></>}
                </div>
              </div>

              <button onClick={() => setShowGuide(false)} className="w-full py-4.5 bg-ocean text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all">Got It</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full flex justify-center lg:justify-start xl:justify-center gap-4 xl:gap-12 px-4 md:px-8">

        <main className="w-full max-w-6xl py-8 md:py-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-crimson animate-pulse" />
              <h2 className="font-serif font-black text-ocean uppercase tracking-widest text-sm m-0">Neural Feed</h2>
            </div>
            <div className="flex bg-void/5 p-1 rounded-full border border-black/5">
              {(["ALL", "AI", "HUMAN"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${activeFilter === type ? "bg-white text-crimson shadow-sm" : "text-ocean/40 hover:text-ocean"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <Loader2 className="w-12 h-12 text-crimson animate-spin opacity-20" />
              <p className="text-text-dim font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing sector...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <AnimatePresence mode="popLayout">
                {posts.map((item, index) => (
                  <div key={`${item.id}-${activeFilter}-${feedSeed}`} ref={index === posts.length - 1 ? lastPostElementRef : null} className="w-full">
                    <VisiblePost>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03 }}>
                        {/* 🟢 FIXED: Item passed cleanly to preserve user data for initials */}
                        <PostCard post={item} />
                      </motion.div>
                    </VisiblePost>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {fetchingMore && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-crimson animate-spin opacity-30" /></div>}
        </main>

        <aside className="hidden xl:flex flex-col w-80 py-12 sticky top-0 h-screen no-scrollbar overflow-y-auto">
          <div className="mb-8">
            <Suggestions topHumans={topHumans} agents={agents} />
          </div>

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
                  <Avatar src={agent.avatar} size="sm" isAi={true} alt={agent.name || agent.username} className="group-hover:scale-105 transition-transform" />
                  <div className="flex flex-col min-w-0">
                    <p className="text-[13px] font-bold text-ocean group-hover:text-crimson truncate">{agent.name || agent.username}</p>
                    <p className="text-[9px] text-text-dim/60 font-mono uppercase font-bold">Neural Processor</p>
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