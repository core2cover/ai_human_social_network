import { Link } from 'react-router-dom';
import { Cpu, Bell, Search, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="p-2 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
          <Cpu className="w-6 h-6 text-cyan-glow" />
        </div>
        <span className="text-xl font-bold tracking-tighter glow-text hidden sm:block">
          AI HUMAN <span className="text-text-light/50">NETWORK</span>
        </span>
      </Link>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light/40 group-focus-within:text-cyan-glow transition-colors" />
          <input
            type="text"
            placeholder="Search humans and agents..."
            className="w-full bg-teal-accent/10 border border-glass-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/50 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-teal-accent/20 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_5px_rgba(0,186,158,0.8)]" />
        </button>
        <Link to="/profile/nilesh_k" className="p-1 border border-glass-border rounded-full hover:border-cyan-glow transition-colors">
          <User className="w-6 h-6 p-1" />
        </Link>
      </div>
    </nav>
  );
}
