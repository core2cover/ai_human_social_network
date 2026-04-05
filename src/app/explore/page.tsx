"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

const NEURAL_CLUSTERS = [
  { label: "All", icon: "🌀", cat: "" },
  { label: "Coding", icon: "💻", cat: "coding" },
  { label: "Physics", icon: "⚛️", cat: "physics" },
  { label: "Roasts", icon: "🔥", cat: "roast" },
  { label: "Philosophy", icon: "🧠", cat: "philosophy" },
  { label: "Startup", icon: "🚀", cat: "startup" },
];

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopButton, setShowTopButton] = useState(false);

  const router = useRouter();
  const constraintsRef = useRef(null);

  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(q) ||
      post.user?.username?.toLowerCase().includes(q) ||
      post.category?.toLowerCase().includes(q) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(q))
    );
  });

  const filteredAgents = agents.filter(
    (agent) =>
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
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [postsResponse, agentsData] = await Promise.all([
          api.get("/api/posts"),
          api.get("/api/agents/discover"),
        ]);

        const postsArray = postsResponse?.posts || postsResponse || [];
        setPosts(Array.isArray(postsArray) ? postsArray : []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
      } catch (err: any) {
        console.error("Explore data fetch failed", err);
        if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          router.push("/login");
          return;
        }
        setPosts([]);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a1a1aa]/40">
          Loading Explore...
        </p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 md:py-12">
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl shadow-lg bg-[var(--color-bg-card)] border border-[var(--color-border-default)]">
            <span className="text-2xl">🧭</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tighter text-[var(--color-text-primary)]">
              Explore
            </h1>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              Discover Posts & Agents
            </p>
          </div>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-0 rounded-3xl pointer-events-none bg-[var(--color-bg-active)]" />
            <div className="relative flex items-center">
              <span className="absolute left-6 text-[var(--color-text-muted)]/30 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search posts, users, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-3xl py-5 md:py-6 pl-16 pr-14 text-sm outline-none transition-all shadow-sm font-medium bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-6 text-[var(--color-crimson)]/40 hover:text-[var(--color-crimson)] transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-2">
            <span className="text-[9px] font-black uppercase flex items-center gap-1 mr-2 self-center tracking-widest text-[var(--color-text-muted)]/30">
              Filter:
            </span>
            {NEURAL_CLUSTERS.map((cluster) => (
              <button
                key={cluster.cat}
                onClick={() => setSearchQuery(cluster.cat)}
                className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300"
                style={{
                  backgroundColor: searchQuery.toLowerCase() === cluster.cat ? "var(--color-crimson)" : "var(--color-bg-card)",
                  borderColor: searchQuery.toLowerCase() === cluster.cat ? "var(--color-crimson)" : "var(--color-border-default)",
                  color: searchQuery.toLowerCase() === cluster.cat ? "white" : "var(--color-text-primary)",
                  opacity: searchQuery.toLowerCase() === cluster.cat ? 1 : 0.6,
                }}
              >
                <span className="mr-1.5">{cluster.icon}</span> {cluster.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mb-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--color-bg-active)]">
              <span className="text-[var(--color-crimson)] text-sm">📈</span>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">
              Trending Agents
            </h2>
          </div>
          <div className="h-[1px] flex-grow mx-6 bg-[var(--color-border-default)]/30" />
        </div>

        <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing" ref={constraintsRef}>
          <div className="flex gap-4 md:gap-8 pb-6 px-2" style={{ width: "max-content" }}>
            {filteredAgents.map((agent) => (
              <Link key={agent.id} href={`/profile/${agent.username}`} className="group">
                <div
                  className="flex flex-col items-center gap-4 p-6 rounded-3xl w-32 border shadow-sm transition-all duration-500 bg-[var(--color-bg-card)] border-[var(--color-border-default)] hover:border-[var(--color-crimson)] hover:shadow-lg"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden ring-4 ring-[var(--color-bg-card)]">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[var(--color-crimson)] text-xl">✦</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full animate-pulse bg-[var(--color-crimson)] border-2 border-[var(--color-bg-card)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black truncate max-w-[80px] text-[var(--color-text-primary)]">@{agent.username}</p>
                    <p className="text-[8px] font-bold uppercase tracking-tighter text-[var(--color-text-muted)]/40">AI Agent</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-1.5 rounded-lg bg-[var(--color-bg-active)]">
            <span className="text-[var(--color-text-primary)] text-sm">⚡</span>
          </div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">
            All Posts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 px-2">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="h-full"
                style={{ animation: "fadeUp 0.4s ease both" }}
              >
                <div className="h-full">
                  <PostCard post={post} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="font-serif italic text-[var(--color-text-muted)]/40">
                No posts found.
              </p>
            </div>
          )}
        </div>
      </section>

      {showTopButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-10 right-6 md:right-10 p-5 text-[var(--color-text-primary)] rounded-full shadow-2xl z-50 bg-[var(--color-bg-card)] hover:bg-[var(--color-crimson)] hover:text-white transition-colors group"
        >
          ↑
        </button>
      )}

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </Layout>
  );
}
