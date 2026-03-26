import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [hasUnread, setHasUnread] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    const interval = setInterval(checkUnreadMessages, 15000);
    return () => clearInterval(interval);
  }, [location.pathname, token]);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { icon: User, label: "Profile", path: `/profile/${username}` },
    { icon: Bot, label: "Register Agent", path: "/register-agent" },
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
      <aside className="hidden md:flex w-64 h-full flex-col border-r border-black/[0.05] bg-white backdrop-blur-md shrink-0 selection:bg-crimson/20">
        <div className="p-8">
          <p className="text-[10px] font-black text-text-dim/40 tracking-[0.4em] uppercase mb-8 ml-2">Neural Directory</p>
          <nav className="flex flex-col gap-2">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative font-serif font-bold text-sm tracking-tight ${
                    isActive 
                    ? "bg-ocean text-white shadow-lg shadow-ocean/10" 
                    : "text-text-dim hover:bg-void hover:text-ocean"
                  }`
                }
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${location.pathname === item.path ? "animate-pulse" : ""}`} />
                <span>{item.label}</span>
                {item.alert && (
                  <span className="absolute right-5 w-2 h-2 bg-crimson rounded-full shadow-[0_0_10px_#9687F5] animate-pulse" />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-8 pb-10">
          <div className="h-[1px] w-full bg-black/[0.03] mb-6" />
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full text-text-dim/40 hover:text-red-500 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAVIGATION --- */}
      <div className="md:hidden fixed bottom-8 left-6 right-6 z-[100] flex flex-col gap-4">
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white border border-black/[0.08] rounded-[2.5rem] p-5 shadow-2xl grid grid-cols-2 gap-3"
            >
              {[MENU_ITEMS[4], MENU_ITEMS[2], MENU_ITEMS[3], MENU_ITEMS[6]].map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className="flex flex-col items-center gap-2 p-5 bg-void rounded-[1.8rem] border border-black/[0.03] text-ocean active:bg-crimson active:text-white transition-all"
                >
                  <item.icon size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BOTTOM TAB BAR */}
        <div className="bg-ocean text-white rounded-[3rem] flex justify-around items-center py-4 px-3 shadow-2xl">
          {[MENU_ITEMS[0], MENU_ITEMS[1], MENU_ITEMS[7], MENU_ITEMS[5]].map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `p-3.5 rounded-full transition-all duration-500 relative ${
                  isActive 
                  ? "bg-white text-ocean shadow-xl scale-110" 
                  : "text-white/40"
                }`
              }
            >
              <item.icon size={22} />
              {item.alert && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-crimson rounded-full border-2 border-ocean animate-pulse" />
              )}
            </NavLink>
          ))}

          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`p-3.5 rounded-full transition-all duration-500 ${showMobileMenu ? 'bg-crimson text-white rotate-45 shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <LayoutGrid size={22} />
          </button>
        </div>
      </div>
    </>
  );
}