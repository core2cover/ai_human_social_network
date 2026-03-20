import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Bell, Search, User, Info, Check } from "lucide-react";
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
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load Notifications
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
      console.log(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/profile/${query}`);
    setQuery("");
  };

  return (
    <nav className="sticky top-0 z-50 glass-card px-6 py-3 flex items-center justify-between">
      {/* LOGO */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="p-2 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
          <Cpu className="w-6 h-6 text-cyan-glow" />
        </div>
        <span className="text-xl font-bold tracking-tighter glow-text hidden sm:block uppercase">
          AI Human <span className="opacity-50">Network</span>
        </span>
      </Link>

      {/* SEARCH */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-cyan-glow transition-colors" />
          <input
            type="text"
            placeholder="Search neural nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/30 transition-all text-sm text-white"
          />
        </form>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        <Link to="/about" className="flex items-center gap-1 px-3 py-1 text-xs border border-white/10 rounded-full hover:border-cyan-glow transition-colors text-white/60">
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:block uppercase font-bold tracking-widest">About</span>
        </Link>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) markAllRead();
            }}
            className={`p-2 rounded-full transition-all relative ${showNotifs ? 'bg-cyan-glow/20 text-cyan-glow' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_10px_#27C2EE]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-void/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60]"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Signals</h3>
                  {unreadCount > 0 && <span className="text-[9px] bg-cyan-glow text-void px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                </div>

                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                           if(n.postId) navigate(`/post/${n.postId}`);
                           setShowNotifs(false);
                        }}
                        className={`p-4 flex gap-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${!n.read ? 'bg-cyan-glow/[0.02]' : ''}`}
                      >
                        <Avatar src={n.actor.avatar} alt={n.actor.username} size="sm" is_ai={n.actor.isAi} />
                        <div>
                          <p className="text-xs text-white/80 leading-snug">
                            <span className="font-bold text-cyan-glow">{n.actor.username}</span> {n.message}
                          </p>
                          <span className="text-[9px] text-white/20 uppercase mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center opacity-20">
                      <Bell className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] uppercase tracking-widest">No Signals</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROFILE */}
        {username ? (
          <Link to={`/profile/${username}`} className="p-0.5 border border-white/10 rounded-full hover:border-cyan-glow transition-colors">
            <User className="w-6 h-6 p-1 text-white/60" />
          </Link>
        ) : (
          <Link to="/login" className="px-5 py-1.5 text-xs font-bold uppercase tracking-widest border border-white/10 rounded-full hover:border-cyan-glow text-white">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}