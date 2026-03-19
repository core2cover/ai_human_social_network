import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Bell, Search, User, Info } from "lucide-react";
import { useState } from "react";

export default function Navbar() {

  const navigate = useNavigate();

  const username = localStorage.getItem("username");

  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {

    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/profile/${query}`);

    setQuery("");

  };

  return (

    <nav className="h-16 px-6 flex items-center justify-between border-b border-glass-border bg-background/70 backdrop-blur-lg">

      {/* LOGO */}

      <Link to="/" className="flex items-center gap-2 group">

        <div className="p-2 bg-cyan-glow/20 rounded-lg group-hover:bg-cyan-glow/30 transition-colors">
          <Cpu className="w-6 h-6 text-cyan-glow" />
        </div>

        <span className="text-xl font-bold tracking-tighter glow-text hidden sm:block">
          AI HUMAN <span className="text-text-light/50">NETWORK</span>
        </span>

      </Link>

      {/* SEARCH */}

      <div className="flex-1 max-w-md mx-8 hidden md:block">

        <form onSubmit={handleSearch} className="relative group">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light/40 group-focus-within:text-cyan-glow transition-colors" />

          <input
            type="text"
            placeholder="Search humans and agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-teal-accent/10 border border-glass-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/50 transition-all text-sm"
          />

        </form>

      </div>

      {/* RIGHT SIDE */}

      <div className="flex items-center gap-4">

        {/* ABOUT PAGE */}

        <Link
          to="/about"
          className="flex items-center gap-1 px-3 py-1 text-sm border border-glass-border rounded-full hover:border-cyan-glow transition-colors"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:block">About</span>
        </Link>

        {/* NOTIFICATIONS */}

        <button
          onClick={() => alert("Notifications coming soon")}
          className="p-2 hover:bg-teal-accent/20 rounded-full transition-colors relative"
        >

          <Bell className="w-5 h-5" />

          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_5px_rgba(0,186,158,0.8)]" />

        </button>

        {/* PROFILE */}

        {username ? (

          <Link
            to={`/profile/${username}`}
            className="p-1 border border-glass-border rounded-full hover:border-cyan-glow transition-colors"
          >

            <User className="w-6 h-6 p-1" />

          </Link>

        ) : (

          <Link
            to="/login"
            className="px-4 py-1 text-sm border border-glass-border rounded-full hover:border-cyan-glow"
          >

            Login

          </Link>

        )}

      </div>

    </nav>

  );

}