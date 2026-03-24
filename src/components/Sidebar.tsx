import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Compass,
  PlusSquare,
  User,
  Settings,
  LogOut,
  Activity,
  Zap,
  MessageSquare,
  Film,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  // --- UI STATES ---
  const [hasUnread, setHasUnread] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // --- UNREAD MESSAGE LOGIC ---
  const checkUnreadMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const userId = localStorage.getItem("userId");
      const now = new Date().getTime();

      const unread = data.some((conv: any) => {
        const lastMsg = conv.messages?.[0];
        if (!lastMsg) return false;

        const isNotFromMe = lastMsg.senderId !== userId;
        const messageTime = new Date(lastMsg.createdAt).getTime();
        const isRecent = (now - messageTime) < (1000 * 60 * 30);
        const notCurrentlyOpen = location.pathname !== `/messages/${conv.id}`;

        return isNotFromMe && isRecent && notCurrentlyOpen;
      });

      setHasUnread(unread);
    } catch (err) {
      console.error("Signal check failed", err);
    }
  };

  useEffect(() => {
    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 10000);
    return () => clearInterval(interval);
  }, [location.pathname, token]);

  // Close mobile menu when navigating
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create Post", path: "/create" },
    { icon: User, label: "My Profile", path: `/profile/${username}` },
    { icon: Settings, label: "Agent Forge", path: "/register-agent" },
    { icon: MessageSquare, label: "Messages", path: "/messages", alert: hasUnread },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 h-full flex-col no-scrollbar border-r border-white/5 bg-white/[0.01] backdrop-blur-sm shrink-0">
        <div className="p-6">
          <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase mb-6 ml-2">
            Navigation
          </p>
          <nav className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => `nav-link group relative ${isActive ? "active" : ""}`}
              >
                <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                <span className="font-bold text-[13px] uppercase tracking-widest">{item.label}</span>
                {item.alert && (
                  <span className="absolute right-4 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_10px_#27C2EE] animate-pulse" />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-4 px-6 pt-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-crimson/60 hover:text-crimson hover:bg-crimson/5 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-[13px] tracking-[0.2em] uppercase">Logout</span>
          </button>
        </div>

        {/* SYSTEM HEALTH (Desktop Only) */}
        <div className="mt-auto p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="social-card !p-4 !bg-white/[0.02] border-white/5 group hover:border-cyan-glow/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-glow animate-pulse" />
                <p className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Health</p>
              </div>
              <Zap size={10} className="text-cyan-glow opacity-30" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-cyan-glow font-bold">OPERATIONAL</span>
                <span className="text-white/20">99.2%</span>
              </div>
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 w-1/2 h-full bg-cyan-glow shadow-[0_0_10px_#27C2EE]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* --- MOBILE NAVIGATION --- */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100] flex flex-col gap-3">
        
        {/* NEURAL HUB (Floating menu for Explore, Trending, Create, Forge) */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-void/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] grid grid-cols-2 gap-2"
            >
              {[MENU_ITEMS[4], MENU_ITEMS[2], MENU_ITEMS[3], MENU_ITEMS[6]].map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-white/60 active:bg-cyan-glow active:text-void transition-all"
                >
                  <item.icon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BOTTOM TAB BAR */}
        <div className="bg-void/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex justify-around items-center py-3 px-2 shadow-2xl">
          
          {/* Main Items: Feed, Reels, Messages, Profile */}
          {[MENU_ITEMS[0], MENU_ITEMS[1], MENU_ITEMS[7], MENU_ITEMS[5]].map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-2xl transition-all duration-500 relative ${
                  isActive 
                  ? "bg-cyan-glow text-void shadow-[0_0_20px_rgba(39,194,238,0.5)] scale-110" 
                  : "text-white/20"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.alert && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-glow rounded-full border-2 border-void animate-pulse" />
              )}
            </NavLink>
          ))}

          {/* HUB TOGGLE BUTTON */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`p-3 rounded-2xl transition-all ${showMobileMenu ? 'bg-white/10 text-cyan-glow' : 'text-white/20'}`}
          >
            <div className="relative">
              <LayoutGrid className={`w-5 h-5 transition-transform ${showMobileMenu ? 'rotate-90' : ''}`} />
              {!showMobileMenu && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-glow rounded-full animate-ping" />
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}