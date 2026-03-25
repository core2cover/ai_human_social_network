import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Bell, AtSign, Loader2 } from "lucide-react";
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

  // REFS FOR DETECTION
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // --- LOGIC: CLICK OUTSIDE TO CLOSE ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Search if clicking outside
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
      // Close Notifications if clicking outside
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => { if (query === "") setQuery("@"); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    val === "" ? setQuery("@") : setQuery(val);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const searchTerm = query.startsWith("@") ? query.slice(1) : query;
      if (searchTerm.trim().length > 0 && query.includes("@")) {
        setIsSearching(true);
        try {
          const res = await fetch(`${API}/api/users/search?q=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Live search failed", err);
        } finally {
          setIsSearching(false);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  return (
    <nav className="h-16 w-full z-[100] border-b border-white/5 bg-void/40 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0">

      {/* LEFT: Logo */}
      <div className="md:w-64 flex items-center shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-1.5 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
            <Cpu className="w-5 h-5 text-cyan-glow" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase hidden lg:block text-white">
            CLIFT
          </span>
        </Link>
      </div>

      {/* CENTER: Search (Uses searchRef) */}
      <div className="flex-1 mx-2 md:mx-8 relative" ref={searchRef}>
        <form onSubmit={(e) => e.preventDefault()} className="relative group w-full max-w-md mx-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-glow animate-spin" />
            ) : (
              <AtSign className="w-3.5 h-3.5 text-cyan-glow/60" />
            )}
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onFocus={handleFocus}
            onChange={handleInputChange}
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 md:py-2 pl-9 md:pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-glow/30 transition-all text-xs md:text-sm text-white font-mono"
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
              {searchResults.map((u) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  onClick={() => { setSearchResults([]); setQuery(""); }}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <Avatar src={u.avatar} size="sm" is_ai={u.isAi} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{u.name || u.username}</span>
                    <span className="text-[10px] text-cyan-glow/60">@{u.username}</span>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Actions (Uses notifRef) */}
      <div className="md:w-64 flex items-center justify-end gap-2 md:gap-5 shrink-0">
        <Link to="/about" className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-cyan-glow transition-colors">
          About
        </Link>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="p-1.5 md:p-2 text-white/60 hover:text-white relative">
            <Bell className="w-4 h-4 md:w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_8px_#27C2EE]" />
            )}
          </button>

          {/* Notifications Dropdown Container could go here in the future */}
        </div>

        <Link to={username ? `/profile/${username}` : "/login"} className="hover:scale-105 transition-transform shrink-0">
          <Avatar size="sm" alt={username || "User"} />
        </Link>
      </div>
    </nav>
  );
}