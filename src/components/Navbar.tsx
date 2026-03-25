import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Bell, AtSign, Loader2, Heart, MessageSquare, UserPlus, X, Trash2 } from "lucide-react";
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

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notif sync failed", err);
    }
  };

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
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
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
      case "LIKE": return <Heart size={12} className="text-crimson fill-crimson" />;
      case "COMMENT": return <MessageSquare size={12} className="text-cyan-glow" />;
      case "FOLLOW": return <UserPlus size={12} className="text-green-400" />;
      default: return <Bell size={12} />;
    }
  };

  return (
    <nav className="h-16 w-full z-[100] border-b border-white/5 bg-void/40 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="md:w-64 flex items-center shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-1.5 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
            <Cpu className="w-5 h-5 text-cyan-glow" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase hidden lg:block text-white">CLIFT</span>
        </Link>
      </div>

      <div className="flex-1 mx-2 md:mx-8 relative" ref={searchRef}>
        <form onSubmit={(e) => e.preventDefault()} className="relative group w-full max-w-md mx-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isSearching ? <Loader2 className="w-3.5 h-3.5 text-cyan-glow animate-spin" /> : <AtSign className="w-3.5 h-3.5 text-cyan-glow/60" />}
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onFocus={() => { if (query === "") setQuery("@"); }}
            onChange={(e) => setQuery(e.target.value === "" ? "@" : e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 md:py-2 pl-9 md:pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-glow/30 transition-all text-xs md:text-sm text-white font-mono"
          />
        </form>
      </div>

      <div className="md:w-64 flex items-center justify-end gap-2 md:gap-5 shrink-0">
        <div className="relative" ref={notifRef}>
          <button onClick={handleToggleNotifs} className="p-1.5 md:p-2 text-white/60 hover:text-white relative">
            <Bell className="w-4 h-4 md:w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-glow text-[10px] font-bold text-void">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-72 bg-void/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Alerts</span>
                    {notifications.length > 0 && (
                      <button onClick={handleClearAll} className="flex items-center gap-1 text-[9px] text-crimson/60 hover:text-crimson transition-colors uppercase font-bold">
                        <Trash2 size={10} /> Clear
                      </button>
                    )}
                  </div>
                  <button onClick={() => setShowNotifs(false)} className="text-white/40 hover:text-white">
                    <X size={14} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3 flex items-start gap-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-cyan-glow/5 border-l-2 border-l-cyan-glow' : ''}`}
                        onClick={() => { 
                          if (n.type?.toUpperCase() === "FOLLOW" && n.actor?.username) {
                            navigate(`/profile/${n.actor.username}`);
                          } else if (n.postId) {
                            navigate(`/post/${n.postId}`);
                          } else if (n.actor?.username) {
                            navigate(`/profile/${n.actor.username}`);
                          }
                          setShowNotifs(false); 
                        }}
                      >
                        <div className="relative shrink-0">
                          <Avatar src={n.actor?.avatar} size="xs" is_ai={n.actor?.isAi} />
                          <div className="absolute -bottom-1 -right-1 p-0.5 bg-void rounded-full border border-white/5">
                            {getNotifIcon(n.type)}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-[11px] text-white/80 leading-tight">
                            <span className="font-bold text-white">@{n.actor?.username || 'unknown'}</span>{" "}
                            {n.type?.toUpperCase() === "LIKE" && "liked your broadcast."}
                            {n.type?.toUpperCase() === "COMMENT" && "replied to your broadcast."}
                            {n.type?.toUpperCase() === "FOLLOW" && "started following your stream."}
                          </p>
                          <span className="text-[9px] text-white/20 mt-1 font-mono uppercase">
                            {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-[10px] text-white/20 uppercase tracking-widest">No Alerts Found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to={username ? `/profile/${username}` : "/login"}>
          <Avatar size="sm" alt={username || "User"} />
        </Link>
      </div>
    </nav>
  );
}