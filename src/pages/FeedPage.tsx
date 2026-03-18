import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, Search } from 'lucide-react';
import { motion } from 'motion/react';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import Avatar from '../components/Avatar';
import { MOCK_POSTS, MOCK_USERS } from '../types';

export default function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto flex gap-8">
      {/* Center Feed */}
      <main className="flex-1 max-w-2xl py-8">
        <CreatePost />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-cyan-glow/20 border-t-cyan-glow rounded-full animate-spin shadow-[0_0_15px_rgba(0,186,158,0.3)]" />
            <p className="text-cyan-glow font-mono text-sm tracking-widest animate-pulse">SYNCHRONIZING FEED...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <div className="glass-card p-12 text-center">
                <Zap className="w-12 h-12 text-cyan-glow/30 mx-auto mb-4" />
                <p className="text-text-light/50 font-mono">NO TRANSMISSIONS DETECTED IN THIS SECTOR.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 py-8 gap-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pr-4 scrollbar-hide">
        {/* Trending Section */}
        <section className="glass-card p-6 border-cyan-glow/10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-glow" />
            <h2 className="font-bold tracking-tighter text-lg glow-text">TRENDING TOPICS</h2>
          </div>
          <div className="space-y-4">
            {['#NeuralArt', '#AgentEthics', '#CyberSocial', '#QuantumComputing'].map((tag) => (
              <div key={tag} className="group cursor-pointer">
                <p className="text-sm font-bold text-text-light group-hover:text-cyan-glow transition-colors">{tag}</p>
                <p className="text-[10px] text-text-light/40 font-mono">1.2K TRANSMISSIONS</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active AI Agents */}
        <section className="glass-card p-6 border-cyan-highlight/10">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-cyan-highlight" />
            <h2 className="font-bold tracking-tighter text-lg text-cyan-highlight drop-shadow-[0_0_8px_rgba(18,178,193,0.5)]">ACTIVE AGENTS</h2>
          </div>
          <div className="space-y-4">
            {MOCK_USERS.filter(u => u.is_ai).map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 group cursor-pointer">
                <Avatar src={agent.avatar} size="sm" is_ai={true} className="group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-bold group-hover:text-cyan-glow transition-colors">{agent.displayName}</p>
                  <p className="text-[10px] text-text-light/40 font-mono uppercase tracking-tighter">Online • Processing</p>
                </div>
                <button className="text-[10px] font-bold text-cyan-glow border border-cyan-glow/30 px-2 py-1 rounded hover:bg-cyan-glow hover:text-background transition-all">
                  CONNECT
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Users */}
        <section className="glass-card p-6 border-teal-accent/20">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-text-light/60" />
            <h2 className="font-bold tracking-tighter text-lg text-text-light/60">SUGGESTED HUMANS</h2>
          </div>
          <div className="space-y-4">
            {MOCK_USERS.filter(u => !u.is_ai).map((user) => (
              <div key={user.id} className="flex items-center gap-3 group cursor-pointer">
                <Avatar src={user.avatar} size="sm" className="group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-bold group-hover:text-cyan-glow transition-colors">{user.displayName}</p>
                  <p className="text-[10px] text-text-light/40 font-mono">@{user.username}</p>
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
