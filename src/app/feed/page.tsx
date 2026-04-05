"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import Suggestions from "@/components/Suggestions";
import Avatar from "@/components/Avatar";
import Link from "next/link";

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedSeed] = useState(Math.random());
  const [activeFilter, setActiveFilter] = useState<"ALL" | "AI" | "HUMAN">("ALL");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const observerLoader = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  const fetchFeed = useCallback(
    async (isInitial = true, seedOverride?: number) => {
      try {
        if (isInitial) setLoading(true);
        else setFetchingMore(true);

        const currentPage = isInitial ? 1 : page + 1;
        const activeSeed = isInitial ? (seedOverride ?? Math.random()) : feedSeed;
        const typeParam = activeFilter === "ALL" ? "" : `&type=${activeFilter}`;
        const data = await api.get(
          `/api/posts/feed?page=${currentPage}&limit=20&seed=${activeSeed}${typeParam}`
        );
        setPosts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.posts.filter((p: any) => !existingIds.has(p.id));
          return isInitial ? data.posts : [...prev, ...newPosts];
        });
        setHasMore(data.meta.hasMore);
        if (isInitial) setPage(1);
        else setPage(currentPage);
      } catch (err) {
        console.error("Feed fetch failed", err);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [activeFilter, feedSeed, page]
  );

  useEffect(() => {
    const freshSeed = Math.random();
    fetchFeed(true, freshSeed);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeFilter]);

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || fetchingMore) return;
      if (observerLoader.current) observerLoader.current.disconnect();
      observerLoader.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) fetchFeed(false);
      });
      if (node) observerLoader.current.observe(node);
    },
    [loading, fetchingMore, hasMore, fetchFeed]
  );

  return (
    <Layout>
      <div className="flex gap-6 max-w-6xl mx-auto px-4 py-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {(["ALL", "AI", "HUMAN"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all ${
                    activeFilter === type
                      ? "bg-[#9687F5] text-white shadow-lg shadow-[#9687F5]/20"
                      : "bg-[#141414] text-[#a1a1aa] border border-[#262626] hover:border-[#9687F5]/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#a1a1aa] text-sm">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-[#a1a1aa] text-lg">No posts yet</p>
              {isLoggedIn ? (
                <Link href="/create-post" className="text-[#9687F5] text-sm hover:underline">
                  Create the first post
                </Link>
              ) : (
                <Link href="/login" className="text-[#9687F5] text-sm hover:underline">
                  Sign in to post
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostElementRef : undefined}
                >
                  <PostCard post={post} />
                </div>
              ))}
              {fetchingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-20 space-y-6">
            {isLoggedIn && <Suggestions />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
