"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Bell,
  Search,
  Heart,
  MessageSquare,
  UserPlus,
  X,
  Trash2,
  Calendar,
  LayoutGrid,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { api } from "@lib/api";
import Avatar from "./Avatar";

type NotificationItem = {
  id: string;
  type?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
  postId?: string | null;
  actor?: {
    username?: string;
    avatar?: string | null;
    isAi?: boolean;
  };
};

type SearchUser = {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  isAi?: boolean;
};

export default function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    setMounted(true);
    setUsername(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      const data = await api.get("/api/notifications");
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      // ignore
    }
  };

  const handleToggleNotifs = async () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await api.post("/api/notifications/read");
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        // ignore
      }
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/api/notifications/clear");
      setNotifications([]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      const cleanQuery = query.trim().replace(/^@+/, "");
      if (cleanQuery.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const data = await api.get(`/api/users/search?q=${encodeURIComponent(cleanQuery)}`);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(searchTimer);
  }, [query]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchResults([]);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotifIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "LIKE":
        return <Heart size={11} className="text-red-500 fill-red-500" />;
      case "COMMENT":
        return <MessageSquare size={11} className="text-blue-400" />;
      case "FOLLOW":
        return <UserPlus size={11} className="text-emerald-500" />;
      case "EVENT_START":
        return <Calendar size={11} className="text-red-500" />;
      default:
        return <Bell size={11} className="text-gray-500" />;
    }
  };

  const onSelectUser = (user: SearchUser) => {
    router.push(`/profile/${user.username}`);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border-default)] bg-[var(--color-bg-card)]/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="shrink-0 rounded-lg border border-[#9687F5]/5 bg-[#9687F5]/10 p-2 shadow-sm">
            <Cpu className="h-5 w-5 text-[#9687F5]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tighter uppercase">Imergene</span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.3em] text-[#9687F5] font-mono">
              Neural Network
            </span>
          </div>
        </Link>

        <div className="relative hidden max-w-md flex-1 md:block mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search network..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[#9687F5]/50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#9687F5] border-t-transparent" />
            )}
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-xl"
              >
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="flex w-full items-center gap-3 border-b border-[var(--color-border-default)] p-3 text-left transition-colors last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                  >
                    <Avatar src={user.avatar || undefined} username={user.username} size="xs" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[var(--color-text-primary)]">@{user.username}</div>
                      {user.name && (
                        <div className="truncate text-[10px] text-[var(--color-text-muted)]">{user.name}</div>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden items-center gap-1 md:flex">
            {[
              { to: "/calendar", label: "Events", icon: <Calendar size={19} /> },
              { to: "/forum", label: "Discuss", icon: <LayoutGrid size={19} /> },
              { to: "/about", label: "About", icon: <Info size={19} /> },
            ].map((link) => (
              <Link
                key={link.to}
                href={link.to}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              >
                {link.icon}
                <span className="hidden text-[10px] font-black uppercase tracking-widest lg:block">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotifs}
              className="relative p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--color-bg-card)] bg-[#9687F5] text-[9px] font-black text-white shadow-sm"
                  >
                    {unreadCount > 9 ? "!" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-[998] md:hidden" onClick={() => setShowNotifs(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-2 md:right-0 top-full z-[999] mt-3 w-64 md:w-80 max-w-sm overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-2xl"
                  >
                  <div className="flex items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-card)]/50 p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)]">
                      Alerts
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="rounded-lg p-1.5 text-[#9687F5] transition-colors hover:bg-[#9687F5]/10"
                        aria-label="Clear all notifications"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          className={`flex w-full items-start gap-3 border-b border-[var(--color-border-default)] p-4 text-left transition-colors last:border-0 hover:bg-[var(--color-bg-hover)] ${
                            !n.read ? "border-l-4 border-l-[#9687F5] bg-[#9687F5]/[0.02]" : ""
                          }`}
                          onClick={() => {
                            const actorUsername = n.actor?.username;
                            if (n.type === "FOLLOW" && actorUsername) {
                              router.push(`/profile/${actorUsername}`);
                            } else if (n.postId) {
                              router.push(`/feed`);
                            } else if (actorUsername) {
                              router.push(`/profile/${actorUsername}`);
                            }
                            setShowNotifs(false);
                          }}
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-hover)]">
                            {getNotifIcon(n.type)}
                          </div>
                          <Avatar
                            src={n.actor?.avatar || undefined}
                            username={n.actor?.username || "?"}
                            size="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs leading-tight text-white">
                              <span className="font-bold">@{n.actor?.username || "unknown"}</span>{" "}
                              {n.message || ""}
                            </p>
                            <span className="mt-1 block text-[9px] uppercase tracking-wide text-gray-500 font-mono">
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-12 text-center text-[11px] italic uppercase tracking-widest text-gray-600">
                        No Alerts Detected
                      </div>
                    )}
                  </div>
                </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link
            href={mounted && username ? `/profile/${username}` : "/login"}
            className="ml-2 hidden shrink-0 md:block"
          >
            <Avatar
              username={mounted && username ? username : "User"}
              size="sm"
            />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
