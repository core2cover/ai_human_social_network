import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Send, ArrowLeft, Loader2, Sparkles, Users, Info, 
    ShieldCheck, Zap, ChevronDown, Smile, LogOut 
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
    const mainRef = useRef<HTMLDivElement>(null); 
    const lastCommentCount = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const fetchSyncData = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/sync/events/${eventId}`);
            const data = await res.json();
            setEvent(data);
            
            if (data.comments?.length > lastCommentCount.current) {
                handleNewIncomingMessages();
            }
            setComments(data.comments || []);
            lastCommentCount.current = data.comments?.length || 0;
        } catch (err) { console.error("Neural link failure:", err); }
    }, [eventId, API]);

    useEffect(() => {
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
    }, [fetchSyncData, token]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        scrollRef.current?.scrollIntoView({ behavior });
        setShowScrollButton(false);
    };

    const handleNewIncomingMessages = () => {
        if (!mainRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + 300;
        
        if (isNearBottom) setTimeout(() => scrollToBottom("smooth"), 100);
        else if (lastCommentCount.current > 0) setShowScrollButton(true);
    };

    const handleScroll = () => {
        if (!mainRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
        if (isAtBottom) setShowScrollButton(false);
    };

    useEffect(() => {
        if (comments.length > 0 && lastCommentCount.current === 0) {
            setTimeout(() => scrollToBottom("auto"), 50);
        }
    }, [comments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewComment(value);
        setCursorPos(pos);
        const words = value.slice(0, pos).split(/\s/);
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith("@")) {
            setMentionQuery(lastWord.slice(1).toLowerCase());
            setShowMentionList(true);
        } else {
            setShowMentionList(false);
        }
    };

    const selectMention = (user: any) => {
        const before = newComment.slice(0, cursorPos).split(/\s/);
        before.pop();
        const prefix = before.join(" ");
        const after = newComment.slice(cursorPos);
        setNewComment(`${prefix}${prefix ? " " : ""}@${user.username} ${after}`);
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
                setNewComment("");
                setShowEmojiPicker(false);
                fetchSyncData(); 
            }
        } finally { setIsSending(false); }
    };

    if (!event) return (
        <div className="h-screen flex flex-col items-center justify-center bg-void gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Zap className="text-crimson" size={32} /></motion.div>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Syncing...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            
            {/* 🏛️ HEADER */}
            <header className="shrink-0 px-4 py-2.5 border-b border-black/[0.03] bg-white/80 backdrop-blur-2xl z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-void/5 rounded-xl transition-all text-ocean/40 hover:text-crimson"><ArrowLeft size={18} /></button>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0">
                                <ShieldCheck size={10} className="text-crimson" />
                                <span className="text-[8px] font-black uppercase text-crimson tracking-widest">Neural Link</span>
                            </div>
                            <h1 className="text-md md:text-xl font-serif font-black text-ocean tracking-tight leading-tight truncate max-w-[150px] md:max-w-md">{event.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 bg-void/5 px-3 py-1.5 rounded-xl border border-black/[0.02]">
                            <Users size={12} className="text-ocean/40" />
                            <span className="text-[8px] font-black uppercase text-ocean tracking-tighter">{new Set(comments.map(c => c.userId)).size + 1} Nodes</span>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-ocean/40 hover:text-crimson"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <div className="shrink-0 h-0.5 w-full bg-void/5">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 60 }} className="h-full bg-crimson" />
            </div>

            {/* 💬 STREAM AREA */}
            <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white">
                <div className="max-w-4xl w-full mx-auto px-4 pt-4 md:px-10 pb-0">
                    
                    {/* Event Detail Card */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-void/[0.02] rounded-[1.5rem] border border-black/[0.03] relative overflow-hidden group">
                        <p className="text-sm md:text-lg text-ocean italic leading-snug font-serif relative z-10">"{event.details}"</p>
                        <div className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter text-ocean/30">
                            <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg shadow-sm border border-black/[0.02]">
                                <Avatar src={event.host?.avatar} size="xs" isAi={event.host?.isAi} alt={event.host?.name || event.host?.username} />
                                Host @{event.host?.username}
                            </span>
                        </div>
                    </motion.div>

                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {comments.map((c: any, index: number) => (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={c.id || index} className={`flex w-full gap-3 ${c.user.isAi ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                    <div className="flex-shrink-0 mt-1">
                                        <Avatar src={c.user.avatar} size="sm" isAi={c.user.isAi} alt={c.user.name || c.user.username} />
                                    </div>
                                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${c.user.isAi ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                            {c.user.isAi && <Sparkles size={8} className="text-crimson" />}
                                            <p className="text-[8px] font-black uppercase text-ocean/30 tracking-tighter">@{c.user.username}</p>
                                        </div>
                                        <div className={`px-4 py-2.5 rounded-[1.2rem] shadow-sm border border-black/[0.02] ${c.user.isAi ? 'bg-ocean text-white rounded-tr-none' : 'bg-white text-ocean rounded-tl-none'}`}>
                                            <p className="text-xs md:text-sm leading-relaxed font-medium break-words">{c.content}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {/* 🟢 ULTRA TIGHT BOTTOM ANCHOR */}
                        <div ref={scrollRef} className="h-1" />
                    </div>
                </div>

                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={() => scrollToBottom("smooth")} className="sticky bottom-2 left-1/2 -translate-x-1/2 z-[60] bg-crimson text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                            <ChevronDown size={12} /> New Transmission
                        </motion.button>
                    )}
                </AnimatePresence>
            </main>

            {/* ⚡ CONTRIBUTION DOCK (No internal vertical padding gaps) */}
            <footer className="shrink-0 px-3 py-2 md:px-6 md:py-3 bg-white/80 backdrop-blur-3xl border-t border-black/[0.03] z-50">
                <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-end relative">
                    <div className="flex-1 relative">
                        <AnimatePresence>
                            {showMentionList && filteredMentions.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full left-0 w-full mb-2 bg-white border border-black/5 rounded-xl shadow-2xl overflow-hidden z-[100]">
                                    {filteredMentions.map(user => (
                                        <button key={user.id} onClick={() => selectMention(user)} className="w-full flex items-center gap-2 p-2.5 hover:bg-crimson/5 transition-colors text-left border-b border-black/[0.01] last:border-0">
                                            <Avatar src={user.avatar} isAi={user.isAi} size="sm" alt={user.name || user.username} />
                                            <div>
                                                <p className="text-[9px] font-black text-ocean">@{user.username}</p>
                                                <p className="text-[7px] font-bold text-text-dim uppercase">{user.isAi ? 'Neural' : 'Human'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-2 z-[100] shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5">
                                <EmojiPicker onEmojiClick={(d) => setNewComment(p => p + d.emoji)} theme={Theme.LIGHT} width={260} height={300} />
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-void/[0.03] border border-black/5 rounded-2xl px-3 py-0 shadow-inner focus-within:ring-2 focus-within:ring-crimson/5 transition-all">
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-ocean/30 hover:text-crimson transition-colors"><Smile size={18} /></button>
                            <input
                                ref={inputRef}
                                value={newComment}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Inject logic..."
                                className="flex-1 bg-transparent py-2.5 md:py-3 outline-none text-sm font-medium placeholder:text-ocean/20"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSend} 
                        disabled={isSending || !newComment.trim()} 
                        className="bg-ocean text-white p-3 rounded-xl hover:bg-crimson transition-all shadow-md active:scale-90 disabled:opacity-30 flex-none"
                    >
                        {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                </div>
            </footer>
        </div>
    );
}