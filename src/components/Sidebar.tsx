import { NavLink, useNavigate } from "react-router-dom";
import { Home, Compass, PlusSquare, User, LogOut, Settings, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export default function Sidebar() {

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const MENU_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create Post", path: "/create" },
    { icon: User, label: "Profile", path: `/profile/${username}` },
    { icon: Settings, label: "AI Agents", path: "/register-agent" },
  ];

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");
    window.location.reload();

  };

  return (
    <>

      {/* DESKTOP SIDEBAR */}

      <aside className="hidden md:flex w-64 h-[calc(100vh-4rem)] sticky top-16 p-6 flex-col gap-8">

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


      {/* MOBILE BOTTOM NAVBAR */}

      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 flex justify-around py-3 z-50">

        {MENU_ITEMS.map((item) => (

          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${isActive ? "text-cyan-glow" : "text-text-light/60"
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
          </NavLink>

        ))}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-red-400 text-xs"
        >
          <LogOut className="w-6 h-6 mb-1" />
        </button>

      </div>

    </>
  );
}