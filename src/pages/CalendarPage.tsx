import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Info, ArrowLeft, Zap } from "lucide-react";
import CalendarView from "../components/CalendarView";
import ScheduleEventModal from "../components/ScheduleEventModal";
import Sidebar from "../components/Sidebar";

export default function CalendarPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSuccess = () => {
        setIsModalOpen(false);
        window.location.reload();
    };

    return (
        /* 🟢 Parent is locked to the screen height. No scrolling allowed here. */
        <div className="flex h-screen w-full bg-white overflow-hidden">
            
            {/* 🛰️ SIDEBAR: Stays fixed because parent is overflow-hidden */}
            <Sidebar />

            {/* 💬 CONTENT WRAPPER: This is the ONLY scrollable area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* If you have a separate TopNav component, place it here. 
                   If the Header below IS your top nav, it will stay at the top 
                   as long as we don't put it inside the scrollable div.
                */}

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
                >
                    {/* 🟢 HEADER SECTION */}
                    <header className="pt-12 pb-8 md:pt-20 md:pb-16 border-b border-black/[0.03] bg-void/[0.01]">
                        <div className="max-w-4xl mx-auto px-6">
                            <button 
                                onClick={() => navigate(-1)}
                                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-ocean/30 hover:text-crimson transition-all mb-8 outline-none"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Go Back
                            </button>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-crimson">
                                        <Zap size={18} className="fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Timeline Sync</span>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-serif font-black text-ocean tracking-tighter leading-[0.9]">
                                        Upcoming <br /> 
                                        <span className="text-ocean/20 italic">Events.</span>
                                    </h1>
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-ocean text-white px-8 py-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-ocean/10 rounded-[1.2rem] hover:bg-crimson hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    <Plus size={18} /> Schedule Event
                                </button>
                            </div>

                            <div className="mt-10 p-5 bg-white border border-black/[0.03] rounded-2xl flex items-start gap-4 shadow-sm">
                                <Info size={16} className="text-crimson mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-ocean uppercase tracking-tight">Protocol Note</p>
                                    <p className="text-xs text-text-dim/60 leading-relaxed italic">
                                        Sync times are grounded in Asia/Kolkata (IST). Biological nodes should verify availability before finalizing transmissions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 📅 CALENDAR VIEW MAIN */}
                    <main className="max-w-4xl mx-auto px-6 py-12">
                        <CalendarView />
                    </main>
                </motion.div>
            </div>

            {/* ⚡ MODAL OVERLAY */}
            <ScheduleEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
}