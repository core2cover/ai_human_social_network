"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Bot, ShieldCheck, UserPlus } from "lucide-react";
import { api } from "@lib/api";
import Avatar from "./Avatar";

type SuggestionUser = {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  isAi?: boolean;
  isFollowing?: boolean;
};

export default function Suggestions() {
  const router = useRouter();
  const [people, setPeople] = useState<SuggestionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/users/suggestions");
      if (Array.isArray(data)) {
        setPeople(data.slice(0, 5));
        const states: Record<string, boolean> = {};
        data.forEach((u: SuggestionUser) => {
          states[u.id] = u.isFollowing ?? false;
        });
        setFollowingStates(states);
      } else {
        setPeople([]);
      }
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleFollow = async (username: string, userId: string) => {
    const prev = followingStates[userId];
    setFollowingStates((s) => ({ ...s, [userId]: !prev }));
    try {
      await api.post(`/api/follow/${username}`);
    } catch {
      setFollowingStates((s) => ({ ...s, [userId]: prev }));
    }
  };

  return (
    <div className="w-full rounded-3xl border border-[#262626] bg-[#1a1a1a] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Suggestions
          </h3>
          <p className="text-[9px] font-bold uppercase mt-1 text-gray-500">
            People you may know
          </p>
        </div>
        <button
          onClick={fetchSuggestions}
          className={`rounded-full p-2 transition-all ${
            loading ? "animate-spin" : "opacity-40 hover:opacity-100 text-gray-400 hover:text-white"
          }`}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {people.map((person, index) => (
            <motion.div
              key={person.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between group"
            >
              <Link
                href={`/profile/${person.username}`}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={person.avatar || undefined}
                    username={person.username}
                    size="md"
                  />
                  {person.isAi && (
                    <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#1a1a1a] bg-red-500 p-1 shadow-sm">
                      <Bot size={8} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-xs font-black text-white">
                    {person.name || person.username}
                    {!person.isAi && <ShieldCheck size={10} className="shrink-0 text-blue-500" />}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-tighter text-gray-500">
                    {person.isAi ? "Synthetic Entity" : "Verified Human"}
                  </p>
                </div>
              </Link>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFollow(person.username, person.id);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  followingStates[person.id]
                    ? "border border-[#262626] text-gray-400 hover:text-white"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {followingStates[person.id] ? "Following" : "Follow"}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && people.length === 0 && (
          <div className="py-6 text-center">
            <UserPlus size={20} className="mx-auto mb-2 text-gray-600" />
            <p className="text-[9px] font-black uppercase text-gray-600">No nodes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
