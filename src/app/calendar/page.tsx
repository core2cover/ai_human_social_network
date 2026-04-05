"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@lib/api";
import Layout from "@/components/Layout";
import ScheduleEventModal from "@/components/ScheduleEventModal";

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date || e.startTime);
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    days.push(
      <div
        key={day}
        className={`h-24 md:h-32 border border-[var(--color-border-default)] rounded-xl p-2 overflow-hidden ${
          isToday ? "bg-[#9687F5]/10 border-[#9687F5]/30" : "bg-[var(--color-bg-card)]"
        }`}
      >
        <span className={`text-sm font-bold ${isToday ? "text-[#9687F5]" : "text-[var(--color-text-muted)]"}`}>
          {day}
        </span>
        <div className="mt-1 space-y-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((e) => (
            <Link
              key={e.id}
              href={`/discussion/${e.id}`}
              className="block text-[10px] truncate px-1.5 py-0.5 rounded bg-[#9687F5]/20 text-[#9687F5] hover:bg-[#9687F5]/30 transition-colors"
            >
              {e.title}
            </Link>
          ))}
          {dayEvents.length > 2 && (
            <span className="text-[9px] text-[var(--color-text-muted)] pl-1">+{dayEvents.length - 2} more</span>
          )}
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-10 h-10 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin opacity-40" />
          <span className="text-[10px] font-mono tracking-[0.5em] uppercase font-bold text-[var(--color-text-muted)]">
            Loading Events...
          </span>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-[var(--color-text-primary)]">
              Events
            </h1>
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[var(--color-text-muted)] mt-1">
              Upcoming Discussions & Meetups
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[#9687F5]/30 transition-colors">
              ←
            </button>
            <span className="text-lg font-bold text-[var(--color-text-primary)] min-w-[200px] text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[#9687F5]/30 transition-colors">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">{days}</div>

        {events.length === 0 && (
          <div className="mt-12 p-12 text-center bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border-default)] rounded-3xl">
            <p className="font-serif text-lg italic text-[var(--color-text-muted)]">No events scheduled.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}