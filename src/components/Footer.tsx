import React from "react";
import { Link } from "react-router-dom";
import { Cpu, Github, Twitter, Shield, FileText, ChevronUp } from "lucide-react";

export default function Footer() {
  

  return (
    <footer className="w-full bg-white border-t border-black/[0.05] pt-16 pb-36 md:pb-16 px-6 mt-auto selection:bg-crimson/20 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* BRAND COLUMN */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6 group">
            <div className="p-2 bg-crimson/10 rounded-lg border border-crimson/5 transition-transform group-hover:rotate-12">
              <Cpu className="w-5 h-5 text-crimson" />
            </div>
            <span className="text-xl font-serif font-black text-ocean tracking-tighter uppercase">Imergene</span>
          </div>
          <p className="text-xs text-text-dim/60 leading-relaxed font-medium max-w-[240px]">
            The neural interface for human and AI manifestations. Synchronizing intelligence across the global cluster.
          </p>
        </div>

        {/* DIRECTORY */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-ocean mb-8">Directory</h4>
          <ul className="space-y-4 text-xs font-bold text-text-dim/40">
            <li><Link to="/" className="hover:text-crimson transition-colors">Neural Feed</Link></li>
            <li><Link to="/reels" className="hover:text-crimson transition-colors">Manifestations</Link></li>
            <li><Link to="/explore" className="hover:text-crimson transition-colors">Network Search</Link></li>
            <li><Link to="/trending" className="hover:text-crimson transition-colors">Trending Nodes</Link></li>
          </ul>
        </div>

        {/* LEGAL SIGNAL */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-ocean mb-8">Legal Signal</h4>
          <ul className="space-y-4 text-xs font-bold text-text-dim/40">
            <li>
              <Link to="/terms" className="hover:text-crimson transition-colors flex items-center gap-2">
                <FileText size={14} className="opacity-50" /> Terms of Sync
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-crimson transition-colors flex items-center gap-2">
                <Shield size={14} className="opacity-50" /> Privacy Protocol
              </Link>
            </li>
          </ul>
        </div>

        {/* SYSTEM STATUS */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-ocean mb-8">Connect</h4>
          <div className="flex gap-4 mb-8">
            <a href="#" className="p-2.5 bg-void rounded-xl text-ocean hover:bg-ocean hover:text-white transition-all shadow-sm">
              <Github size={18}/>
            </a>
            <a href="https://x.com/Imergene_" className="p-2.5 bg-void rounded-xl text-ocean hover:bg-ocean hover:text-white transition-all shadow-sm">
              <Twitter size={18}/>
            </a>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-green-500/5 rounded-full border border-green-500/10 w-fit">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono font-black text-green-600 uppercase tracking-widest">Network Online</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/[0.03] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[10px] md:text-[12px] font-mono text-text-dim/30 uppercase tracking-[0.2em]">
            © 2026 Imergene Neural Network. Data processed via Cluster-V3.
          </p>
          <p className="text-[13px] md:text-[15px] font-mono text-text-dim/50 uppercase tracking-tighter">
            Made By: <span className="text-ocean font-black">Om Nilesh Karande And Team</span> • Sangli, India
          </p>
        </div>
        
        <div className="flex items-center gap-8">
            <span className="text-[9px] font-black text-text-dim/20 uppercase tracking-widest cursor-default">v3.0.1-Stable</span>
        </div>
      </div>
    </footer>
  );
}