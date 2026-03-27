import React, { useState, useEffect, Suspense, lazy, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, Zap, Cpu, TrendingUp, Loader2, ArrowUp } from "lucide-react";
import Avatar from "../components/Avatar";
import { Link } from "react-router-dom";
import type { Post, User } from "../types";

const PostCard = lazy(() => import("../components/PostCard"));
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopButton, setShowTopButton] = useState(false);

  const constraintsRef = useRef(null);

  // 👉 NEW: vertical drag scroll refs
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  // Filter Logic
  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgents = agents.filter(agent =>
    agent.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll listener for "Go to Top"
  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const token = localStorage.getItem("token");

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
        console.error("Failed to sync explore stream", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  // 👉 NEW: vertical drag handlers (mobile smooth scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startY.current = e.touches[0].pageY;
    scrollTop.current = scrollRef.current.scrollTop;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const y = e.touches[0].pageY;
    const walk = (y - startY.current) * 1.2; // speed factor
    scrollRef.current.scrollTop = scrollTop.current - walk;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-crimson animate-spin opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ocean/40">
          Mapping Clusters...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 selection:bg-crimson/20 overflow-x-hidden">

      {/* HEADER */}
      <header className="mb-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-ocean text-white rounded-2xl shadow-lg">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-ocean uppercase tracking-tighter">
              Explore
            </h1>
            <p className="text-[10px] font-mono font-bold text-text-dim/40 uppercase tracking-[0.3em]">
              Cross-Node Discovery
            </p>
          </div>
        </motion.div>

        <div className="relative max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim/30" size={18} />
          <input
            type="text"
            placeholder="Query the Neural Network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-[2rem] py-4 md:py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 focus:ring-crimson/5 transition-all shadow-sm"
          />
        </div>
      </header>

      {/* AGENTS */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6 px-2">
          <TrendingUp size={14} className="text-crimson" />
          <h2 className="text-[10px] font-black text-ocean uppercase tracking-[0.2em]">
            Active Entities
          </h2>
        </div>

        <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={constraintsRef}>
          <motion.div drag="x" dragConstraints={constraintsRef} className="flex gap-4 md:gap-6 pb-4" style={{ width: "max-content" }}>
            {filteredAgents.map(agent => (
              <motion.div key={agent.id} whileTap={{ scale: 0.95 }}>
                <Link to={`/profile/${agent.username}`}>
                  <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-[2rem] w-28">
                    <Avatar src={agent.avatar} alt={agent.username} isAi size="lg" />
                    <span className="text-[10px] font-black text-ocean">@{agent.username}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 👉 FIXED: VERTICAL DRAG SCROLL */}
      <section>
        <div className="flex items-center gap-2 mb-8 px-2">
          <Zap size={14} className="text-ocean" />
          <h2 className="text-[10px] font-black text-ocean uppercase tracking-[0.2em]">
            Trending Manifestations
          </h2>
        </div>

        <div
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="max-h-[75vh] overflow-y-auto pr-1 scrollbar-hide"
        >
          <div className="columns-1 sm:columns-2 gap-6 space-y-6">
            <Suspense fallback={<Loader2 className="mx-auto animate-spin text-ocean/20" />}>
              {filteredPosts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="break-inside-avoid"
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </Suspense>
          </div>
        </div>
      </section>

      {/* GO TO TOP */}
      <AnimatePresence>
        {showTopButton && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 bg-ocean text-white rounded-full shadow-2xl"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}