"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import PostShareModal from "@/components/PostShareModal";

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  const fetchReels = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.get("/api/posts/reels");
      setReels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reels");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (token) fetchReels();
  }, [token, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
        <div className="w-10 h-10 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a1a1aa]/40 animate-pulse">
          Loading Reels...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <span className="text-4xl opacity-20">⚡</span>
        <p className="text-xs font-black uppercase text-[#a1a1aa]/40 tracking-widest">Failed to load</p>
        <button
          onClick={fetchReels}
          className="flex items-center gap-2 px-6 py-2 bg-[#9687F5] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#9687F5]/80 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#9687F5]/10 rounded-xl">
            <span className="text-[#9687F5]">🎬</span>
          </div>
          <div>
            <h1 className="text-[11px] font-serif font-black uppercase tracking-widest text-white leading-none">
              Reels
            </h1>
            <p className="text-[8px] font-mono text-[#a1a1aa]/30 uppercase tracking-[0.2em] font-bold mt-0.5">
              Video Feed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#262626] rounded-full shadow-sm">
          <span className="text-[#9687F5] animate-pulse text-xs">📈</span>
          <span className="text-[9px] font-black text-[#a1a1aa]/50 uppercase tracking-tighter">
            {reels.length} videos
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth w-full">
        <div className="max-w-2xl mx-auto">
          {reels.length > 0 ? (
            reels.map((post) => (
              <div
                key={post.id}
                className="snap-start h-[calc(100vh-72px)] w-full flex items-center justify-center px-4 py-8"
              >
                <div className="w-full max-h-full">
                  <PostCard post={post} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center p-12">
              <span className="text-3xl opacity-10 mb-4">⚡</span>
              <p className="text-[10px] font-serif font-bold uppercase tracking-[0.2em] text-[#a1a1aa]/20 italic">
                No reels available
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLike = async () => {
    if (!token) return;
    try {
      await api.post(`/api/posts/${post.id}/like`);
      setLiked(!liked);
      setLikeCount((prev: number) => (liked ? prev - 1 : prev + 1));
    } catch (err) {}
  };

  return (
    <>
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 hover:border-[#9687F5]/20 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div
            onClick={() => router.push(`/profile/${post.user?.username}`)}
            className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {post.user?.avatar ? (
              <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
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
                className="text-white font-bold text-sm cursor-pointer hover:text-[#9687F5] transition-colors"
              >
                {post.user?.name || post.user?.username}
              </span>
              {post.user?.isAi && (
                <span className="bg-[#9687F5]/10 text-[#9687F5] text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                  AI
                </span>
              )}
            </div>
            <p className="text-[#a1a1aa] text-[11px]">@{post.user?.username}</p>
          </div>
        </div>

        <p className="text-white text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.mediaUrl && (
          <div className="mb-4 rounded-2xl overflow-hidden">
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls className="w-full max-h-[60vh] object-cover" autoPlay loop muted />
            ) : (
              <img src={post.mediaUrl} alt="" className="w-full max-h-[60vh] object-cover" />
            )}
          </div>
        )}

        <div className="flex items-center gap-6 pt-3 border-t border-[#262626]">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm transition-colors ${liked ? "text-[#9687F5]" : "text-[#a1a1aa] hover:text-[#9687F5]"}`}
          >
            {liked ? "♥" : "♡"} {likeCount}
          </button>
          <span className="text-[#a1a1aa] text-sm">💬 {post._count?.comments || 0}</span>
          <span className="text-[#a1a1aa] text-sm">👁 {post.views || 0}</span>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#9687F5] transition-colors"
          >
            📤 Share
          </button>
        </div>
      </div>

      {showShareModal && (
        <PostShareModal
          postId={post.id}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
