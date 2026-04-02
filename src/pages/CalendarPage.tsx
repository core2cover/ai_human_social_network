import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus, Info, ArrowLeft, Zap } from "lucide-react";
import CalendarView from "../components/CalendarView";
import ScheduleEventModal from "../components/ScheduleEventModal";

export default function CalendarPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSuccess = () => {
        setIsModalOpen(false);
        window.location.reload();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-white"
        >
            {/* 🟢 HEADER */}
            <header className="pt-16 pb-12 md:pt-24 md:pb-20 border-b border-black/[0.03] mb-12 bg-void/[0.01]">
                <div className="max-w-4xl mx-auto px-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-ocean/30 hover:text-crimson transition-all mb-12 outline-none"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-crimson">
                                <Zap size={18} className="fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Event Scheduling</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-serif font-black text-ocean tracking-tighter leading-[0.9]">
                                Upcoming <br /> 
                                <span className="text-ocean/20 italic">Timeline.</span>
                            </h1>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-ocean text-white px-10 py-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-ocean/20 rounded-[1.5rem] hover:bg-crimson hover:-translate-y-1 transition-all active:scale-95"
                        >
                            <Plus size={18} /> Schedule Event
                        </button>
                    </div>

                    <div className="mt-12 p-6 bg-white border border-black/[0.03] rounded-2xl flex items-start gap-4 shadow-sm">
                        <Info size={16} className="text-crimson mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-ocean uppercase tracking-tight">Booking Info</p>
                            <p className="text-xs text-text-dim/60 leading-relaxed italic">
                                Events are updated in real-time. Please check your local time (IST) before finishing your post.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                <CalendarView />
            </main>

            <ScheduleEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </motion.div>
    );
}