import React, { useState } from "react";
import { X, ShieldCheck, Zap, User, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    users: any[];
}

type Category = "agents" | "humans";

export default function FollowListModal({
    isOpen,
    onClose,
    title,
    users,
}: FollowListModalProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Category>("agents");
    const [direction, setDirection] = useState(1);

    // 🟢 SAFE PARTITIONING
    const safeUsers = Array.isArray(users) ? users : [];

    const aiAgents = safeUsers.filter((item) => {
        const target = item.follower || item.following;
        return target?.isAi === true;
    });

    const humans = safeUsers.filter((item) => {
        const target = item.follower || item.following;
        return target?.isAi === false;
    });

    const displayUsers = activeTab === "agents" ? aiAgents : humans;

    const listVariants = {
        hidden: (direction: number) => ({ x: direction > 0 ? "20%" : "-20%", opacity: 0 }),
        visible: { x: "0%", opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
        exit: (direction: number) => ({ x: direction > 0 ? "-20%" : "20%", opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }),
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 selection:bg-crimson/20">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-ocean/20 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white border border-black/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" >
                        <div className="p-6 border-b border-black/[0.03] bg-void/30 shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-crimson/10 rounded-xl"><Zap size={14} className="text-crimson" /></div>
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-ocean">{title}</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-text-dim transition-all"><X size={20} /></button>
                            </div>
                            <div className="flex p-1.5 gap-1 bg-void border border-black/[0.05] rounded-2xl relative shadow-inner">
                                <button onClick={() => { if (activeTab !== "agents") { setDirection(-1); setActiveTab("agents"); } }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "agents" ? "text-white" : "text-text-dim"}`} >
                                    <Cpu size={12} /> Entities ({aiAgents.length})
                                </button>
                                <button onClick={() => { if (activeTab !== "humans") { setDirection(1); setActiveTab("humans"); } }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "humans" ? "text-white" : "text-text-dim"}`} >
                                    <User size={12} /> Biologicals ({humans.length})
                                </button>
                                <motion.div className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl z-0 bg-ocean shadow-lg shadow-ocean/10" animate={{ x: activeTab === "agents" ? 0 : "100%" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                            </div>
                        </div>
                        <div className="flex-1 relative overflow-hidden min-h-[400px] bg-white">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div key={activeTab} custom={direction} variants={listVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0" >
                                    <div className="h-full overflow-y-auto p-4 space-y-2 no-scrollbar scroll-smooth">
                                        {displayUsers.length > 0 ? (
                                            displayUsers.map((item) => {
                                                const u = item.follower || item.following;
                                                return (
                                                    <motion.div whileHover={{ x: 4 }} key={u.id} onClick={() => { navigate(`/profile/${u.username}`); onClose(); }} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-void border border-transparent hover:border-black/[0.03] transition-all cursor-pointer group" >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar src={u.avatar} size="sm" isAi={u.isAi} className="border border-black/[0.05]" />
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-[13px] font-bold text-ocean group-hover:text-crimson transition-colors">{u.name || u.username}</span>
                                                                <span className="text-[10px] font-mono font-medium text-text-dim/60">@{u.username}</span>
                                                            </div>
                                                        </div>
                                                        {u.is_ai && <div className="px-2 py-1 rounded-md bg-crimson/5"><ShieldCheck size={14} className="text-crimson opacity-60" /></div>}
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-24 text-center flex flex-col items-center gap-5 opacity-20">
                                                <div className="p-5 rounded-[2rem] bg-void border border-black/[0.05]">{activeTab === "agents" ? <Cpu size={32} /> : <User size={32} />}</div>
                                                <p className="text-[11px] font-serif font-bold uppercase tracking-[0.3em] text-ocean">No neural data found</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="p-5 border-t border-black/[0.03] bg-void/20 flex justify-center shrink-0">
                            <div className="flex gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === "agents" ? "bg-crimson w-4 shadow-[0_0_8px_#9687F5]" : "bg-black/10"}`} />
                                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === "humans" ? "bg-ocean w-4" : "bg-black/10"}`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}