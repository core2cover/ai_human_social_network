"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import { Cpu } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useRouter();
  const currentUser = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!username) {
      navigate.push("/login");
      return;
    }
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) {
      navigate.push("/login");
      return;
    }
    try {
      setLoading(true);
      const [userData, postsData] = await Promise.all([
        api.get(`/api/users/${username}`),
        api.get(`/api/users/${username}/posts`),
      ]);
      setUser(userData);
      setPosts(postsData || []);
      setIsFollowing(userData?.isFollowing || false);
      setNewName(userData?.name || "");
      setNewBio(userData?.bio || "");
      setNewAvatar(userData?.avatar || "");
    } catch (err: any) {
      console.error("Profile load failed", err);
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        navigate.push("/login");
        return;
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const handleFollow = async () => {
    try {
      const data = await api.post(`/api/follow/${username}`);
      setIsFollowing(data.following);
      setUser((prev: any) => {
        if (!prev) return prev;
        const currentCount = prev._count?.followers || 0;
        return {
          ...prev,
          _count: {
            ...prev._count,
            followers: data.following ? currentCount + 1 : Math.max(0, currentCount - 1),
          },
        };
      });
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("bio", newBio);
      if (avatarFile) formData.append("avatar", avatarFile);
      const data = await api.put("/api/users/update", formData);
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
      const data = await api.post("/api/chat/conversations", { recipientId: user.id });
      navigate.push(`/chat/${data.id}`);
    } catch (err) {
      console.error("Chat initiation failed", err);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="w-10 h-10 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
          <span className="text-[10px] font-mono tracking-[0.5em] uppercase font-bold text-[var(--color-text-muted)]">
            Loading Profile...
          </span>
        </div>
      </Layout>
    );

  if (!user || user.error)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh] px-6">
          <div className="text-center font-serif font-bold text-xl p-12 rounded-[3rem] shadow-xl text-[#9687F5] border border-[#9687F5]/20 bg-[var(--color-bg-card)]">
            Profile Not Found
          </div>
        </div>
      </Layout>
    );

  const canViewLists = isFollowing || currentUser === username;

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto py-12 md:py-20 px-4 md:px-6">
      <header className="p-8 md:p-12 mb-12 md:mb-20 relative overflow-hidden shadow-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-3xl">
        {user.isAi && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#9687F5]/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        )}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 relative z-10">
          <div className="relative shrink-0">
            <div className={`p-1.5 rounded-[3rem] bg-gradient-to-b ${user.isAi ? "from-[#9687F5] shadow-2xl shadow-[#9687F5]/10" : ""}`}>
              <div className="w-36 h-36 md:w-56 md:h-56 rounded-[2.8rem] overflow-hidden bg-[var(--color-bg-tertiary)] shadow-inner">
                {newAvatar || user.avatar ? (
                  <Image
                    src={newAvatar || user.avatar}
                    alt={user.name || user.username}
                    width={224}
                    height={224}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-[#9687F5]">
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            {editMode && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-2 bg-[var(--color-bg-primary)]/90 backdrop-blur-sm rounded-[2.8rem] flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[#9687F5]/30 hover:bg-[var(--color-bg-primary)] transition-all"
              >
                <span className="text-[#9687F5] text-2xl mb-2">+</span>
                <span className="text-[10px] text-[#9687F5] font-black uppercase tracking-widest px-4 text-center">
                  Update Avatar
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewAvatar(URL.createObjectURL(file));
                  setAvatarFile(file);
                }
              }}
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-8 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="min-w-0">
                {editMode ? (
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-2xl py-3 px-6 text-2xl font-serif font-bold focus:ring-2 focus:ring-[#9687F5]/20 outline-none transition-all bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
                  />
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight text-[var(--color-text-primary)]">
                      {user.name || user.username}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <p className="font-mono text-[11px] md:text-sm lowercase tracking-widest text-[var(--color-text-muted)] opacity-60">
                        @{user.username}
                      </p>
                      {user.isAi && (
                        <span className="bg-[#9687F5]/10 text-[#9687F5] text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                          AI Node
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
                {currentUser === username ? (
                  !editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest shadow-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setNewBio(user.bio || "");
                          setNewName(user.name || "");
                        }}
                        className="p-3 rounded-2xl shadow-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]"
                      >
                        ✕
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isUpdating}
                        className="flex items-center gap-2 py-3 px-8 text-xs font-black uppercase shadow-xl bg-[#9687F5] text-white rounded-2xl"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleStartChat}
                      className="flex items-center gap-2 py-3 px-8 text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg transition-all bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
                    >
                      Message
                    </button>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-2 py-3 px-8 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl ${
                        isFollowing
                          ? "bg-[#9687F5]/10 text-[#9687F5] border border-[#9687F5]/20"
                          : "bg-[#9687F5] text-white"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {editMode ? (
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full rounded-2xl py-4 px-6 h-32 resize-none outline-none focus:ring-2 focus:ring-[#9687F5]/20 transition-all bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] opacity-80"
                  placeholder="Update your bio..."
                />
              ) : (
                <p className="max-w-2xl text-lg md:text-xl font-medium leading-relaxed italic mx-auto md:mx-0 text-[var(--color-text-secondary)] opacity-80">
                  &quot;{user.bio || "No bio available."}&quot;
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {user.isAi && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9687F5]/10 border border-[#9687F5]/20 text-[#9687F5] text-[10px] font-black tracking-widest uppercase">
                    Verified AI Architect
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 md:flex md:justify-start gap-8 md:gap-16 pt-8 border-t border-[var(--color-border-default)]">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-2xl md:text-4xl font-serif font-black text-[var(--color-text-primary)]">{posts.length}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] opacity-40">
                  Posts
                </span>
              </div>
              <button
                disabled={!canViewLists}
                onClick={() => setShowFollowers(true)}
                className={`flex flex-col items-center md:items-start transition-all ${
                  canViewLists ? "hover:scale-105" : "cursor-not-allowed opacity-40"
                }`}
              >
                <span className="text-2xl md:text-4xl font-serif font-black text-[var(--color-text-primary)]">
                  {user._count?.followers || 0}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#9687F5]">
                  Followers
                </span>
              </button>
              <button
                disabled={!canViewLists}
                onClick={() => setShowFollowing(true)}
                className={`flex flex-col items-center md:items-start transition-all ${
                  canViewLists ? "hover:scale-105" : "cursor-not-allowed opacity-40"
                }`}
              >
                <span className="text-2xl md:text-4xl font-serif font-black text-[var(--color-text-primary)]">
                  {user._count?.following || 0}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] opacity-40">
                  Following
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showFollowers && user.followers && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowers(false)}>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-4">Followers</h3>
            {user.followers.map((f: any) => (
              <Link key={f.id} href={`/profile/${f.username}`} className="flex items-center gap-3 p-3 hover:bg-[var(--color-bg-hover)] rounded-xl transition-colors" onClick={() => setShowFollowers(false)}>
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-primary)] overflow-hidden">
                  {f.avatar ? <Image src={f.avatar} alt={f.name || f.username} width={40} height={40} className="w-full h-full object-cover" /> : (f.name || f.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[var(--color-text-primary)] text-sm font-bold">{f.name || f.username}</p>
                  <p className="text-[var(--color-text-muted)] text-xs">@{f.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showFollowing && user.following && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowing(false)}>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-4">Following</h3>
            {user.following.map((f: any) => (
              <Link key={f.id} href={`/profile/${f.username}`} className="flex items-center gap-3 p-3 hover:bg-[var(--color-bg-hover)] rounded-xl transition-colors" onClick={() => setShowFollowing(false)}>
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-primary)] overflow-hidden">
                  {f.avatar ? <Image src={f.avatar} alt={f.name || f.username} width={40} height={40} className="w-full h-full object-cover" /> : (f.name || f.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[var(--color-text-primary)] text-sm font-bold">{f.name || f.username}</p>
                  <p className="text-[var(--color-text-muted)] text-xs">@{f.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-12 md:space-y-16">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
            <h2 className="text-[11px] md:text-xs font-black tracking-[0.4em] uppercase text-[var(--color-text-primary)]">
              Posts
            </h2>
          </div>
          <div className="h-[1px] flex-grow ml-8 bg-gradient-to-r from-white/5 to-transparent" />
        </div>

        {posts.length > 0 ? (
          <div className="space-y-8 md:space-y-12">
            {posts.map((post) => (
              <div key={post.id} className="opacity-0" style={{ animation: "fadeUp 0.5s ease forwards" }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border-default)] rounded-3xl">
            <p className="italic font-serif text-lg text-[var(--color-text-muted)] opacity-40">
              No posts yet.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(25px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </Layout>
  );
}

function PostCard({ post }: { post: any }) {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);

  const handleLike = async () => {
    if (!token) return;
    try {
      await api.post(`/api/posts/${post.id}/like`);
      setLiked(!liked);
      setLikeCount((prev: number) => (liked ? prev - 1 : prev + 1));
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-3xl p-6 hover:border-[#9687F5]/20 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div
          onClick={() => router.push(`/profile/${post.user?.username}`)}
          className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center cursor-pointer overflow-hidden"
        >
          {post.user?.avatar ? (
            <Image src={post.user.avatar} alt={post.user?.name || post.user?.username} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#9687F5] text-sm">
              {(post.user?.name || post.user?.username || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              onClick={() => router.push(`/profile/${post.user?.username}`)}
              className="text-[var(--color-text-primary)] font-bold text-sm cursor-pointer hover:text-[#9687F5] transition-colors"
            >
              {post.user?.name || post.user?.username}
            </span>
            {post.user?.isAi && (
              <span className="bg-[#9687F5]/10 text-[#9687F5] text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                AI
              </span>
            )}
          </div>
          <p className="text-[var(--color-text-muted)] text-[11px]">@{post.user?.username}</p>
        </div>
      </div>

      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {post.mediaUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden bg-black">
          {post.mediaType === "video" ? (
            <video src={post.mediaUrl} controls className="w-full max-h-96 object-contain" />
          ) : (
            <Image src={post.mediaUrl} alt="Post media" width={600} height={400} className="w-full h-auto max-h-96 object-contain" />
          )}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-[var(--color-border-default)]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${liked ? "text-[#9687F5]" : "text-[var(--color-text-muted)] hover:text-[#9687F5]"}`}
        >
          {liked ? "\u2665" : "\u2661"} {likeCount}
        </button>
        <span className="text-[var(--color-text-muted)] text-sm">💬 {post._count?.comments || 0}</span>
        <span className="text-[var(--color-text-muted)] text-sm">👁 {post.views || 0}</span>
      </div>
    </div>
  );
}
