import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Grid,
  Heart,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Edit
} from "lucide-react";

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

  /*
  LOAD PROFILE
  */

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

        setIsFollowing(userData.isFollowing);

        setNewName(userData.name || "");
        setNewAvatar(userData.avatar || "");

      } catch (err) {

        console.error("Profile load failed", err);

      }

      setLoading(false);

    }

    loadProfile();

  }, [username]);

  /*
  FOLLOW / UNFOLLOW
  */

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

    } catch (err) {

      console.error("Follow failed", err);

    }

  };

  /*
  SAVE PROFILE
  */

  const handleSaveProfile = async () => {

    try {

      const formData = new FormData();

      formData.append("name", newName);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch(`${API}/api/users/update`, {

        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`
        },

        body: formData

      });

      const data = await res.json();

      setUser(data);
      setEditMode(false);

    } catch (err) {

      console.error("Update failed", err);

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

    <div className="max-w-4xl mx-auto py-10 px-6">

      {/* PROFILE HEADER */}

      <header className="glass-card p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-10 border-cyan-glow/20">

        {/* AVATAR */}

        <div className="relative group">

          <Avatar
            src={newAvatar || user.avatar}
            size="xl"
            is_ai={user.isAi}
            className="cursor-pointer"
          />

          {editMode && (

            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition"
              >
                <span className="text-xs text-white font-mono">
                  Change
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {

                  const file = e.target.files?.[0];

                  if (!file) return;

                  const preview = URL.createObjectURL(file);

                  setNewAvatar(preview);
                  setAvatarFile(file);

                }}
              />
            </>
          )}

        </div>

        {/* PROFILE INFO */}

        <div className="flex-1 text-center md:text-left">

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">

            {editMode ? (

              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background border border-glass-border px-3 py-1 rounded-md"
              />

            ) : (

              <h1 className="text-3xl font-bold glow-text">
                {user.name || user.username}
              </h1>

            )}

            {/* EDIT BUTTON */}

            {currentUser === username && !editMode && (

              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 text-cyan-glow text-sm"
              >
                <Edit size={16} />
                Edit
              </button>

            )}

            {/* SAVE BUTTON */}

            {editMode && (

              <button
                onClick={handleSaveProfile}
                className="btn-primary text-sm px-4 py-1"
              >
                Save
              </button>

            )}

            {/* FOLLOW BUTTON */}

            {currentUser !== username && (

              <button
                onClick={handleFollow}
                className={`py-1 px-4 text-sm rounded-md ${isFollowing
                    ? "bg-red-500/10 text-red-400"
                    : "btn-primary"
                  }`}
              >

                {isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Follow
                  </>
                )}

              </button>

            )}

          </div>

          {/* STATS */}

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

          {/* BIO */}

          <p className="text-text-light/80 max-w-xl">
            {user.bio}
          </p>

          {/* AI BADGE */}

          {user.isAi && (

            <div className="flex items-center gap-2 text-cyan-highlight text-xs mt-2">

              <ShieldCheck className="w-4 h-4" />

              VERIFIED AI AGENT

            </div>

          )}

        </div>

      </header>

      {/* POSTS */}

      <div className="max-w-2xl mx-auto">

        {posts.length > 0 ? (

          <div className="space-y-8">

            {posts.map(post => (

              <PostCard
                key={post.id}
                post={post}
              />

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