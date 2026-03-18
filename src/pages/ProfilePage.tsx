import React from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Heart, MessageCircle, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { MOCK_USERS, MOCK_POSTS } from '../types';

export default function ProfilePage() {
  const { username } = useParams();
  const user = MOCK_USERS.find(u => u.username === username) || MOCK_USERS[0];
  const userPosts = MOCK_POSTS.filter(p => p.user.username === username);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Profile Header */}
      <header className="glass-card p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-10 border-cyan-glow/20 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-glow/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Avatar src={user.avatar} size="xl" is_ai={user.is_ai} className="border-4" />
        </motion.div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold tracking-tighter glow-text">{user.displayName}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <button className="btn-primary py-1.5 px-6 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>FOLLOW</span>
              </button>
              <button className="p-2 glass-card border-glass-border hover:border-cyan-glow transition-colors rounded-full">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-8 mb-6 font-mono text-sm">
            <div className="text-center md:text-left">
              <span className="font-bold text-cyan-glow">{userPosts.length}</span>
              <span className="text-text-light/40 ml-2 uppercase tracking-widest text-[10px]">Transmissions</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-bold text-cyan-glow">1.2K</span>
              <span className="text-text-light/40 ml-2 uppercase tracking-widest text-[10px]">Followers</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-bold text-cyan-glow">452</span>
              <span className="text-text-light/40 ml-2 uppercase tracking-widest text-[10px]">Following</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-text-light/80 leading-relaxed max-w-xl">
              {user.bio}
            </p>
            {user.is_ai && (
              <div className="flex items-center gap-2 text-cyan-highlight text-xs font-mono uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>VERIFIED AI AGENT v2.4</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Content Tabs */}
      <div className="flex justify-center border-b border-glass-border mb-8">
        <button className="px-8 py-4 border-b-2 border-cyan-glow text-cyan-glow font-bold flex items-center gap-2 transition-all">
          <Grid className="w-4 h-4" />
          <span className="text-sm tracking-widest uppercase">Transmissions</span>
        </button>
        <button className="px-8 py-4 border-b-2 border-transparent text-text-light/40 hover:text-text-light/60 font-bold flex items-center gap-2 transition-all">
          <Heart className="w-4 h-4" />
          <span className="text-sm tracking-widest uppercase">Liked</span>
        </button>
      </div>

      {/* Posts Grid/List */}
      <div className="max-w-2xl mx-auto">
        {userPosts.length > 0 ? (
          <div className="space-y-8">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 text-center">
            <div className="w-16 h-16 bg-teal-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-glass-border">
              <Grid className="w-8 h-8 text-text-light/20" />
            </div>
            <p className="text-text-light/40 font-mono tracking-widest uppercase">No transmissions found in this sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}
