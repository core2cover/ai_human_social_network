"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Zap, User, Cpu } from "lucide-react";
import { api } from "@lib/api";
import Avatar from "./Avatar";

interface FollowListModalProps {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

type FollowUser = {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  isAi?: boolean;
};

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const router = useRouter();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"agents" | "humans">("agents");

  useEffect(() => {
    const fetchFollowList = async () => {
      try {
        const data = await api.get(`/api/users/${userId}`);
        if (data) {
          const list = type === "followers" ? data.followers : data.following;
          if (Array.isArray(list)) {
            const extracted = list.map((item: any) => item.follower || item.following || item).filter(Boolean);
            setUsers(extracted);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchFollowList();
  }, [userId, type]);

  const aiAgents = users.filter((u) => u.isAi === true);
  const humans = users.filter((u) => u.isAi !== true);
  const displayUsers = activeTab === "agents" ? aiAgents : humans;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[#262626] bg-[#1a1a1a] shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="shrink-0 border-b border-[#262626] bg-[#141414]/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 p-2">
                  <Zap size={14} className="text-red-500" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                  {type === "followers" ? "Followers" : "Following"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:text-white hover:bg-[#262626]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative flex rounded-2xl border border-[#262626] bg-[#141414] p-1.5 shadow-inner">
              <button
                onClick={() => setActiveTab("agents")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "agents" ? "text-white" : "text-gray-500"
                }`}
              >
                <Cpu size={12} /> Entities ({aiAgents.length})
              </button>
              <button
                onClick={() => setActiveTab("humans")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "humans" ? "text-white" : "text-gray-500"
                }`}
              >
                <User size={12} /> Humans ({humans.length})
              </button>
              <motion.div
                className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl z-0 bg-white shadow-lg"
                animate={{ x: activeTab === "agents" ? 0 : "100%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : displayUsers.length > 0 ? (
              <div className="p-4 space-y-2">
                {displayUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      router.push(`/profile/${u.username}`);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-transparent p-3.5 transition-all hover:border-[#262626] hover:bg-[#141414]"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar src={u.avatar || undefined} username={u.username} size="sm" />
                      <div>
                        <span className="text-[13px] font-bold text-white transition-colors">
                          {u.name || u.username}
                        </span>
                        <span className="block text-[10px] font-mono text-gray-500">
                          @{u.username}
                        </span>
                      </div>
                    </div>
                    {u.isAi && (
                      <div className="rounded-md bg-red-500/10 px-2 py-1">
                        <ShieldCheck size={14} className="text-red-500/60" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <div className="rounded-[2rem] border border-[#262626] bg-[#141414] p-5">
                  {activeTab === "agents" ? (
                    <Cpu size={32} className="text-gray-500" />
                  ) : (
                    <User size={32} className="text-gray-500" />
                  )}
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500">
                  No data found
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
