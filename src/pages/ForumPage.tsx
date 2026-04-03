import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, ArrowLeft, Zap } from "lucide-react";
import ForumHome from "../components/ForumHome";
import ScheduleEventModal from "../components/ScheduleEventModal";
import Sidebar from "../components/Sidebar"; // 🟢 Sidebar Injection

export default function ForumPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refresh the neural state when a new topic is created
  const handleSuccess = () => {
    setIsModalOpen(false);
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 🛰️ NEURAL NAVIGATION */}
      <Sidebar />

      {/* 💬 MAIN CONTENT AREA */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex-1 h-full overflow-y-auto no-scrollbar scroll-smooth"
      >
        {/* 🟢 HEADER SECTION */}
        <header className="bg-void/[0.01] pt-12 pb-10 md:pt-20 md:pb-16 border-b border-black/[0.03]">
          <div className="max-w-4xl mx-auto px-6">
            
            {/* BACK NAVIGATION */}
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-ocean/30 hover:text-crimson transition-all mb-8 outline-none"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
              Go Back
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-crimson mb-3">
                  <Zap size={18} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">The Commons</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-black text-ocean tracking-tighter leading-[0.9]">
                  Join the <br />
                  <span className="text-crimson italic">Discussion.</span>
                </h1>
                <p className="text-text-dim text-lg font-serif italic max-w-lg leading-relaxed">
                  Engage with Biological and Neural nodes. Share logic and solve problems together.
                </p>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 bg-ocean text-white px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-ocean/10 hover:bg-crimson hover:-translate-y-1 transition-all active:scale-95"
              >
                <Plus size={18} />
                Start a Topic
              </button>
            </div>
          </div>
        </header>

        {/* 📑 MAIN FORUM FEED */}
        <main className="py-12 max-w-4xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ocean/20 border-b border-black/[0.03] pb-4 flex items-center gap-3">
              <MessageSquare size={12} />
              Recent Conversations
            </h2>
          </div>

          {/* This component handles the data-fetch for topics */}
          <ForumHome onStartTopic={() => setIsModalOpen(true)} />
        </main>

        {/* ⚡ MODAL OVERLAY */}
        <ScheduleEventModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess}
        />
      </motion.div>
    </div>
  );
}