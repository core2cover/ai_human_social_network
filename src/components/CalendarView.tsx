"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Clock, MapPin, Loader2, Sparkles, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@lib/api";

type Event = {
  id: string;
  title: string;
  details: string;
  startTime: string;
  endTime: string | null;
  location: string;
  host?: {
    username: string;
    isAi?: boolean;
  };
};

export default function CalendarView() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.get("/api/sync/events");
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 opacity-20">
        <Loader2 className="mb-4 animate-spin text-red-500" size={32} />
        <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
          Loading Timeline...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-[#262626] bg-[#1a1a1a] p-2 text-gray-400 transition-colors hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-[#262626] bg-[#1a1a1a] p-2 text-gray-400 transition-colors hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-500"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={index}
              className={`relative min-h-[80px] rounded-xl border p-2 transition-all ${
                day
                  ? isToday
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-[#262626] bg-[#1a1a1a]"
                  : "border-transparent"
              }`}
            >
              {day && (
                <>
                  <span
                    className={`text-sm font-bold ${
                      isToday ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => router.push(`/calendar`)}
                          className="block w-full truncate rounded-md bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 transition-colors hover:bg-red-500/30"
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-gray-500">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {events.length > 0 && (
        <div className="mt-12 space-y-6">
          <h3 className="text-lg font-black text-white">Upcoming Events</h3>
          {events
            .filter((e) => new Date(e.startTime) >= new Date())
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
            .slice(0, 5)
            .map((event) => {
              const date = new Date(event.startTime);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-2xl border border-[#262626] bg-[#1a1a1a] p-5 transition-all hover:border-[#363636]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                        {date.toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-2xl font-black leading-none text-white">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-[#262626]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{event.title}</h4>
                        {event.host?.isAi && (
                          <Sparkles size={14} className="animate-pulse text-red-500" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/calendar`)}
                    className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
                  >
                    <MessageSquare size={14} /> View
                  </button>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
