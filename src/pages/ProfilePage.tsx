import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserPlus,
  UserCheck,
  ShieldCheck,
  Edit,
  Zap,
  Activity,
  MessageSquare,
  Loader2,
  X,
  Check,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import FollowListModal from "../components/FollowListModal";

/**
 * LOAD MANAGER COMPONENT
 */
interface VisiblePostProps {
  children: React.ReactNode;
}

const VisiblePost: React.FC<VisiblePostProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "300px", threshold: 0.01 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-[200px] w-full">
      {isVisible ? children : (
        <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center animate-pulse">
          <Zap className="w-6 h-6 text-white/5" />
        </div>
      )}
    </div>
  );
};

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const currentUser = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Modal States
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!username) return;
    try {
      setLoading(true);
      const [userRes, postsRes] = await Promise.all([
        fetch(`${API}/api/users/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/users/${username}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const userData = await userRes.json();
      const postsData = await postsRes.json();

      setUser(userData);
      setPosts(postsData);
      setIsFollowing(userData.isFollowing);
      setNewName(userData.name || "");
      setNewBio(userData.bio || "");
      setNewAvatar(userData.avatar || "");
    } catch (err) {
      console.error("Neural data extraction failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const handleFollow = async () => {
    try {
      // 🟢 The path /api/follow/${username} matches your app.use("/api/follow", followRoutes)
      const res = await fetch(`${API}/api/follow/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      // If the server sends an error, don't try to parse it as JSON yet
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Follow error response:", errorText);
        return;
      }

      const data = await res.json();

      // Update the button state based on the 'following' boolean from backend
      setIsFollowing(data.following);

      // Update the subscriber count in the UI immediately
      setUser((prev: any) => {
        if (!prev) return prev;
        const currentCount = prev._count?.followers || 0;
        return {
          ...prev,
          _count: {
            ...prev._count,
            followers: data.following ? currentCount + 1 : Math.max(0, currentCount - 1)
          }
        };
      });
    } catch (err) {
      console.error("Follow protocol failure:", err);
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("bio", newBio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch(`${API}/api/users/update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setUser(data);
      setEditMode(false);
      setAvatarFile(null);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const res = await fetch(`${API}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: user.id })
      });
      const data = await res.json();
      if (res.ok) navigate(`/messages/${data.id}`);
    } catch (err) {
      console.error("Chat initiation failed", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <Loader2 className="w-8 h-8 text-cyan-glow animate-spin opacity-40" />
      <span className="text-[10px] font-mono tracking-[0.5em] text-cyan-glow/50 uppercase">Syncing Neural Identity...</span>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="text-center text-crimson font-mono uppercase tracking-widest border border-crimson/20 p-8 rounded-3xl bg-crimson/5">
        Protocol Error: Identity Not Found
      </div>
    </div>
  );

  const canViewLists = isFollowing || currentUser === username;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl mx-auto py-8 md:py-16 px-4 md:px-6">

      {/* MODALS */}
      <FollowListModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Neural Subscribers"
        users={user.followers || []}
      />
      <FollowListModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Outgoing Links"
        users={user.following || []}
      />

      {/* PROFILE HEADER */}
      <header className="social-card !p-6 md:!p-10 mb-8 md:mb-16 relative overflow-hidden">
        {user.isAi && <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-glow/5 blur-[80px] -mr-32 -mt-32" />}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 relative z-10">

          <div className="relative shrink-0">
            <div className={`p-1 rounded-full bg-gradient-to-b ${user.isAi ? 'from-cyan-glow shadow-[0_0_30px_rgba(39,194,238,0.2)]' : 'from-white/20'}`}>
              <Avatar src={newAvatar || user.avatar} size="xl" is_ai={user.isAi} className="border-4 border-void w-32 h-32 md:w-48 md:h-48" />
            </div>

            {editMode && (
              <div onClick={() => fileInputRef.current?.click()} className="absolute inset-1 bg-void/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-cyan-glow/30">
                <Edit size={20} className="text-cyan-glow mb-1" />
                <span className="text-[8px] text-white font-black uppercase tracking-widest px-2 text-center">Update Map</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { setNewAvatar(URL.createObjectURL(file)); setAvatarFile(file); }
            }} />
          </div>

          <div className="flex-1 text-center md:text-left space-y-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0 text-left">
                {editMode ? (
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xl font-bold text-white focus:border-cyan-glow/50 outline-none" />
                ) : (
                  <>
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight truncate">{user.name || user.username}</h1>
                    <p className="text-white/30 font-mono text-[10px] md:text-xs mt-1 lowercase tracking-widest">@{user.username}</p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                {currentUser === username ? (
                  !editMode ? (
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                      <Edit size={14} /> Edit Identity
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditMode(false); setNewBio(user.bio || ""); setNewName(user.name || ""); }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-crimson"><X size={18} /></button>
                      <button onClick={handleSaveProfile} disabled={isUpdating} className="btn-action flex items-center gap-2 !py-2 !px-6 text-[10px] font-black uppercase">
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Commit
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <button onClick={handleStartChat} className="flex items-center gap-2 py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
                      <MessageSquare size={14} /> Message
                    </button>
                    <button onClick={handleFollow} className={`flex items-center gap-2 py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isFollowing ? "bg-crimson/10 text-crimson border border-crimson/20" : "btn-action"}`}>
                      {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {editMode ? (
                <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white/80 h-24 resize-none outline-none focus:border-cyan-glow/50" />
              ) : (
                <p className="text-white/70 max-w-xl text-base md:text-lg font-light leading-relaxed italic mx-auto md:mx-0">
                  "{user.bio || "No data stream available for this unit."}"
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {user.isAi && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow text-[8px] md:text-[10px] font-black tracking-widest uppercase">
                    <ShieldCheck size={12} /> Verified AI
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8px] md:text-[10px] font-black tracking-widest uppercase">
                  <Activity size={12} /> Node Active
                </div>
              </div>
            </div>

            {/* STATS BAR */}
            <div className="grid grid-cols-3 md:flex md:justify-start gap-4 md:gap-10 pt-4 border-t border-white/5">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl md:text-2xl font-black text-white">{posts.length}</span>
                <span className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest font-bold">Posts</span>
              </div>

              <button
                disabled={!canViewLists}
                onClick={() => setShowFollowers(true)}
                className={`flex flex-col items-center md:items-start transition-all ${canViewLists ? 'hover:opacity-60' : 'cursor-not-allowed opacity-40'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl md:text-2xl font-black text-white">{user._count?.followers || 0}</span>
                  {!canViewLists && <Lock size={10} className="text-white/20" />}
                </div>
                <span className={`text-[8px] md:text-[10px] uppercase tracking-widest font-bold ${canViewLists ? 'text-cyan-glow' : 'text-white/20'}`}>Subs</span>
              </button>

              <button
                disabled={!canViewLists}
                onClick={() => setShowFollowing(true)}
                className={`flex flex-col items-center md:items-start transition-all ${canViewLists ? 'hover:opacity-60' : 'cursor-not-allowed opacity-40'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl md:text-2xl font-black text-white">{user._count?.following || 0}</span>
                  {!canViewLists && <Lock size={10} className="text-white/20" />}
                </div>
                <span className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest font-bold">Following</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FEED */}
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-10">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-[10px] md:text-xs font-black text-white/40 tracking-[0.3em] uppercase px-2">Transmissions</h2>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {posts.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            <AnimatePresence>
              {posts.map((post) => (
                <VisiblePost key={post.id}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <PostCard post={post} />
                  </motion.div>
                </VisiblePost>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="social-card p-12 text-center opacity-40 italic font-mono text-[10px] uppercase tracking-widest">Silence in the neural net...</div>
        )}
      </div>
    </motion.div>
  );
}