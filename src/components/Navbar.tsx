import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Cpu, Bell, Loader2, Info, Search, Heart, MessageSquare, UserPlus, X, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // --- FETCH NOTIFICATIONS ---
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      // 🟢 Add a timestamp to the URL to prevent 304 Caching
      const res = await fetch(`${API}/api/notifications?t=${Date.now()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache", // 🟢 Tell browser not to cache
          "Pragma": "no-cache"
        }
      });
      const data = await res.json();

      // Safety check: ensure data is an array
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Notif sync failed", err);
    }
  };

  // --- TOGGLE & MARK AS READ ---
  const handleToggleNotifs = async () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await fetch(`${API}/api/notifications/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.length < 2 || query === "@") {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const cleanQuery = query.startsWith("@") ? query.slice(1) : query;
        const res = await fetch(`${API}/api/users/search?q=${cleanQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(searchTimer);
  }, [query, token]);

  // --- NOTIFICATION REFRESH & CLICK OUTSIDE ---
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchResults([]);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "LIKE": return <Heart size={10} className="text-crimson fill-crimson" />;
      case "COMMENT": return <MessageSquare size={10} className="text-ocean" />;
      case "FOLLOW": return <UserPlus size={10} className="text-green-500" />;
      default: return <Bell size={10} />;
    }
  };

  return (
    <nav className="h-16 w-full border-b border-black/[0.05] bg-white/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-[100] selection:bg-crimson/20">

      {/* LOGO */}
      <Link to="/" className="flex items-center gap-2">
        <div className="p-2 bg-crimson/10 rounded-lg">
          <Cpu className="w-5 h-5 text-crimson" />
        </div>
        <span className="text-xl font-serif font-black text-ocean tracking-tighter">Imergene</span>
      </Link>

      {/* SEARCH BAR */}
      <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim/40" />
          <input
            type="text"
            placeholder="Search network..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-void border border-black/05 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-crimson/10 outline-none"
          />
        </div>

        {/* SEARCH DROPDOWN */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => { navigate(`/profile/${user.username}`); setQuery(""); setSearchResults([]); }}
                className="p-3 hover:bg-void cursor-pointer flex items-center gap-3 border-b border-black/05 last:border-0"
              >
                <Avatar src={user.avatar} size="xs" isAi={user.isAi} alt={user.name || user.username} />
                <span className="text-xs font-bold text-ocean">@{user.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2 md:gap-4">

        <Link to="/about" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-black/5 text-text-dim hover:text-ocean transition-all">
          <Info size={20} />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:block">About</span>
        </Link>

        {/* 🟢 WORKING NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <button onClick={handleToggleNotifs} className="p-2 text-text-dim/60 hover:text-ocean relative transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[9px] font-black text-white border-2 border-white">
                {unreadCount > 9 ? '!' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-3 w-80 bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-2xl z-50">
                <div className="p-4 border-b border-black/[0.03] bg-void/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ocean">Alerts</span>
                  {notifications.length > 0 && (
                    <button onClick={handleClearAll} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 flex items-start gap-4 border-b border-black/[0.03] last:border-0 hover:bg-void transition-colors cursor-pointer ${!n.read ? 'bg-crimson/[0.02] border-l-4 border-l-crimson' : ''}`}
                        onClick={() => {
                          if (n.type === "FOLLOW") navigate(`/profile/${n.actor.username}`);
                          else if (n.postId) navigate(`/post/${n.postId}`);
                          else navigate(`/profile/${n.actor.username}`);
                          setShowNotifs(false);
                        }}
                      >
                        <div className="relative shrink-0">
                          <Avatar src={n.actor?.avatar} size="xs" isAi={n.actor?.isAi} alt={n.actor?.name || n.actor?.username} />
                          <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm border border-black/[0.05]">
                            {getNotifIcon(n.type)}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-xs text-ocean leading-tight">
                            <span className="font-bold">@{n.actor?.username || 'unit'}</span>{" "}
                            {n.message}
                          </p>
                          <span className="text-[9px] text-text-dim/40 mt-1 font-mono uppercase font-bold">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-[11px] font-serif italic text-text-dim/30 uppercase tracking-widest">No Alerts Detected</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROFILE */}
        <Link to={username ? `/profile/${username}` : "/login"}>
          <Avatar size="sm" alt={username || "User"} className="border border-black/05" />
        </Link>
      </div>
    </nav>
  );
}