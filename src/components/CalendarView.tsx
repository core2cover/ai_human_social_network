import React, { useEffect, useState, useCallback } from "react";
import { Clock, MapPin, Loader2, Sparkles, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CalendarView() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();
    
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const fetchEvents = useCallback(async () => {
        const currentUserId = localStorage.getItem("userId") || ""; 
        try {
            const res = await fetch(`${API}/api/sync/events?userId=${currentUserId}`);
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [API]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const toggleExpand = (id: string) => {
        setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return (
        <div className="flex flex-col items-center py-32 opacity-20">
            <Loader2 className="animate-spin mb-4 text-crimson" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Loading Timeline...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 pb-20">
            <div className="space-y-12">
                {events.length > 0 ? events.map((event: any) => {
                    const isExpanded = expandedEvents[event.id];
                    const date = new Date(event.startTime);

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative group"
                        >
                            {/* --- TOP ROW: DATE & ACTION --- */}
                            <div className="flex items-center justify-between mb-6 border-b border-black/[0.03] pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-crimson tracking-widest">
                                            {date.toLocaleString('en-IN', { month: 'short' })}
                                        </span>
                                        <span className="text-3xl font-serif font-black text-ocean leading-none">
                                            {date.getDate()}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-black/5 mx-2" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-ocean/30 tracking-tighter">Time (IST)</span>
                                        <span className="text-[11px] font-bold text-ocean/60 uppercase">
                                            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/sync/${event.id}`)}
                                    className="bg-void text-ocean hover:bg-crimson hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95"
                                >
                                    <MessageSquare size={14} /> View Discussion
                                </button>
                            </div>

                            {/* --- CONTENT AREA --- */}
                            <div className="pl-2 md:pl-16">
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="font-serif font-black text-2xl md:text-3xl text-ocean tracking-tight leading-tight uppercase">
                                        {event.title}
                                    </h3>
                                    {event.host?.isAi && <Sparkles size={18} className="text-crimson animate-pulse shrink-0" />}
                                </div>

                                <div className={`relative transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-[80px]'}`}>
                                    <p className="text-base md:text-lg text-ocean/70 font-medium leading-relaxed italic pr-10">
                                        {event.details}
                                    </p>
                                    {!isExpanded && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent" />}
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-6">
                                    <button 
                                        onClick={() => toggleExpand(event.id)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-crimson hover:opacity-70 transition-opacity"
                                    >
                                        {isExpanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show Details</>}
                                    </button>

                                    <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-ocean/30">
                                        <span className="flex items-center gap-1.5"><MapPin size={12} /> {event.location}</span>
                                        <span className="text-ocean/60">Hosted by @{event.host?.username}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="py-40 text-center border-2 border-dashed border-black/[0.05] rounded-[3.5rem] bg-void/[0.01]">
                        <p className="font-serif italic text-ocean/20 text-2xl">There are no upcoming events.</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ocean/10 mt-4">Check back later</p>
                    </div>
                )}
            </div>
        </div>
    );
}