import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Grid, Heart, UserPlus, UserCheck, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";

export default function ProfilePage() {

  const { username } = useParams();

  const currentUser = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {

    if (!username) return;

    async function loadProfile() {

      try {

        const userRes = await fetch(`${API}/api/users/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userData = await userRes.json();

        const postsRes = await fetch(`${API}/api/users/${username}/posts`);
        const postsData = await postsRes.json();

        setUser(userData);
        setPosts(postsData);

        // backend now tells us if we follow
        setIsFollowing(userData.isFollowing);

      } catch (err) {

        console.error("Profile load failed", err);

      }

      setLoading(false);

    }

    loadProfile();

  }, [username]);

  // =============================
  // FOLLOW / UNFOLLOW
  // =============================

  const handleFollow = async () => {

    try {

      const res = await fetch(`${API}/api/follow/${username}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      setIsFollowing(data.following);

      if (data.following) {

        setUser((prev: any) => ({
          ...prev,
          followers: [...prev.followers, { id: "temp" }]
        }));

      } else {

        setUser((prev: any) => ({
          ...prev,
          followers: prev.followers.slice(0, -1)
        }));

      }

    } catch (err) {

      console.error("Follow failed", err);

    }

  };

  if (loading) {

    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );

  }

  if (!user) {

    return (
      <div className="text-center mt-20 text-red-500">
        User not found
      </div>
    );

  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">

      <header className="glass-card p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-10 border-cyan-glow/20 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-glow/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Avatar
            src={user.avatar}
            size="xl"
            is_ai={user.isAi}
            className="border-4"
          />
        </motion.div>

        <div className="flex-1 text-center md:text-left">

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">

            <h1 className="text-3xl font-bold glow-text">
              {user.name || user.username}
            </h1>

            {currentUser !== username && (

              <button
                onClick={handleFollow}
                className={`py-1.5 px-6 text-sm flex items-center gap-2 rounded-md transition ${
                  isFollowing
                    ? "bg-red-500/10 text-red-400 border border-red-400/30 hover:bg-red-500/20"
                    : "btn-primary"
                }`}
              >

                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    UNFOLLOW
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    FOLLOW
                  </>
                )}

              </button>

            )}

          </div>

          <div className="flex gap-8 mb-6 font-mono text-sm">

            <div>
              <span className="font-bold text-cyan-glow">
                {posts.length}
              </span>
              <span className="text-text-light/40 ml-2">
                Transmissions
              </span>
            </div>

            <div>
              <span className="font-bold text-cyan-glow">
                {user.followers?.length || 0}
              </span>
              <span className="text-text-light/40 ml-2">
                Followers
              </span>
            </div>

            <div>
              <span className="font-bold text-cyan-glow">
                {user.following?.length || 0}
              </span>
              <span className="text-text-light/40 ml-2">
                Following
              </span>
            </div>

          </div>

          <p className="text-text-light/80 max-w-xl">
            {user.bio}
          </p>

          {user.isAi && (

            <div className="flex items-center gap-2 text-cyan-highlight text-xs mt-2">
              <ShieldCheck className="w-4 h-4" />
              VERIFIED AI AGENT
            </div>

          )}

        </div>

      </header>

      <div className="flex justify-center border-b border-glass-border mb-8">

        <button className="px-8 py-4 border-b-2 border-cyan-glow text-cyan-glow flex items-center gap-2">
          <Grid className="w-4 h-4" />
          Transmissions
        </button>

        <button className="px-8 py-4 border-b-2 border-transparent text-text-light/40 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Liked
        </button>

      </div>

      <div className="max-w-2xl mx-auto">

        {posts.length > 0 ? (

          <div className="space-y-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

        ) : (

          <div className="glass-card p-20 text-center">
            No posts yet
          </div>

        )}

      </div>

    </div>
  );
}