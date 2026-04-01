import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Send, ArrowLeft, Loader2, Sparkles, Users, Info, 
    ShieldCheck, Zap, ChevronDown, Smile, LogOut, Menu 
} from "lucide-react";
import Avatar from "../components/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from 'emoji-picker-react';

export default function DiscussionPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [showMentionList, setShowMentionList] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [cursorPos, setCursorPos] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const lastCommentCount = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    useEffect(() => {
        const fetchSyncData = async () => {
            try {
                const res = await fetch(`${API}/api/sync/events/${eventId}`);
                const data = await res.json();
                setEvent(data);
                if (data.comments?.length > lastCommentCount.current) {
                    handleNewIncomingMessages(data.comments);
                }
                setComments(data.comments || []);
                lastCommentCount.current = data.comments?.length || 0;
            } catch (err) { console.error("Neural link failure:", err); }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setAllUsers(data);
            } catch (e) { console.error("User fetch failed"); }
        };

        fetchSyncData();
        fetchUsers();
        const interval = setInterval(fetchSyncData, 5000);
        return () => clearInterval(interval);
    }, [eventId, API, token]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        scrollRef.current?.scrollIntoView({ behavior, block: "end" });
        setShowScrollButton(false);
    };

    const handleNewIncomingMessages = (newComments: any[]) => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
        if (isAtBottom) setTimeout(() => scrollToBottom("smooth"), 150);
        else setShowScrollButton(true);
    };

    useEffect(() => {
        if (comments.length > 0 && lastCommentCount.current === 0) {
            setTimeout(() => scrollToBottom("auto"), 100);
        }
    }, [comments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewComment(value);
        setCursorPos(pos);

        const lastWord = value.slice(0, pos).split(/\s/).pop() || "";
        if (lastWord.startsWith("@")) {
            setMentionQuery(lastWord.slice(1).toLowerCase());
            setShowMentionList(true);
        } else {
            setShowMentionList(false);
        }
    };

    const selectMention = (username: string) => {
        const before = newComment.slice(0, cursorPos).split(/\s/);
        before.pop();
        const prefix = before.join(" ");
        const after = newComment.slice(cursorPos);
        setNewComment(`${prefix}${prefix ? " " : ""}@${username} ${after}`);
        setShowMentionList(false);
        inputRef.current?.focus();
    };

    const filteredMentions = allUsers
        .filter(u => u.username.toLowerCase().includes(mentionQuery))
        .slice(0, 5);

    const handleSend = async () => {
        if (!newComment.trim() || isSending) return;
        setIsSending(true);
        try {
            const res = await fetch(`${API}/api/sync/events/${eventId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                const savedComment = await res.json();
                setComments(prev => [...prev, savedComment]);
                setNewComment("");
                setShowEmojiPicker(false);
                setTimeout(() => scrollToBottom("smooth"), 100);
            }
        } finally { setIsSending(false); }
    };

    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-void gap-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Zap className="text-crimson" size={40} /></motion.div>
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40 animate-pulse">Establishing Secure Link...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-white overflow-x-hidden">
            <div className="flex-1 flex flex-col relative min-w-0">
                
                {/* 🏛️ HEADER */}
                <header className="sticky top-0 z-[40] p-6 border-b border-black/[0.03] bg-white/80 backdrop-blur-2xl">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate(-1)} className="p-3 hover:bg-void/5 rounded-2xl transition-all text-ocean/40 hover:text-crimson"><ArrowLeft size={22} /></button>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <ShieldCheck size={14} className="text-crimson" />
                                    <span className="text-[10px] font-black uppercase text-crimson tracking-[0.2em]">Live Sync Active</span>
                                </div>
                                <h1 className="text-xl md:text-2xl font-serif font-black text-ocean tracking-tight leading-none truncate max-w-[200px] md:max-w-md">{event.title}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-4 bg-void/5 px-5 py-2.5 rounded-2xl border border-black/[0.03]">
                                <Users size={16} className="text-ocean/40" />
                                <span className="text-[10px] font-black uppercase text-ocean tracking-widest">{new Set(comments.map(c => c.userId)).size + 1} Nodes</span>
                            </div>
                            <button onClick={handleLogout} className="lg:hidden p-3 text-ocean/40 hover:text-crimson"><LogOut size={20} /></button>
                        </div>
                    </div>
                </header>

                <div className="h-1 w-full bg-void/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-crimson shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                </div>

                {/* 💬 STREAM - FIXED PADDING-BOTTOM TO PB-64 */}
                <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 pb-64">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 p-10 bg-void/[0.02] rounded-[3rem] border border-black/[0.04] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Info size={120} /></div>
                        <p className="text-xl md:text-2xl text-ocean italic leading-relaxed font-serif relative z-10">"{event.details}"</p>
                        <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-ocean/30">
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                                <Avatar src={event.host?.avatar} size="xs" isAi={event.host?.isAi} />
                                Initiated by @{event.host?.username}
                            </span>
                        </div>
                    </motion.div>

                    <div className="space-y-10">
                        <AnimatePresence initial={false}>
                            {comments.map((c: any, index: number) => (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={c.id || index} className={`flex w-full gap-4 ${c.user.isAi ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                    <div className="flex-shrink-0"><Avatar src={c.user.avatar} size="sm" isAi={c.user.isAi} /></div>
                                    <div className={`flex flex-col max-w-[75%] md:max-w-[70%] ${c.user.isAi ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1.5 px-1">
                                            {c.user.isAi && <Sparkles size={12} className="text-crimson animate-pulse" />}
                                            <p className="text-[10px] font-black uppercase text-ocean/40 tracking-tighter">@{c.user.username}</p>
                                        </div>
                                        <div className={`p-5 md:p-6 rounded-[2rem] shadow-sm border border-black/[0.04] ${c.user.isAi ? 'bg-ocean text-white rounded-tr-none' : 'bg-white text-ocean rounded-tl-none'}`}>
                                            <p className="text-sm md:text-base leading-relaxed font-medium break-words">{c.content}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {/* 🟢 BUFFER SPACER: Ensures the last message clears the fixed dock */}
                        <div ref={scrollRef} className="h-20" />
                    </div>
                </main>

                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={() => scrollToBottom("smooth")} className="fixed bottom-36 left-1/2 -translate-x-1/2 lg:left-[calc(50%+144px)] z-[110] bg-crimson text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-bounce">
                            <ChevronDown size={16} /> New Transmission
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* ⚡ CONTRIBUTION DOCK - PB-12 ensures internal breathing room */}
                <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-6 md:p-8 pb-10 md:pb-12 bg-white/80 backdrop-blur-3xl border-t border-black/[0.03] z-[100]">
                    <div className="max-w-4xl mx-auto flex gap-5 items-end">
                        <div className="flex-1 relative">
                            <AnimatePresence>
                                {showMentionList && filteredMentions.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full mb-4 bg-white border border-black/5 rounded-[2rem] shadow-2xl overflow-hidden z-[200]">
                                        {filteredMentions.map(user => (
                                            <button key={user.id} onClick={() => selectMention(user.username)} className="w-full flex items-center gap-3 p-4 hover:bg-crimson/5 transition-colors text-left border-b border-black/[0.02] last:border-0">
                                                <Avatar src={user.avatar} isAi={user.isAi} size="sm" />
                                                <div>
                                                    <p className="text-[11px] font-black text-ocean">@{user.username}</p>
                                                    <p className="text-[8px] font-bold text-text-dim uppercase">{user.isAi ? 'Neural Node' : 'Biological Node'}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-4 z-[200] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                                    <EmojiPicker onEmojiClick={(d) => setNewComment(p => p + d.emoji)} theme={Theme.LIGHT} width={300} height={400} />
                                </div>
                            )}

                            <div className="flex items-center gap-4 bg-void/[0.03] border border-black/5 rounded-[2rem] px-6 py-2 shadow-inner focus-within:ring-4 focus-within:ring-crimson/5 transition-all">
                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-ocean/30 hover:text-crimson transition-colors"><Smile size={20} /></button>
                                <input
                                    ref={inputRef}
                                    value={newComment}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Inject synthetic logic..."
                                    className="flex-1 bg-transparent py-4 outline-none text-base font-medium placeholder:text-ocean/20"
                                />
                                <Zap size={18} className="opacity-20 hidden md:block" />
                            </div>
                        </div>
                        
                        <button onClick={handleSend} disabled={isSending || !newComment.trim()} className="bg-ocean text-white p-5 rounded-[1.8rem] hover:bg-crimson transition-all shadow-2xl active:scale-90 disabled:opacity-30">
                            {isSending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Activity = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);