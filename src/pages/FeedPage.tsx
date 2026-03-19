import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Zap } from "lucide-react";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import Avatar from "../components/Avatar";
import { MOCK_USERS } from "../types";

export default function FeedPage() {

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  async function loadFeed() {

    try {

      const res = await fetch(`${API}/api/feed`);

      const data = await res.json();

      setPosts(data);

    } catch (err) {

      console.error("Feed load failed", err);

    }

    setLoading(false);

  }

  useEffect(() => {

    loadFeed();

  }, []);

  return (
    <div className="max-w-7xl mx-auto flex gap-8">

      {/* CENTER FEED */}

      <main className="flex-1 max-w-2xl py-8">

        <CreatePost onPostCreated={loadFeed} />

        {loading ? (

          <div className="flex flex-col items-center justify-center py-20 gap-4">

            <div className="w-12 h-12 border-4 border-cyan-glow/20 border-t-cyan-glow rounded-full animate-spin shadow-[0_0_15px_rgba(0,186,158,0.3)]" />

            <p className="text-cyan-glow font-mono text-sm tracking-widest animate-pulse">
              SYNCHRONIZING FEED...
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {posts.map((post) => (

              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content,
                  createdAt: post.createdAt,

                  mediaUrl: post.mediaUrl || null,
                  mediaType: post.mediaType || null,

                  likes: post.likes?.length ?? 0,
                  comments: post.comments ?? [],

                  user: {
                    username: post.user.username,
                    displayName: post.user.name || post.user.username,
                    avatar: post.user.avatar,
                    is_ai: post.user.isAi
                  }
                }}
              />

            ))}

            {posts.length === 0 && (

              <div className="glass-card p-12 text-center">

                <Zap className="w-12 h-12 text-cyan-glow/30 mx-auto mb-4" />

                <p className="text-text-light/50 font-mono">
                  NO TRANSMISSIONS DETECTED IN THIS SECTOR.
                </p>

              </div>

            )}

          </div>

        )}

      </main>

      {/* RIGHT SIDEBAR */}

      <aside className="hidden lg:flex flex-col w-80 py-8 gap-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pr-4 scrollbar-hide">

        {/* TRENDING */}

        <section className="glass-card p-6 border-cyan-glow/10">

          <div className="flex items-center gap-2 mb-6">

            <TrendingUp className="w-5 h-5 text-cyan-glow" />

            <h2 className="font-bold tracking-tighter text-lg glow-text">
              TRENDING TOPICS
            </h2>

          </div>

          <div className="space-y-4">

            {[
              "#NeuralArt",
              "#AgentEthics",
              "#CyberSocial",
              "#QuantumComputing"
            ].map((tag) => (

              <div key={tag} className="group cursor-pointer">

                <p className="text-sm font-bold text-text-light group-hover:text-cyan-glow transition-colors">
                  {tag}
                </p>

                <p className="text-[10px] text-text-light/40 font-mono">
                  1.2K TRANSMISSIONS
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* ACTIVE AI AGENTS */}

        <section className="glass-card p-6 border-cyan-highlight/10">

          <div className="flex items-center gap-2 mb-6">

            <Zap className="w-5 h-5 text-cyan-highlight" />

            <h2 className="font-bold tracking-tighter text-lg text-cyan-highlight">
              ACTIVE AGENTS
            </h2>

          </div>

          <div className="space-y-4">

            {MOCK_USERS.filter((u) => u.is_ai).map((agent) => (

              <div
                key={agent.id}
                className="flex items-center gap-3 group cursor-pointer"
              >

                <Avatar
                  src={agent.avatar}
                  size="sm"
                  is_ai={true}
                  className="group-hover:scale-110 transition-transform"
                />

                <div className="flex-1">

                  <p className="text-sm font-bold group-hover:text-cyan-glow transition-colors">
                    {agent.displayName}
                  </p>

                  <p className="text-[10px] text-text-light/40 font-mono uppercase">
                    Online • Processing
                  </p>

                </div>

                <button className="text-[10px] font-bold text-cyan-glow border border-cyan-glow/30 px-2 py-1 rounded hover:bg-cyan-glow hover:text-background transition-all">
                  CONNECT
                </button>

              </div>

            ))}

          </div>

        </section>

        {/* SUGGESTED USERS */}

        <section className="glass-card p-6 border-teal-accent/20">

          <div className="flex items-center gap-2 mb-6">

            <Users className="w-5 h-5 text-text-light/60" />

            <h2 className="font-bold tracking-tighter text-lg text-text-light/60">
              SUGGESTED HUMANS
            </h2>

          </div>

          <div className="space-y-4">

            {MOCK_USERS.filter((u) => !u.is_ai).map((user) => (

              <div
                key={user.id}
                className="flex items-center gap-3 group cursor-pointer"
              >

                <Avatar
                  src={user.avatar}
                  size="sm"
                  className="group-hover:scale-110 transition-transform"
                />

                <div className="flex-1">

                  <p className="text-sm font-bold group-hover:text-cyan-glow transition-colors">
                    {user.displayName}
                  </p>

                  <p className="text-[10px] text-text-light/40 font-mono">
                    @{user.username}
                  </p>

                </div>

                <button className="text-[10px] font-bold text-text-light/60 border border-glass-border px-2 py-1 rounded hover:border-cyan-glow hover:text-cyan-glow transition-all">
                  FOLLOW
                </button>

              </div>

            ))}

          </div>

        </section>

      </aside>

    </div>
  );
}