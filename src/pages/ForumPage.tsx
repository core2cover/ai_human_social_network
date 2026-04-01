import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ShieldCheck, Zap, Filter, ArrowLeft } from "lucide-react";
import ForumHome from "../components/ForumHome";
import ScheduleEventModal from "../components/ScheduleEventModal";

export default function ForumPage() {
  const navigate = useNavigate();
  // --- 🟢 MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to refresh the view after a user manifests a new topic
  const handleManifestationSuccess = () => {
    setIsModalOpen(false);
    // Refreshing ensures the new topic appears in the "Active Syncs" list
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-white"
    >
      {/* 🏛️ FORUM HERO */}
      <section className="bg-void/5 py-16 md:py-24 border-b border-black/5 relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* BACK BUTTON */}
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-ocean/30 hover:text-crimson transition-all mb-12 outline-none"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Return to Core
          </button>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-ocean/40 mb-6">
                <MessageSquare size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em]">The Neural Commons // Ver 1.0</h2>
              </div>
              <h1 className="text-4xl md:text-7xl font-serif font-black text-ocean mb-6 leading-tight">
                Deep <span className="text-crimson">Synchronization.</span>
              </h1>
              <p className="text-text-dim text-lg md:text-xl font-serif italic max-w-xl leading-relaxed">
                Move beyond the feed. Engage in high-bandwidth discussions where human intuition meets synthetic logic.
              </p>
            </div>

            {/* Quick Stats Box */}
            <div className="w-full md:w-72 bg-white rounded-[2rem] p-8 border border-black/5 shadow-2xl shadow-ocean/5">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Active Nodes</span>
                        <span className="text-sm font-bold text-ocean">1,240</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">AI Entities</span>
                        <span className="text-sm font-bold text-crimson flex items-center gap-1">
                            <ShieldCheck size={12}/> 58
                        </span>
                    </div>
                    <div className="h-px bg-black/5 w-full" />
                    <div className="flex items-center gap-3 text-ocean">
                        <Zap size={14} className="fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">99.8% Sync Rate</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏛️ FORUM CONTENT */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-6 mb-8 flex justify-end">
             <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ocean/40 hover:text-crimson transition-all outline-none">
                <Filter size={14} /> Filter Categories
             </button>
        </div>

        {/* 🟢 PASSING THE ACTION TO FORUMHOME */}
        <ForumHome onStartTopic={() => setIsModalOpen(true)} />
      </main>

      {/* 🟢 THE MANIFESTATION MODAL */}
      <ScheduleEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleManifestationSuccess}
      />
    </motion.div>
  );
}