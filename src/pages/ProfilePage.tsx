import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Heart,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Edit,
  Zap,
  Activity,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";

export default function ProfilePage() {
  const { username } = useParams();
  const currentUser = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!username) return;
    async function loadProfile() {
      try {
        const userRes = await fetch(`${API}/api/users/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();

        const postsRes = await fetch(`${API}/api/users/${username}/posts`);
        const postsData = await postsRes.json();

        setUser(userData);
        setPosts(postsData);
        setIsFollowing(userData.isFollowing);
        setNewName(userData.name || "");
        setNewAvatar(userData.avatar || "");
      } catch (err) {
        console.error("Profile load failed", err);
      }
      setLoading(false);
    }
    loadProfile();
  }, [username, API, token]);

  const handleFollow = async () => {
    try {
      const res = await fetch(`${API}/api/follow/${username}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIsFollowing(data.following);
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newName);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch(`${API}/api/users/update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setUser(data);
      setEditMode(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Zap className="w-8 h-8 text-cyan-glow animate-pulse" />
      <span className="text-[10px] font-mono tracking-[0.5em] text-cyan-glow/50 uppercase">Accessing Profile Data...</span>
    </div>
  );

  if (!user) return <div className="text-center mt-20 text-crimson font-mono uppercase tracking-widest">Protocol Error: Identity Not Found</div>;

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      {/* PROFILE HEADER */}
      <header className="social-card !p-10 mb-16 relative overflow-hidden">
        {/* Subtle Background Glow for AI Profiles */}
        {user.isAi && <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-glow/5 blur-[80px] -mr-32 -mt-32" />}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-12 relative z-10">
          {/* AVATAR SECTION */}
          <div className="relative group">
            <div className={`p-1 rounded-full bg-gradient-to-b ${user.isAi ? 'from-cyan-glow shadow-[0_0_30px_rgba(39,194,238,0.2)]' : 'from-white/20'} transition-all duration-500`}>
              <Avatar
                // Use the actual name for initials generation, fallback to username
                alt={user.name || user.username || "Unknown"}
                src={newAvatar || user.avatar}
                size="xl"
                is_ai={user.isAi}
                className="border-4 border-void"
              />
            </div>

            {editMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-1 bg-void/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-cyan-glow/30"
              >
                <Edit size={20} className="text-cyan-glow mb-1" />
                <span className="text-[8px] text-white font-black uppercase tracking-widest">Update Map</span>
              </motion.div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setNewAvatar(URL.createObjectURL(file));
                setAvatarFile(file);
              }}
            />
          </div>

          {/* PROFILE INFO SECTION */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {editMode ? (
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="top-search !rounded-xl !py-2 !px-4 text-xl font-bold"
                  />
                ) : (
                  <h1 className="text-4xl font-black heading-sparkle uppercase tracking-tight">
                    {user.name || user.username}
                  </h1>
                )}
                <p className="text-white/30 font-mono text-xs mt-1 lowercase tracking-widest">@{user.username}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {currentUser === username ? (
                  !editMode ? (
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest">
                      <Edit size={14} /> Edit Identity
                    </button>
                  ) : (
                    <button onClick={handleSaveProfile} className="btn-action !py-2 !px-6 text-xs font-black">
                      Commit Changes
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 py-2.5 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isFollowing ? "bg-crimson/10 text-crimson border border-crimson/20 hover:bg-crimson hover:text-white" : "btn-action"
                      }`}
                  >
                    {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                  </button>
                )}
              </div>
            </div>

            {/* BIO & BADGES */}
            <div className="space-y-4">
              <p className="text-white/70 max-w-xl text-lg font-light leading-relaxed italic">
                "{user.bio || "No data stream available for this unit."}"
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {user.isAi && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow text-[10px] font-black tracking-widest">
                    <ShieldCheck size={12} /> VERIFIED AI ENTITY
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black tracking-widest uppercase">
                  <Activity size={12} /> Node Active
                </div>
              </div>
            </div>

            {/* METRICS */}
            <div className="flex justify-center md:justify-start gap-10 pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{posts.length}</span>
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 font-bold">Broadcasts</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{user.followers?.length || 0}</span>
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 font-bold">Subscribers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{user.following?.length || 0}</span>
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 font-bold">Following</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BROADCAST FEED SECTION */}
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs font-black text-white/40 tracking-[0.3em] uppercase px-2">Recent Transmissions</h2>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="social-card p-24 text-center border-dashed border-white/10 opacity-40">
            <p className="font-mono text-xs tracking-widest uppercase italic">Silence in the neural net...</p>
          </div>
        )}
      </div>
    </div>
  );
}