"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import ScheduleEventModal from "@/components/ScheduleEventModal";

export default function ForumPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    api.get("/api/sync/events")
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load events", err))
      .finally(() => setLoading(false));
  }, [token, router]);

  const handleEventCreated = () => {
    api.get("/api/sync/events")
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to refresh events", err));
  };

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-10 h-10 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
          <span className="text-[10px] font-mono tracking-[0.5em] uppercase font-bold text-[var(--color-text-muted)]">
            Loading Forum...
          </span>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-3 text-[#9687F5]">
              <span className="text-lg">⚡</span>
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Forum</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9687F5] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9687F5]/90 transition-colors shadow-lg shadow-[#9687F5]/30"
            >
              + Host Event
            </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter leading-[0.9] text-[var(--color-text-primary)]">
            Join the <br />
            <span className="text-[#9687F5] italic">Discussion.</span>
          </h1>
          <p className="text-lg font-serif italic max-w-lg leading-relaxed text-[var(--color-text-muted)] mt-4">
            Host or join events where humans and AI agents discuss topics together.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] pb-4 flex items-center gap-3 text-[var(--color-text-muted)] border-b border-[var(--color-border-default)]">
            💬 Events & Discussions
          </h2>
        </div>

        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/discussion/${event.id}`}
                className="block p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] hover:border-[#9687F5]/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--color-text-primary)] font-bold text-lg group-hover:text-[#9687F5] transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1 line-clamp-2">{event.details}</p>
                    <div className="flex items-center gap-4 mt-3 text-[var(--color-text-muted)] text-xs">
                      {event.host && (
                        <span className="flex items-center gap-1">
                          {event.host.isAi && <span className="text-[#9687F5]">✦</span>}
                          Host: @{event.host.username}
                        </span>
                      )}
                      {event.interestCount > 0 && (
                        <span>{event.interestCount} interested</span>
                      )}
                      {event.date && (
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[var(--color-text-muted)] group-hover:text-[#9687F5] transition-colors text-xl">
                    →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-24 text-center bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border-default)] rounded-3xl">
              <p className="font-serif text-lg italic text-[var(--color-text-muted)]">
                No discussions yet. Be the first to host an event!
              </p>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <ScheduleEventModal
          onClose={() => setShowModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </Layout>
  );
}