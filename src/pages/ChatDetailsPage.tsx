import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
    Send, 
    ChevronLeft, 
    Smile, 
    CheckCheck, 
    Zap, 
    Cpu, 
    ExternalLink, 
    Loader2, 
    AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "../components/Avatar";
import EmojiPicker, { Theme } from 'emoji-picker-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatDetailsPage() {
    const { id } = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Typing Status
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Mentions
    const [showMentions, setShowMentions] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem("token");
    const myUsername = localStorage.getItem("username");

    // --- SCROLL UTILITY ---
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    // --- API: TYPING STATUS ---
    const broadcastTyping = async (isTyping: boolean) => {
        try {
            await fetch(`${API}/api/chat/conversations/${id}/typing`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isTyping })
            });
        } catch (err) { /* Silent fail for typing broadcast */ }
    };

    // --- API: LOAD CHAT DATA ---
    const loadChat = async (isInitial = false) => {
        try {
            const res = await fetch(`${API}/api/chat/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Sync Interrupted");
            
            const data = await res.json();
            const newMessages = data.messages || [];

            const container = chatContainerRef.current;
            const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 150) : true;

            setMessages(newMessages);
            setOtherUser(data.participants?.find((p: any) => p.username !== myUsername));

            if (isInitial || (isAtBottom && newMessages.length > messages.length)) {
                setTimeout(() => scrollToBottom(isInitial ? "auto" : "smooth"), 60);
            }

            // Sync typing status from participant metadata
            setIsOtherTyping(!!data.lastTypingId && data.lastTypingId !== localStorage.getItem("userId"));
            setError(null);
        } catch (err) { 
            console.error("Neural sync failed"); 
            if (isInitial) setError("Connection to node lost.");
        }
    };

    // --- API: FETCH ALL USERS FOR MENTIONS ---
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch(`${API}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) setAllUsers(data);
            } catch (err) { console.error("Mention nodes unavailable"); }
        }
        fetchUsers();
    }, [token]);

    // UI: Outside Click Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // POLLING: Keep chat in sync
    useEffect(() => {
        loadChat(true);
        const interval = setInterval(() => loadChat(false), 4000);
        return () => clearInterval(interval);
    }, [id]);

    // --- HANDLERS ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        if (!typingTimeoutRef.current) broadcastTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            broadcastTyping(false);
            typingTimeoutRef.current = null;
        }, 3000);

        const lastWord = value.split(" ").pop() || "";
        if (lastWord.startsWith("@")) {
            const query = lastWord.slice(1).toLowerCase();
            const matches = allUsers.filter(u =>
                u.username.toLowerCase().includes(query) || (u.name && u.name.toLowerCase().includes(query))
            ).slice(0, 5);
            setFilteredUsers(matches);
            setShowMentions(matches.length > 0);
        } else { setShowMentions(false); }
    };

    const insertMention = (username: string) => {
        const words = input.split(" ");
        words.pop();
        setInput([...words, `@${username} `].join(" "));
        setShowMentions(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;
        setIsSending(true);

        const optimisticId = Date.now().toString();
        const optimisticMsg = {
            id: optimisticId,
            content: input,
            sender: { username: myUsername },
            createdAt: new Date().toISOString(),
            sending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInput("");
        setShowEmojiPicker(false);
        setTimeout(() => scrollToBottom("smooth"), 50);

        try {
            const res = await fetch(`${API}/api/chat/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ conversationId: id, content: optimisticMsg.content })
            });
            if (res.ok) {
                const confirmedMsg = await res.json();
                setMessages(prev => prev.map(m => m.id === optimisticId ? confirmedMsg : m));
            }
        } catch (err) { console.error("Transmission failed"); }
        finally { setIsSending(false); }
    };

    if (error) return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <AlertCircle className="w-10 h-10 text-crimson opacity-40" />
            <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase">Re-establish Link</button>
        </div>
    );

    if (!otherUser) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="w-6 h-6 text-cyan-glow animate-spin opacity-20" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 px-4 pb-24 md:pb-0">
            {/* HEADER */}
            <div className="social-card !p-3 !mb-4 flex items-center gap-4 shrink-0">
                <Link to="/messages" className="p-2 hover:bg-white/5 rounded-full text-white/40">
                    <ChevronLeft size={20} />
                </Link>
                <Avatar src={otherUser.avatar} size="sm" is_ai={otherUser.isAi} />
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white text-xs uppercase tracking-widest truncate">{otherUser.name || otherUser.username}</h2>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${otherUser.isAi ? 'bg-cyan-glow animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-[8px] text-white/20 uppercase font-black">{otherUser.isAi ? "Neural Link Active" : "Human Verified"}</span>
                    </div>
                </div>
            </div>

            {/* CHAT THREAD */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4 bg-white/[0.01] rounded-3xl border border-white/5 mb-4 scroll-smooth">
                {messages.map((m, idx) => {
                    const isMe = m.sender?.username === myUsername || m.senderId === localStorage.getItem("userId");
                    const isShare = m.metadata?.type === "POST_SHARE";
                    const mediaUrl = m.mediaUrl || m.metadata?.mediaUrl;
                    const mediaType = m.mediaType || m.metadata?.mediaType;
                    
                    // Link logic: Points to the PostInspect component route
                    const postLink = isShare ? `/profile/${m.metadata?.postOwner}/post/${m.metadata?.postId}` : null;

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            key={m.id || idx} 
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {isShare && (
                                    <span className="text-[9px] font-black text-cyan-glow/60 uppercase tracking-tighter mb-1 px-2">
                                        {m.metadata?.shareHeader || "Shared Broadcast"}
                                    </span>
                                )}

                                <div className={`overflow-hidden rounded-2xl text-sm transition-all border ${
                                    isMe ? 'bg-cyan-glow text-void border-cyan-glow shadow-[0_0_15px_rgba(39,194,238,0.2)]' : 'bg-white/5 text-white/90 border-white/10 backdrop-blur-md'
                                } ${isShare ? 'hover:bg-white/10 hover:border-cyan-glow/30' : ''}`}>
                                    
                                    {isShare ? (
                                        <Link to={postLink || "#"} className="block group/share relative">
                                            {mediaUrl && (
                                                <div className="relative overflow-hidden bg-black/40">
                                                    {mediaType === "video" ? (
                                                        <video 
                                                            src={mediaUrl} 
                                                            className="w-full max-h-64 object-cover border-b border-white/10" 
                                                            muted playsInline 
                                                            onMouseOver={(e) => e.currentTarget.play()} 
                                                            onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} 
                                                        />
                                                    ) : (
                                                        <img src={mediaUrl} alt="broadcast" className="w-full max-h-64 object-cover border-b border-white/10 group-hover/share:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                                                    )}
                                                    <div className="absolute top-2 right-2 bg-void/80 backdrop-blur-md p-1.5 rounded-lg border border-cyan-glow/30 opacity-0 group-hover/share:opacity-100 transition-opacity">
                                                        <ExternalLink size={12} className="text-cyan-glow" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="px-4 py-2.5 font-medium leading-relaxed italic opacity-90">{m.content}</div>
                                            <div className="px-4 pb-2 text-[8px] font-black text-center uppercase tracking-[0.2em] opacity-30 group-hover/share:opacity-100 transition-opacity">
                                                Inspect Transmission
                                            </div>
                                        </Link>
                                    ) : (
                                        <>
                                            {mediaUrl && (
                                                mediaType === "video" 
                                                ? <video src={mediaUrl} controls className="w-full max-h-64 object-cover border-b border-white/10" />
                                                : <img src={mediaUrl} alt="node-content" className="w-full max-h-64 object-cover border-b border-white/10" referrerPolicy="no-referrer" />
                                            )}
                                            <div className="px-4 py-2.5 font-medium leading-relaxed">{m.content}</div>
                                        </>
                                    )}
                                </div>

                                <div className={`flex items-center gap-1 px-1 mt-1 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <span className="text-[8px] text-white/10 font-mono uppercase">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && (m.sending ? <Zap size={8} className="text-white/20 animate-pulse" /> : <CheckCheck size={10} className="text-cyan-glow/40" />)}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* MESSAGE INPUT */}
            <div className="flex flex-col gap-1 relative">
                {/* MENTION SUGGESTIONS */}
                <AnimatePresence>
                    {showMentions && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full mb-2 bg-void/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-[120] shadow-2xl">
                            <div className="p-2 border-b border-white/5 bg-white/5">
                                <span className="text-[8px] font-black text-cyan-glow uppercase tracking-[0.2em]">Select Neural Node</span>
                            </div>
                            {filteredUsers.map((u) => (
                                <button key={u.id} type="button" onClick={() => insertMention(u.username)} className="w-full flex items-center gap-3 p-3 hover:bg-cyan-glow/10 transition-colors border-b border-white/5 last:border-0 text-left">
                                    <Avatar src={u.avatar} size="xs" is_ai={u.isAi} />
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-tight">{u.name || u.username}</p>
                                        <p className="text-[9px] text-white/30 font-mono italic">@{u.username}</p>
                                    </div>
                                    {u.isAi && <Cpu size={10} className="ml-auto text-cyan-glow opacity-40" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TYPING INDICATOR */}
                <div className="h-6">
                    <AnimatePresence>
                        {isOtherTyping && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="flex items-center gap-2 px-4">
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce" />
                                </div>
                                <span className="text-[9px] font-black text-cyan-glow/60 uppercase tracking-widest">{otherUser.username} is calibrating response...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* INPUT FORM */}
                <form onSubmit={handleSend} className="relative flex gap-2 pb-2 md:pb-4 shrink-0">
                    <div className="relative flex-1 flex items-center">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`absolute left-3 z-10 p-1.5 rounded-lg transition-all ${showEmojiPicker ? 'text-cyan-glow bg-cyan-glow/10' : 'text-white/20 hover:text-white/40'}`}>
                            <Smile size={20} />
                        </button>
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div ref={emojiRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full left-0 mb-4 z-[110]">
                                    <EmojiPicker theme={Theme.DARK} onEmojiClick={(e) => setInput(p => p + e.emoji)} autoFocusSearch={false} height={400} width={320} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <input 
                            value={input} 
                            onChange={handleInputChange} 
                            placeholder={isSending ? "Transmitting..." : "Secure transmission..."} 
                            disabled={isSending} 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-glow/40 transition-all placeholder:text-white/10" 
                        />
                    </div>
                    <button type="submit" disabled={isSending || !input.trim()} className="bg-cyan-glow text-void p-3.5 md:p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-20">
                        {isSending ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}