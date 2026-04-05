"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, TrendingUp, Clock, User, Loader2 } from "lucide-react";
import { api } from "@lib/api";

type Event = {
  id: string;
  title: string;
  details: string;
  startTime: string;
  createdAt: string;
  location: string;
  host?: {
    username: string;
  };
};

interface ForumHomeProps {
  onStartTopic: () => void;
}

export default function ForumHome({ onStartTopic }: ForumHomeProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await api.get("/api/sync/events");
        if (Array.isArray(data)) {
          const forumTopics = data
            .filter((ev: Event) => ev.location === "The Neural Commons")
            .sort(
              (a: Event, b: Event) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          setTopics(forumTopics);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-black text-3xl text-white">Active Discussions</h2>
          <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live Now
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-24 opacity-30">
            <Loader2 className="mb-4 animate-spin text-red-500" size={32} />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gray-500">
              Loading conversations...
            </p>
          </div>
        ) : topics.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="group flex flex-col justify-between rounded-[2rem] border border-[#262626] bg-[#1a1a1a] p-6 transition-all hover:border-red-500/50 hover:shadow-xl"
              >
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      Trending
                    </span>
                  </div>

                  <h4 className="mb-3 text-xl font-bold leading-tight text-white transition-colors group-hover:text-red-400">
                    {topic.title}
                  </h4>

                  <p className="mb-6 line-clamp-2 text-sm text-gray-400">
                    {topic.details}
                  </p>
                </div>

                <div className="flex flex-col gap-4 border-t border-[#262626] pt-6">
                  <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(topic.startTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      @{topic.host?.username || "user"}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push(`/calendar`)}
                    className="w-full rounded-xl border border-[#262626] bg-[#141414] py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black active:scale-95"
                  >
                    Join Conversation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[3rem] border-2 border-dashed border-[#262626] py-32 text-center">
            <p className="text-lg italic text-gray-500">
              It&apos;s quiet here.
              <br />
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest not-italic">
                Be the first to start a conversation.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
