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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";

/**
 * LOAD MANAGER COMPONENT
 * Ensures profile posts only render when visible to save memory.
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
  
  // EDIT MODE STATES
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    setUser(null);
    setEditMode(false);

    async function loadProfile() {
      try {
        const userRes = await fetch(`${API}/api/users/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();

        const postsRes = await fetch(`${API}/api/users/${username}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const postsData = await postsRes.json();

        setUser(userData);
        setPosts(postsData);
        setIsFollowing(userData.isFollowing);
        
        // Sync local edit states with fetched data
        setNewName(userData.name || "");
        setNewBio(userData.bio || "");
        setNewAvatar(userData.avatar || "");
      } catch (err) {
        console.error("Neural data extraction failed", err);
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
      setUser((prev: any) => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { followerId: 'me' }]
          : (prev.followers || []).slice(0, -1)
      }));
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("bio", newBio); // Sent to your updated backend
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
      <span className="text-[10px] font-mono tracking-[0.5em] text-cyan-glow/50 uppercase text-center px-6">
        Syncing Neural Identity...
      </span>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="text-center text-crimson font-mono uppercase tracking-widest border border-crimson/20 p-8 rounded-2xl bg-crimson/5 w-full max-w-md">
        Protocol Error: Identity Not Found
      </div>
    </div>
  );

  return (
    <motion.div
      key={username}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-5xl mx-auto py-8 md:py-16 px-4 md:px-6"
    >
      <header className="social-card !p-6 md:!p-10 mb-8 md:mb-16 relative overflow-hidden">
        {user.isAi && <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-cyan-glow/5 blur-[80px] -mr-16 -mt-16 md:-mr-32 md:-mt-32" />}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 relative z-10">
          
          {/* AVATAR SECTION */}
          <div className="relative group shrink-0">
            <div className={`p-1 rounded-full bg-gradient-to-b ${user.isAi ? 'from-cyan-glow shadow-[0_0_30px_rgba(39,194,238,0.2)]' : 'from-white/20'} transition-all duration-500`}>
              <Avatar
                alt={user.name || user.username}
                src={newAvatar || user.avatar}
                size="xl"
                is_ai={user.isAi}
                className="border-4 border-void w-32 h-32 md:w-48 md:h-48"
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
                <span className="text-[8px] text-white font-black uppercase tracking-widest text-center px-2">Update Visual Map</span>
              </motion.div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewAvatar(URL.createObjectURL(file));
                  setAvatarFile(file);
                }
              }}
            />
          </div>

          {/* IDENTITY INFO SECTION */}
          <div className="flex-1 text-center md:text-left space-y-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0 text-left w-full md:w-auto">
                {editMode ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-cyan-glow/50 uppercase tracking-[0.2em] ml-1">Display Name</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xl font-bold text-white focus:outline-none focus:border-cyan-glow/50 transition-all font-mono"
                      placeholder="Input name..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight truncate">
                      {user.name || user.username}
                    </h1>
                    <p className="text-white/30 font-mono text-[10px] md:text-xs mt-1 lowercase tracking-widest truncate">@{user.username}</p>
                  </>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                {currentUser === username ? (
                  !editMode ? (
                    <button onClick={() => setEditMode(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest">
                      <Edit size={14} /> Edit Identity
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => { setEditMode(false); setNewBio(user.bio || ""); setNewName(user.name || ""); }} 
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-crimson transition-all"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        onClick={handleSaveProfile} 
                        disabled={isUpdating}
                        className="btn-action flex-1 md:flex-none flex items-center justify-center gap-2 !py-2 !px-6 text-[10px] font-black uppercase disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Commit Changes
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleStartChat}
                      className="flex items-center justify-center gap-2 py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <MessageSquare size={14} /> Message
                    </button>

                    <button
                      onClick={handleFollow}
                      className={`flex items-center justify-center gap-2 py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isFollowing ? "bg-crimson/10 text-crimson border border-crimson/20 hover:bg-crimson hover:text-white" : "btn-action"}`}
                    >
                      {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* BIO SECTION */}
              {editMode ? (
                <div className="space-y-2">
                   <label className="text-[9px] font-mono text-cyan-glow/50 uppercase tracking-[0.2em] ml-1">Neural Signature (Bio)</label>
                   <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-light text-white/80 focus:outline-none focus:border-cyan-glow/50 transition-all h-28 resize-none"
                    placeholder="Describe your presence in the network..."
                   />
                </div>
              ) : (
                <p className="text-white/70 max-w-xl text-base md:text-lg font-light leading-relaxed italic mx-auto md:mx-0">
                  "{user.bio || "No data stream available for this unit."}"
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {user.isAi && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow text-[8px] md:text-[10px] font-black tracking-widest">
                    <ShieldCheck size={12} /> VERIFIED AI ENTITY
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
                <span className="text-xl md:text-2xl font-black text-white leading-none">{posts.length}</span>
                <span className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest mt-1 font-bold">Posts</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl md:text-2xl font-black text-white leading-none">{user.followers?.length || 0}</span>
                <span className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest mt-1 font-bold">Subs</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl md:text-2xl font-black text-white leading-none">{user.following?.length || 0}</span>
                <span className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest mt-1 font-bold">Following</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* RECENT TRANSMISSIONS FEED */}
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-10">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <h2 className="text-[10px] md:text-xs font-black text-white/40 tracking-[0.3em] uppercase px-2 whitespace-nowrap">Recent Transmissions</h2>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {posts.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            <AnimatePresence>
              {posts.map((post) => (
                <VisiblePost key={post.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                </VisiblePost>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="social-card p-12 md:p-24 text-center border-dashed border-white/10 opacity-40">
            <p className="font-mono text-[10px] md:text-xs tracking-widest uppercase italic">Silence in the neural net...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}