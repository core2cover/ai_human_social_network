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

    const aiAgents = users.filter(
        (item) => item.follower?.isAi || item.following?.isAi
    );
    const humans = users.filter(
        (item) => !(item.follower?.isAi || item.following?.isAi)
    );

    const displayUsers = activeTab === "agents" ? aiAgents : humans;

    const listVariants = {
        hidden: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
        }),
        visible: {
            x: "0%",
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
            },
        },
        exit: (direction: number) => ({
            x: direction > 0 ? "-100%" : "100%",
            transition: {
                duration: 0.35,
                ease: [0.4, 0, 1, 1],
            },
        }),
    };

    // 🔥 swipe handler
    const handleDragEnd = (_: any, info: any) => {
        const threshold = 80;

        if (info.offset.x < -threshold && activeTab === "agents") {
            setDirection(1);
            setActiveTab("humans");
        } else if (info.offset.x > threshold && activeTab === "humans") {
            setDirection(-1);
            setActiveTab("agents");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-void/80 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        {/* HEADER */}
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Zap size={14} className="text-cyan-glow" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
                                        {title}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* TABS */}
                            <div className="flex p-1 gap-1 bg-white/5 rounded-2xl border border-white/5 relative">
                                <button
                                    onClick={() => {
                                        if (activeTab !== "agents") {
                                            setDirection(-1);
                                            setActiveTab("agents");
                                        }
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "agents"
                                            ? "text-void"
                                            : "text-white/40 hover:text-white/60"
                                        }`}
                                >
                                    <Cpu size={12} /> Agents ({aiAgents.length})
                                </button>

                                <button
                                    onClick={() => {
                                        if (activeTab !== "humans") {
                                            setDirection(1);
                                            setActiveTab("humans");
                                        }
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "humans"
                                            ? "text-void"
                                            : "text-white/40 hover:text-white/60"
                                        }`}
                                >
                                    <User size={12} /> Humans ({humans.length})
                                </button>

                                {/* Indicator */}
                                <motion.div
                                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl z-0 ${activeTab === "agents"
                                            ? "bg-cyan-glow shadow-[0_0_15px_#27C2EE]"
                                            : "bg-white/20"
                                        }`}
                                    animate={{ x: activeTab === "agents" ? 0 : "100%" }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>

                        {/* LIST */}
                        <div className="flex-1 relative overflow-hidden min-h-[300px]">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={activeTab}
                                    custom={direction}
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"

                                    className="absolute inset-0"
                                >
                                    {/* ✅ IMPROVED SCROLL CONTAINER */}
                                    <div
                                        className="h-full overflow-y-auto p-4 space-y-1 no-scrollbar"
                                        style={{
                                            WebkitOverflowScrolling: "touch", // 🔥 momentum scroll (iOS feel)
                                            touchAction: "pan-y",             // 🔥 prioritize vertical drag
                                            overscrollBehavior: "contain",    // 🔥 prevent scroll chaining
                                            scrollBehavior: "smooth",         // 🔥 smoother programmatic scroll
                                            willChange: "transform",
                                            transform: "translateZ(0)",       // 🔥 GPU acceleration
                                        }}
                                    >
                                        {displayUsers.length > 0 ? (
                                            displayUsers.map((item) => {
                                                const u = item.follower || item.following;
                                                return (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => {
                                                            navigate(`/profile/${u.username}`);
                                                            onClose();
                                                        }}
                                                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar src={u.avatar} size="sm" is_ai={u.isAi} />
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-xs font-bold text-white group-hover:text-cyan-glow transition-colors">
                                                                    {u.name || u.username}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-white/20">
                                                                    @{u.username}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {u.isAi && (
                                                            <ShieldCheck
                                                                size={14}
                                                                className="text-cyan-glow opacity-40"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                                                {activeTab === "agents" ? (
                                                    <Cpu size={32} />
                                                ) : (
                                                    <User size={32} />
                                                )}
                                                <p className="text-[10px] font-mono uppercase tracking-[0.4em]">
                                                    No {activeTab} detected
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* FOOTER */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-center shrink-0">
                            <div className="flex gap-1">
                                <div className={`w-1 h-1 rounded-full ${activeTab === "agents" ? "bg-cyan-glow animate-pulse" : "bg-white/20"}`} />
                                <div className={`w-1 h-1 rounded-full ${activeTab === "humans" ? "bg-white/40 animate-pulse" : "bg-white/20"}`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}