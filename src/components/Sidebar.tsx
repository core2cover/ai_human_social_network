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
  Bot
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
      const unread = data.some((conv: any) => {
        const lastMsg = conv.messages?.[0];
        if (!lastMsg) return false;
        return lastMsg.senderId !== userId && location.pathname !== `/messages/${conv.id}`;
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
      <aside className="hidden md:flex w-64 h-full flex-col border-r border-black/[0.05] bg-white shrink-0 selection:bg-crimson/20">

        {/* Container for everything */}
        <div className="p-5 flex flex-col h-full overflow-y-auto no-scrollbar">

          {/* Header Label */}
          <p className="text-[9px] font-black text-text-dim/30 tracking-[0.4em] uppercase mb-4 ml-2">
            Neural Directory
          </p>

          {/* MAIN NAVIGATION */}
          <nav className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative font-serif font-bold text-sm ${isActive
                    ? "bg-ocean text-white shadow-md"
                    : "text-text-dim hover:bg-void hover:text-ocean"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.alert && (
                  <span className="absolute right-4 w-2 h-2 bg-crimson rounded-full animate-pulse" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* 🟢 LOGOUT SECTION - Moved up with a top margin/border */}
          <div className="mt-8 pt-6 border-t border-black/[0.03]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-2 w-full text-text-dim/40 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest outline-none group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>

          {/* Optional: Add an empty spacer here if you want it to sit 
              above the very bottom but below the menu */}
          <div className="flex-1" />
        </div>
      </aside>

      {/* --- MOBILE BOTTOM BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100]">
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 bg-white/95 backdrop-blur-xl border border-black/[0.05] rounded-3xl p-3 shadow-2xl grid grid-cols-2 gap-2"
            >
              {[MENU_ITEMS[2], MENU_ITEMS[3], MENU_ITEMS[4], MENU_ITEMS[6]].map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-3 p-4 bg-void/50 rounded-2xl text-ocean active:bg-ocean active:text-white transition-all"
                >
                  <item.icon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 p-3 text-red-500 font-black text-[9px] uppercase tracking-widest"
              >
                <LogOut size={14} /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white border-t border-black/[0.05] flex justify-around items-center py-2 px-2 pb-safe">
          {[MENU_ITEMS[0], MENU_ITEMS[1], MENU_ITEMS[7], MENU_ITEMS[5]].map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-2xl transition-all duration-300 relative ${isActive ? "text-ocean scale-110" : "text-text-dim/40"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.alert && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-crimson rounded-full border-2 border-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`p-3 rounded-2xl transition-all duration-300 ${showMobileMenu ? "text-crimson rotate-90" : "text-text-dim/40"
              }`}
          >
            <LayoutGrid size={24} />
          </button>
        </div>
      </div>
    </>
  );
}