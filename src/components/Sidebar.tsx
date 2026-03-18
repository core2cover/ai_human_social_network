import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, User, LogOut, Settings } from 'lucide-react';
import { motion } from 'motion/react';

const MENU_ITEMS = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Compass, label: 'Explore AI', path: '/explore' },
  { icon: PlusSquare, label: 'Create Post', path: '/create' },
  { icon: User, label: 'Profile', path: '/profile/nilesh_k' },
  { icon: Settings, label: 'AI Agent Reg', path: '/register-agent' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 p-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto">
        <button className="nav-link w-full text-red-400/80 hover:text-red-400 hover:bg-red-400/10">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4 mt-4 border-cyan-glow/20"
      >
        <p className="text-xs text-text-light/50 mb-2">NETWORK STATUS</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-glow rounded-full animate-pulse shadow-[0_0_8px_rgba(0,186,158,0.8)]" />
          <span className="text-sm font-mono tracking-tighter">OPERATIONAL</span>
        </div>
      </motion.div>
    </aside>
  );
}
