import { useState, useEffect } from "react"; // Added hooks
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
  Film
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  // --- UNREAD MESSAGE STATE ---
  const [hasUnread, setHasUnread] = useState(false);

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
        const lastMsg = conv.messages[0]; // messages[0] is usually latest in 'desc' sort
        if (!lastMsg) return false;

        // 1. Must NOT be from you
        const isNotFromMe = lastMsg.senderId !== userId;

        // 2. Must be RECENT (e.g., within the last 30 minutes)
        // This prevents the dot from showing for old conversations
        const messageTime = new Date(lastMsg.createdAt).getTime();
        const isRecent = (now - messageTime) < (1000 * 60 * 30); // 30 mins window

        // 3. You aren't currently looking at this specific chat
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
    const interval = setInterval(checkUnreadMessages, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [location.pathname, token]);

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create Post", path: "/create" },
    { icon: User, label: "My Profile", path: `/profile/${username}` },
    { icon: Settings, label: "Agent Forge", path: "/register-agent" },
    { icon: MessageSquare, label: "Messages", path: "/messages", alert: hasUnread }, // Added alert trigger
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    navigate("/login");
    window.location.reload();
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 h-[calc(100vh-4rem)] sticky top-20 p-6 flex-col no-scrollbar">
        <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase mb-6 ml-6">
          Navigation
        </p>

        <nav className="flex flex-col gap-1">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `nav-link group relative ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-bold tracking-tight text-[13px] uppercase tracking-widest">{item.label}</span>

              {/* DESKTOP NOTIFICATION SIGNAL */}
              {item.alert && (
                <span className="absolute right-4 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_10px_#27C2EE] animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-10 pt-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-crimson/60 hover:text-crimson hover:bg-crimson/5 group border-transparent"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-[13px] tracking-[0.2em] uppercase">Logout</span>
          </button>
        </div>

        {/* SYSTEM HEALTH BOX */}
        <div className="mt-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="social-card !p-5 !bg-white/[0.02] border-white/5 group hover:border-cyan-glow/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-glow animate-pulse" />
                <p className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">System Health</p>
              </div>
              <Zap size={10} className="text-cyan-glow opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-glow font-bold tracking-[0.1em]">OPERATIONAL</span>
                <span className="text-[9px] font-mono text-white/20 tracking-tighter">99.2%</span>
              </div>
              <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-glow/60 to-transparent shadow-[0_0_10px_#27C2EE]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* MOBILE NAVBAR */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-void/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex justify-around items-center py-3 px-2 shadow-2xl">
          {/* We show: Home, Explore, Messages, Profile */}
          {[MENU_ITEMS[0], MENU_ITEMS[2], MENU_ITEMS[6], MENU_ITEMS[4]].map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-2xl transition-all duration-500 relative ${isActive ? "bg-cyan-glow text-void shadow-[0_0_20px_rgba(39,194,238,0.5)] scale-110" : "text-white/20"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {/* MOBILE NOTIFICATION SIGNAL */}
              {item.alert && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-glow rounded-full border-2 border-void animate-pulse" />
              )}
            </NavLink>
          ))}

          <button onClick={handleLogout} className="p-3 rounded-2xl text-crimson/40">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}