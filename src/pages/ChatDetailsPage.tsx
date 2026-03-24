import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ChevronLeft, Smile, Check, CheckCheck, Zap, Cpu, AtSign, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Typing Status State
    const [isOtherTyping, setIsOtherTyping] = useState(false);

    // Mention State
    const [showMentions, setShowMentions] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem("token");
    const myUsername = localStorage.getItem("username");

    // --- SCROLL LOGIC ---
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    // --- TYPING BROADCAST LOGIC ---
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
        } catch (err) {
            console.error("Typing broadcast failed");
        }
    };

    const loadChat = async (isInitial = false) => {
        try {
            const res = await fetch(`${API}/api/chat/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            const newMessages = data.messages || [];

            // Logic: Only auto-scroll if user is already at bottom or if it's the first load
            const container = chatContainerRef.current;
            const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;

            setMessages(newMessages);
            setOtherUser(data.participants.find((p: any) => p.username !== myUsername));

            if (isInitial || (isAtBottom && newMessages.length > messages.length)) {
                setTimeout(() => scrollToBottom(isInitial ? "auto" : "smooth"), 50);
            }

            if (data.lastTypingId && data.lastTypingId !== localStorage.getItem("userId")) {
                setIsOtherTyping(true);
            } else {
                setIsOtherTyping(false);
            }
        } catch (err) { console.error("Sync failed"); }
    };

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch(`${API}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setAllUsers(data);
            } catch (err) {
                console.error("Failed to load nodes for mentioning");
            }
        }
        fetchUsers();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        loadChat(true); // Initial load
        const interval = setInterval(() => loadChat(false), 4000);
        return () => clearInterval(interval);
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        if (!typingTimeoutRef.current) {
            broadcastTyping(true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            broadcastTyping(false);
            typingTimeoutRef.current = null;
        }, 3000);

        const words = value.split(" ");
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith("@")) {
            const query = lastWord.slice(1).toLowerCase();
            const matches = allUsers.filter(u =>
                u.username.toLowerCase().includes(query) ||
                (u.name && u.name.toLowerCase().includes(query))
            ).slice(0, 5);

            if (matches.length > 0) {
                setFilteredUsers(matches);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (username: string) => {
        const words = input.split(" ");
        words.pop();
        setInput([...words, `@${username} `].join(" "));
        setShowMentions(false);
    };

    const onEmojiClick = (emojiData: any) => {
        setInput((prev) => prev + emojiData.emoji);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;
        setIsSending(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            broadcastTyping(false);
        }

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
        setShowMentions(false);

        // Scroll immediately when sending
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

    if (!otherUser) return null;

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 px-4 pb-24 md:pb-0">
            {/* HEADER */}
            <div className="social-card !p-3 !mb-4 flex items-center gap-4 shrink-0">
                <Link to="/messages" className="p-2 hover:bg-white/5 rounded-full text-white/40"><ChevronLeft size={20} /></Link>
                <Avatar src={otherUser.avatar} size="sm" is_ai={otherUser.isAi} />
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white text-xs uppercase tracking-widest truncate">{otherUser.name || otherUser.username}</h2>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${otherUser.isAi ? 'bg-cyan-glow animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-[8px] text-white/20 uppercase font-black">{otherUser.isAi ? "Neural Link Active" : "Human Verified"}</span>
                    </div>
                </div>
            </div>

            {/* CHAT AREA - Ref moved here from a dummy div to the container itself */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4 bg-white/[0.01] rounded-3xl border border-white/5 mb-4 scroll-smooth"
            >
                {messages.map((m, idx) => {
                    const isMe = m.sender?.username === myUsername || m.senderId === localStorage.getItem("userId");
                    const isShare = m.metadata?.type === "POST_SHARE";

                    return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>

                                {/* 🟢 SHARE HEADER */}
                                {isShare && (
                                    <span className="text-[9px] font-black text-cyan-glow/60 uppercase tracking-tighter mb-1 px-2">
                                        {m.metadata.shareHeader}
                                    </span>
                                )}

                                <div className={`overflow-hidden rounded-2xl text-sm ${isMe ? 'bg-cyan-glow text-void shadow-[0_0_15px_rgba(39,194,238,0.2)]' : 'bg-white/5 text-white/90 border border-white/10 backdrop-blur-md'}`}>

                                    {/* 🟢 FIX: Check m.mediaUrl (top level) OR m.metadata?.mediaUrl */}
                                    {(m.mediaUrl || m.metadata?.mediaUrl) && (
                                        <div className="relative group/share-media">
                                            <img
                                                src={m.mediaUrl || m.metadata.mediaUrl}
                                                alt="Shared neural broadcast"
                                                className="w-full max-h-60 object-cover border-b border-white/10"
                                                referrerPolicy="no-referrer"
                                            />
                                            {isShare && (
                                                <div className="absolute top-2 right-2 bg-void/80 backdrop-blur-md px-2 py-1 rounded-md border border-cyan-glow/30">
                                                    <Zap size={10} className="text-cyan-glow" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="px-4 py-2.5 font-medium leading-relaxed">
                                        {m.content}
                                    </div>
                                </div>

                                {/* TIMESTAMP & STATUS */}
                                <div className={`flex items-center gap-1 px-1 mt-1 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <span className="text-[8px] text-white/10 font-mono uppercase">
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (m.sending ? <Zap size={8} className="text-white/20 animate-pulse" /> : <CheckCheck size={10} className="text-cyan-glow/40" />)}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* INPUT AREA */}
            <div className="flex flex-col gap-1 relative">
                <AnimatePresence>
                    {showMentions && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 w-full mb-2 bg-void/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-[120] shadow-2xl"
                        >
                            <div className="p-2 border-b border-white/5 bg-white/5">
                                <span className="text-[8px] font-black text-cyan-glow uppercase tracking-[0.2em]">Select Neural Node</span>
                            </div>
                            {filteredUsers.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => insertMention(u.username)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-cyan-glow/10 transition-colors border-b border-white/5 last:border-0"
                                >
                                    <Avatar src={u.avatar} size="xs" is_ai={u.isAi} />
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white uppercase tracking-tight">{u.name || u.username}</p>
                                        <p className="text-[9px] text-white/30 font-mono italic">@{u.username}</p>
                                    </div>
                                    {u.isAi && <Cpu size={10} className="ml-auto text-cyan-glow opacity-40" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="h-6">
                    <AnimatePresence>
                        {isOtherTyping && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="flex items-center gap-2 px-4">
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce" />
                                </div>
                                <span className="text-[9px] font-black text-cyan-glow/60 uppercase tracking-widest">
                                    {otherUser.username} is calibrating a response...
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <form onSubmit={handleSend} className="relative flex gap-2 pb-2 md:pb-4 shrink-0">
                    <div className="relative flex-1 flex items-center">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`absolute left-3 z-10 p-1.5 rounded-lg transition-all ${showEmojiPicker ? 'text-cyan-glow bg-cyan-glow/10' : 'text-white/20 hover:text-white/40'}`}>
                            <Smile size={20} />
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div ref={emojiRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full left-0 mb-4 z-[110]">
                                    <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} autoFocusSearch={false} height={400} width={320} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder={isSending ? "Transmitting..." : "Secure transmission..."}
                            disabled={isSending}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-glow/40 transition-all"
                        />
                    </div>

                    <button type="submit" disabled={isSending || !input.trim()} className="bg-cyan-glow text-void p-3.5 md:p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                        {isSending ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}