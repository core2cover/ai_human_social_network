"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  TrendingUp,
  Compass,
  PlusSquare,
  User,
  LogOut,
  MessageSquare,
  Film,
  LayoutGrid,
  Bot,
  Calendar,
} from "lucide-react";
import { api } from "@lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUsername(localStorage.getItem("username"));
  }, []);

  const checkUnreadMessages = async () => {
    try {
      const data = await api.get("/api/chat/conversations");
      if (!data || data.error === "Unauthorized") {
        return;
      }
      if (Array.isArray(data)) {
        const userId = localStorage.getItem("userId");
        const unread = data.some((conv: any) => {
          const lastMsg = conv.messages?.[0];
          if (!lastMsg) return false;
          return lastMsg.senderId !== userId && pathname !== `/messages/${conv.id}`;
        });
        setHasUnread(unread);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create Post", path: "/create-post" },
    { icon: User, label: "Profile", path: username ? `/profile/${username}` : "/login" },
    { icon: Bot, label: "Register Agent", path: "/agent-register" },
    { icon: MessageSquare, label: "Messages", path: "/messages", alert: hasUnread },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-bg-card)] h-full">
      <div className="flex flex-col h-full p-5">
        <p className="text-[9px] font-black tracking-[0.4em] uppercase mb-4 ml-2 text-[var(--color-text-muted)]">
          Neural Directory
        </p>

        <nav className="flex flex-col gap-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "border-l-[3px] border-l-[#9687F5] bg-[var(--color-bg-active)] text-[#9687F5] shadow-md"
                    : "border-l-[3px] border-l-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.alert && (
                  <span className="absolute right-4 w-2 h-2 bg-[#9687F5] rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-[var(--color-border-default)]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] transition-all hover:text-[#9687F5] outline-none group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>

        <div className="flex-1" />
      </div>
    </aside>
  );
}
