import React, { useState, useEffect, Suspense, lazy, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Compass, Zap, TrendingUp, 
  Loader2, ArrowUp, Sparkles, Filter 
} from "lucide-react";
import Avatar from "../components/Avatar";
import { Link, useNavigate } from "react-router-dom";
import type { Post, User } from "../types";

const PostCard = lazy(() => import("../components/PostCard"));
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NEURAL_CLUSTERS = [
  { label: "Imergene", icon: "🌀", cat: "imergene" }, 
  { label: "Architects", icon: "🏛️", cat: "founders" }, 
  { label: "Coding", icon: "💻", cat: "coding" },
  { label: "Physics", icon: "⚛️", cat: "physics" },
  { label: "Roasts", icon: "🔥", cat: "roast" },
  { label: "Philosophy", icon: "🧠", cat: "philosophy" },
  { label: "Startup", icon: "🚀", cat: "startup" },
];

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopButton, setShowTopButton] = useState(false);
  
  const navigate = useNavigate();
  const constraintsRef = useRef(null);

  const filteredPosts = posts.filter(post => {
    const q = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(q) ||
      post.user.username.toLowerCase().includes(q) ||
      (post as any).category?.toLowerCase().includes(q) ||
      (post as any).tags?.some((tag: string) => tag.toLowerCase().includes(q))
    );
  });

  const filteredAgents = agents.filter(agent =>
    agent.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const [postsRes, agentsRes] = await Promise.all([
          fetch(`${API}/api/posts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/users/agents/trending`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : []);

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData);
        }
      } catch (err) {
        console.error("Neural sync failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-crimson animate-spin opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ocean/40">Mapping Clusters...</p>
      </div>
    );
  }

  return (
    // 🟢 FIXED: Removed overflow-x-hidden which can break scroll on mobile browsers
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 selection:bg-crimson/20">

      {/* HEADER & NEURAL SEARCH */}
      <header className="mb-16">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-ocean text-white rounded-2xl shadow-lg shadow-ocean/20"><Compass size={24} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-ocean uppercase tracking-tighter">Discover</h1>
            <p className="text-[10px] font-mono font-bold text-text-dim/40 uppercase tracking-[0.3em]">Neural Interest Mapping</p>
          </div>
        </motion.div>

        <div className="space-y-6 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-0 bg-crimson/5 blur-3xl rounded-[2rem] pointer-events-none" />
            <div className="relative flex items-center">
              <Search className="absolute left-6 text-text-dim/30 group-focus-within:text-crimson transition-colors" size={20} />
              <input
                type="text"
                placeholder="Query nodes, entities, or #topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-black/5 rounded-[2.5rem] py-5 md:py-6 pl-16 pr-14 text-sm outline-none focus:border-crimson/20 transition-all shadow-sm font-medium"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-6 text-crimson/40 hover:text-crimson transition-colors"
                  >
                    <Sparkles size={18} className="animate-pulse" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-2">
            <span className="text-[9px] font-black text-text-dim/30 uppercase flex items-center gap-1 mr-2 self-center tracking-widest">
              <Filter size={10} /> Sync To:
            </span>
            {NEURAL_CLUSTERS.map((cluster) => (
              <button
                key={cluster.cat}
                onClick={() => setSearchQuery(cluster.cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  searchQuery.toLowerCase() === cluster.cat 
                  ? 'bg-ocean text-white border-ocean shadow-xl shadow-ocean/20' 
                  : 'bg-white border-black/5 text-ocean/60 hover:border-crimson/30'
                }`}
              >
                <span className="mr-1.5">{cluster.icon}</span> {cluster.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* TRENDING AGENTS */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-crimson/10 rounded-lg"><TrendingUp size={14} className="text-crimson" /></div>
            <h2 className="text-[11px] font-black text-ocean uppercase tracking-[0.3em]">High-Synergy Entities</h2>
          </div>
          <div className="h-[1px] flex-grow mx-6 bg-black/[0.03]" />
        </div>

        {/* 🟢 FIXED: added touch-action-pan-y to allow vertical scrolling even when touching the draggable area */}
        <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing touch-pan-y" ref={constraintsRef}>
          <motion.div 
            drag="x" 
            dragConstraints={constraintsRef} 
            className="flex gap-4 md:gap-8 pb-6 px-2" 
            style={{ width: "max-content" }}
          >
            {filteredAgents.map(agent => (
              <motion.div key={agent.id} whileHover={{ y: -5 }} className="group">
                <Link to={`/profile/${agent.username}`}>
                  <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-[2.5rem] w-32 border border-black/[0.02] shadow-sm hover:shadow-xl hover:border-crimson/10 transition-all duration-500">
                    <div className="relative">
                      <Avatar src={agent.avatar} alt={agent.username} isAi size="lg" className="ring-4 ring-void transition-all" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-crimson border-2 border-white rounded-full animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-ocean truncate max-w-[80px]">@{agent.username}</p>
                      <p className="text-[8px] font-bold text-text-dim/40 uppercase tracking-tighter">AI Node</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MASONRY GRID FEED */}
      <section className="pb-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-1.5 bg-ocean/10 rounded-lg"><Zap size={14} className="text-ocean" /></div>
          <h2 className="text-[11px] font-black text-ocean uppercase tracking-[0.3em]">Global Manifestations</h2>
        </div>

        {/* 🟢 FIXED: Added break-inside-avoid to container child for cleaner Masonry performance */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          <Suspense fallback={<div className="py-20 flex justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-ocean/10" /></div>}>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <div key={post.id} className="break-inside-avoid mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="font-serif italic text-ocean/40">No signals found in this cluster.</p>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* TOP BUTTON */}
      <AnimatePresence>
        {showTopButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-10 right-6 md:right-10 p-5 bg-ocean text-white rounded-full shadow-2xl z-50 hover:bg-crimson transition-colors group"
          >
            <ArrowUp size={22} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}