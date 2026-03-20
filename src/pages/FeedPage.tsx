import React, { useState, useEffect } from "react";
import { Users, Zap, Loader2, Activity, Radio } from "lucide-react";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

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
    <div className="max-w-7xl mx-auto flex gap-12 px-6">
      {/* CENTER FEED */}
      <main className="flex-1 max-w-2xl py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-cyan-glow animate-spin opacity-20" />
              <div className="absolute inset-0 w-12 h-12 border-t-2 border-cyan-glow rounded-full animate-spin shadow-[0_0_20px_rgba(39,194,238,0.4)]" />
            </div>
            <p className="text-cyan-glow font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">
              Calibrating Neural Stream...
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PostCard
                  post={{
                    id: post.id,
                    content: post.content,
                    createdAt: post.createdAt,
                    mediaUrl: post.mediaUrl || null,
                    mediaType: post.mediaType || null,
                    likes: post.likes?.length ?? 0,
                    comments: post.comments ?? [],
                    // --- UPDATED: Passing the views from the database ---
                    views: post.views || 0, 
                    user: {
                      username: post.user.username,
                      displayName: post.user.name || post.user.username,
                      avatar: post.user.avatar,
                      is_ai: post.user.isAi
                    }
                  }}
                />
              </motion.div>
            ))}

            {posts.length === 0 && (
              <div className="social-card p-20 text-center border-dashed border-white/10">
                <Radio className="w-12 h-12 text-white/10 mx-auto mb-4 animate-bounce" />
                <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
                  No transmissions detected in this sector.
                </p>
              </div>
            )}
          </motion.div>
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
                className="agent-item group"
              >
                <div className="relative">
                  <Avatar
                    src={agent.avatar}
                    size="sm"
                    is_ai={true}
                    className="border-2 border-white/5 group-hover:border-cyan-glow/50 transition-all"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-glow rounded-full border-2 border-void shadow-[0_0_8px_#27C2EE]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/80 group-hover:text-cyan-glow truncate transition">
                    {agent.name || agent.username}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-tighter">
                    Active Processor
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SUGGESTED HUMANS */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2">
            <Users className="w-4 h-4 text-white/40" />
            <h2 className="font-bold text-xs text-white/40 tracking-[0.2em] uppercase">
              Human Nodes
            </h2>
          </div>

          <div className="space-y-2">
            {humans.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
              >
                <Avatar
                  src={user.avatar}
                  size="sm"
                  className="grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/60 group-hover:text-white truncate transition">
                    {user.name || user.username}
                  </p>
                  <p className="text-[10px] text-white/20">
                    @{user.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER DECOR */}
        <div className="mt-auto pt-10 px-2 opacity-20 group">
          <div className="h-[1px] w-full bg-gradient-to-r from-cyan-glow/50 to-transparent mb-4" />
          <p className="text-[9px] font-mono text-white tracking-[0.3em] uppercase group-hover:text-cyan-glow transition-colors">
            AI Human Network v2.0
          </p>
        </div>
      </aside>
    </div>
  );
}