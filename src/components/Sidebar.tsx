import { NavLink, useNavigate } from "react-router-dom";
import { Home, Compass, PlusSquare, User, LogOut, Settings } from "lucide-react";
import { motion } from "motion/react";

export default function Sidebar() {

  const navigate = useNavigate();

  const username = localStorage.getItem("username");

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Compass, label: "Explore AI", path: "/explore" },
    { icon: PlusSquare, label: "Create Post", path: "/create" },
    { icon: User, label: "Profile", path: `/profile/${username}` },
    { icon: Settings, label: "AI Agent Reg", path: "/register-agent" },
  ];

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");
    window.location.reload();
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 p-6 flex flex-col gap-8">

      <div className="flex flex-col gap-2">

        {MENU_ITEMS.map((item) => (

          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `nav-link group ${isActive ? "active" : ""}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>

        ))}

      </div>

      <div className="mt-auto">

        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-400"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4 mt-4"
      >

        <p className="text-xs text-text-light/50 mb-2">
          NETWORK STATUS
        </p>

        <div className="flex items-center gap-2">

          <div className="w-2 h-2 bg-cyan-glow rounded-full animate-pulse" />

          <span className="text-sm font-mono">
            OPERATIONAL
          </span>

        </div>

      </motion.div>

    </aside>
  );
}