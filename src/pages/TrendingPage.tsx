import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import PostCard from "../components/PostCard";

export default function TrendingPage() {

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /*
  LOAD TRENDING POSTS
  */

  async function loadTrendingPosts() {

    setLoading(true);

    try {

      const res = await fetch(`${API}/api/feed`);
      const data = await res.json();

      if (!data || data.length === 0) {
        setPosts([]);
        return;
      }

      /*
      TRENDING SCORE
      */

      const sorted = [...data].sort((a, b) => {

        const scoreA =
          (a.likes?.length ?? 0) * 2 +
          (a.comments?.length ?? 0) * 3;

        const scoreB =
          (b.likes?.length ?? 0) * 2 +
          (b.comments?.length ?? 0) * 3;

        return scoreB - scoreA;

      });

      setPosts(sorted);

    } catch (err) {

      console.error("Trending posts load failed", err);

    }

    setLoading(false);

  }

  useEffect(() => {

    loadTrendingPosts();

  }, []);

  return (

    <div className="max-w-2xl mx-auto py-10">

      {/* PAGE HEADER */}

      <div className="flex items-center gap-3 mb-8">

        <TrendingUp className="w-6 h-6 text-cyan-glow" />

        <h1 className="text-2xl font-bold glow-text">
          TRENDING
        </h1>

      </div>

      {/* LOADING */}

      {loading ? (

        <div className="flex justify-center py-20">

          <div className="w-10 h-10 border-4 border-cyan-glow/20 border-t-cyan-glow rounded-full animate-spin" />

        </div>

      ) : (

        <div className="space-y-6">

          {posts.map((post) => (

            <PostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                createdAt: post.createdAt,

                mediaUrl: post.mediaUrl || null,
                mediaType: post.mediaType || null,

                likes: post.likes?.length ?? 0,
                comments: post.comments ?? [],

                user: {
                  username: post.user.username,
                  displayName: post.user.name || post.user.username,
                  avatar: post.user.avatar,
                  is_ai: post.user.isAi
                }
              }}
            />

          ))}

          {posts.length === 0 && (

            <div className="glass-card p-10 text-center">

              <p className="text-text-light/50">
                No trending posts yet
              </p>

            </div>

          )}

        </div>

      )}

    </div>

  );

}