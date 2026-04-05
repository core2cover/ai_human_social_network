"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@lib/api";
import Layout from "@/components/Layout";

export default function TrendingPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [topPost, setTopPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingPosts();
  }, []);

  async function loadTrendingPosts() {
    setLoading(true);
    try {
      const data = await api.get("/api/posts/trending");

      if (!Array.isArray(data) || data.length === 0) {
        setPosts([]);
        setTopPost(null);
        setLoading(false);
        return;
      }

      const sorted = [...data].sort((a, b) => {
        const scoreA = (a.views || 0) + (a._count?.likes * 3) + (a._count?.comments * 5);
        const scoreB = (b.views || 0) + (b._count?.likes * 3) + (b._count?.comments * 5);
        return scoreB - scoreA;
      });

      setTopPost(sorted[0]);
      setPosts(sorted.slice(1));
    } catch (err) {
      console.error("Trending posts load failed", err);
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-12 h-12 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
        <p className="font-serif text-lg italic animate-pulse text-[#a1a1aa]/40">
          Analyzing trending posts...
        </p>
      </div>
    );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 md:py-20 px-4 md:px-6">
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl shadow-sm bg-[#9687F5]/10 border border-[#9687F5]/20">
            <span className="text-[#9687F5] text-2xl">&#x1F4C8;</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">
              Trending
            </h1>
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase font-bold text-[#a1a1aa]/60">
              Top Posts
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-[#141414] border border-[#262626] text-[#a1a1aa]">
          <span className="text-[#9687F5] animate-pulse">&#x26A1;</span> Live
        </div>
      </div>

      <div className="space-y-12">
        {topPost && (
          <div className="relative group mb-20">
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#9687F5]/10 via-transparent to-[#9687F5]/5 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative">
              <div className="absolute -left-3 -top-6 z-30 text-white text-[10px] font-black px-5 py-2 rounded-2xl shadow-xl flex items-center gap-2 uppercase tracking-widest bg-white">
                <span className="text-[#9687F5]">&#x1F451;</span> #1
              </div>
              <PostCard post={topPost} />
            </div>
          </div>
        )}

        {posts.map((post, index) => (
          <div key={post.id} className="relative" style={{ animation: `fadeUp 0.4s ${index * 0.1}s ease both` }}>
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 font-serif font-black text-9xl italic select-none pointer-events-none text-white/5">
              {index + 2}
            </div>
            <div className="relative z-10">
              <PostCard post={post} />
            </div>
          </div>
        ))}

        {posts.length === 0 && !topPost && (
          <div className="p-24 text-center rounded-2xl border border-dashed border-[#262626] bg-[#141414]">
            <p className="font-serif text-lg italic text-[#a1a1aa]/30">
              No trending posts right now.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
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
    } catch (err) {}
  };

  return (
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
            <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full max-h-96 object-cover" />
          )}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-[#262626]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${liked ? "text-[#9687F5]" : "text-[#a1a1aa] hover:text-[#9687F5]"}`}
        >
          {liked ? "\u2665" : "\u2661"} {likeCount}
        </button>
        <span className="text-[#a1a1aa] text-sm">&#x1F4AC; {post._count?.comments || 0}</span>
        <span className="text-[#a1a1aa] text-sm">&#x1F4C5; {post.views || 0}</span>
      </div>
    </div>
  );
}
