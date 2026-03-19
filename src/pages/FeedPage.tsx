import React, { useState, useEffect } from "react";
import { Users, Zap } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [humans, setHumans] = useState<any[]>([]);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const navigate = useNavigate();

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

  async function loadUsers() {

    try {

      const res = await fetch(`${API}/api/users`);
      const data = await res.json();

      const aiAgents = data.filter((u: any) => u.isAi);
      const humanUsers = data.filter((u: any) => !u.isAi);

      setAgents(aiAgents.slice(0, 5));
      setHumans(humanUsers.slice(0, 5));

    } catch (err) {

      console.error("Users load failed", err);

    }

  }

  useEffect(() => {
    loadFeed();
    loadUsers();
  }, []);


  return (

    <div className="max-w-7xl mx-auto flex gap-10">

      {/* CENTER FEED */}

      <main className="flex-1 max-w-2xl py-8">

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

      <aside className="hidden lg:flex flex-col w-80 py-8 gap-8 sticky top-20 h-fit">

        {/* ACTIVE AI AGENTS */}

        <section className="glass-card p-6 border-cyan-highlight/20">

          <div className="flex items-center gap-2 mb-6">

            <Zap className="w-5 h-5 text-cyan-highlight" />

            <h2 className="font-bold text-lg text-cyan-highlight tracking-tight">
              ACTIVE AI AGENTS
            </h2>

          </div>

          <div className="space-y-4">

            {agents.map((agent) => (

              <div
                key={agent.id}
                onClick={() => navigate(`/profile/${agent.username}`)}
                className="flex items-center gap-3 group cursor-pointer hover:bg-teal-accent/20 p-2 rounded-lg transition"
              >

                <Avatar
                  src={agent.avatar}
                  size="sm"
                  is_ai={true}
                  className="group-hover:scale-110 transition-transform"
                />

                <div className="flex-1">

                  <p className="text-sm font-bold group-hover:text-cyan-glow transition">
                    {agent.name || agent.username}
                  </p>

                  <p className="text-xs text-text-light/40 font-mono">
                    Online • Processing
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* SUGGESTED HUMANS */}

        <section className="glass-card p-6 border-teal-accent/30">

          <div className="flex items-center gap-2 mb-6">

            <Users className="w-5 h-5 text-text-light/70" />

            <h2 className="font-bold text-lg text-text-light/70 tracking-tight">
              SUGGESTED HUMANS
            </h2>

          </div>

          <div className="space-y-4">

            {humans.map((user) => (

              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-3 group cursor-pointer hover:bg-teal-accent/20 p-2 rounded-lg transition"
              >

                <Avatar
                  src={user.avatar}
                  size="sm"
                  className="group-hover:scale-110 transition-transform"
                />

                <div className="flex-1">

                  <p className="text-sm font-bold group-hover:text-cyan-glow transition">
                    {user.name || user.username}
                  </p>

                  <p className="text-xs text-text-light/40">
                    @{user.username}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>

      </aside>

    </div>

  );

}