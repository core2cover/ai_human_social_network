import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Cpu,
  Bell,
  Search,
  User,
  Loader2,
  AtSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // --- AUTO-MENTION LOGIC ---
  const handleFocus = () => {
    if (query === "") {
      setQuery("@");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Prevent deleting the first @ if they just focused
    if (val === "") {
      setQuery("@");
    } else {
      setQuery(val);
    }
  };

  // Live Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const searchTerm = query.startsWith("@") ? query.slice(1) : query;

      // FIX: Trigger search even if it's just "@" to show initial suggestions
      // or keep it at > 0 but ensure your backend is actually being called.
      if (searchTerm.trim().length >= 0 && query.includes("@")) {
        setIsSearching(true);
        try {
          // If query is just "@", maybe fetch top/active agents? 
          // For now, let's just ensure it calls when there is at least 1 char.
          if (searchTerm.trim().length === 0) {
            setSearchResults([]); // Or fetch suggestions
            return;
          }

          const res = await fetch(`${API}/api/users/search?q=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Live search failed");
        } finally {
          setIsSearching(false);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Notif load failed", err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.log("Failed to mark read", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.startsWith("@") ? query.slice(1).trim() : query.trim();
    if (!cleanQuery) return;

    const match = searchResults.find(u =>
      u.username.toLowerCase() === cleanQuery.toLowerCase() ||
      u.name?.toLowerCase() === cleanQuery.toLowerCase()
    );

    const targetPath = match
      ? match.username
      : cleanQuery.replace(/\s+/g, '_').toLowerCase();

    navigate(`/profile/${targetPath}`);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <nav className="sticky top-0 z-50 glass-card !overflow-visible px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="p-2 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
          <Cpu className="w-6 h-6 text-cyan-glow" />
        </div>
        <span className="text-xl font-bold tracking-tighter glow-text hidden sm:block uppercase">
          AI Human <span className="opacity-50">Network</span>
        </span>
      </Link>

      <div className="flex-1 max-w-md mx-8 hidden md:block relative" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-cyan-glow animate-spin" />
            ) : (
              <AtSign className="w-4 h-4 text-cyan-glow/60" /> // Icon changed to AtSign to match the vibe
            )}
          </div>
          <input
            type="text"
            placeholder="Search users and AI agents..."
            value={query}
            onFocus={handleFocus}
            onChange={handleInputChange}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/30 transition-all text-sm text-white font-mono"
          />
        </form>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-void/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              <div className="p-2 text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5">Neural Match Found</div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {searchResults.map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    onClick={() => {
                      setSearchResults([]);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <Avatar src={u.avatar} alt={u.username} size="sm" is_ai={u.isAi} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{u.name || u.username}</span>
                      <span className="text-[10px] text-cyan-glow/60">@{u.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }} className="p-2 rounded-full relative hover:bg-white/5 text-white/60">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-glow rounded-full border-2 border-void shadow-[0_0_8px_#27C2EE]"
              />
            )}
          </button>
        </div>
        {username ? (
          <Link to={`/profile/${username}`} className="hover:scale-105 transition-transform">
            <Avatar size="sm" alt={username} />
          </Link>
        ) : (
          <Link to="/login" className="px-5 py-1.5 text-xs font-bold border border-white/10 rounded-full hover:border-cyan-glow text-white">Login</Link>
        )}
      </div>
    </nav>
  );
}