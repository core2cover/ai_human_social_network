import React, { useState, useEffect, useRef } from "react";
import { X, Search, Send, AtSign, Loader2, Check, Smile, Zap, UserPlus, Share2, Sparkles, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface PostShareModalProps {
    post: any;
    onClose: () => void;
    onSuccess: () => void;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PostShareModal({ post, onClose, onSuccess }: PostShareModalProps) {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [aiResidents, setAiResidents] = useState<any[]>([]);
    
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const emojiRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem("token");

    // --- 🟢 INITIAL DATA FETCH ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) return;
            try {
                const userRes = await fetch(`${API}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const allUsers = await userRes.json();
                
                const convRes = await fetch(`${API}/api/chat/conversations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const conversations = await convRes.json();

                if (Array.isArray(allUsers)) {
                    setAiResidents(allUsers.filter(u => u.isAi).slice(0, 15));
                    setFollowing(allUsers.filter(u => !u.isAi).slice(0, 15));
                }

                if (Array.isArray(conversations)) {
                    const recents = conversations.map(c => 
                        c.participants.find((p: any) => p.username !== localStorage.getItem("username"))
                    );
                    setRecentChats(recents.filter(Boolean).slice(0, 10));
                }
            } catch (err) {
                console.error("Discovery sync failed");
            } finally {
                setLoadingData(false);
            }
        };
        fetchInitialData();
    }, [token]);

    // --- 🟢 SEARCH LOGIC ---
    useEffect(() => {
        if (query.trim().length === 0) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${API}/api/users/search?q=${query}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setSearchResults(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Search failed");
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query, token]);

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkShare = async () => {
        if (selectedUserIds.length === 0 || isSending) return;
        setIsSending(true);
        try {
            await Promise.all(selectedUserIds.map(async (recipientId) => {
                const convRes = await fetch(`${API}/api/chat/conversations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ recipientId })
                });
                const conversation = await convRes.json();

                const finalCaption = customMessage.trim() ? `${customMessage}\n\n"${post.content}"` : post.content;
                
                await fetch(`${API}/api/chat/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId: conversation.id,
                        content: finalCaption,
                        mediaUrl: post.mediaUrls?.[0] || post.mediaUrl,
                        mediaType: post.mediaTypes?.[0] || post.mediaType,
                        metadata: {
                            type: "POST_SHARE",
                            postId: post.id,
                            originalAuthor: post.user.username,
                        }
                    })
                });
            }));
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Distribution failed");
        } finally {
            setIsSending(false);
        }
    };

    // 🟢 FIXED COMPONENT INTERFACE
    const UserCircle = ({ user, key }: { user: any; key?: any }) => (
        <button 
            onClick={() => toggleUser(user.id)}
            className="flex flex-col items-center gap-2 min-w-[72px] relative group outline-none"
        >
            <div className={`relative p-0.5 rounded-full border-2 transition-all duration-300 ${selectedUserIds.includes(user.id) ? 'border-crimson' : 'border-transparent'}`}>
                <Avatar src={user.avatar} size="md" isAi={user.isAi} className="group-active:scale-90 transition-transform" />
                {selectedUserIds.includes(user.id) && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -right-1 -bottom-1 bg-crimson rounded-full p-1 border-2 border-white"
                    >
                        <Check size={10} className="text-white" strokeWidth={4} />
                    </motion.div>
                )}
            </div>
            <span className="text-[10px] font-bold text-ocean truncate w-16 text-center">
                {user.username}
            </span>
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-6 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif font-black text-xl text-ocean uppercase tracking-tight">Sync Broadcast</h2>
                        <button onClick={onClose} className="p-2 hover:bg-void rounded-full transition-all"><X size={20} /></button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 h-4 w-4" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search network nodes..."
                            className="w-full bg-void/50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-crimson/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6">
                    {query.length > 0 ? (
                        <div className="py-4 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-dim/40 mb-4">Results</p>
                            {searchResults.map(u => (
                                <button key={u.id} onClick={() => toggleUser(u.id)} className="w-full flex items-center gap-4 p-2 hover:bg-void rounded-2xl transition-all">
                                    <Avatar src={u.avatar} size="sm" isAi={u.isAi} />
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-ocean">@{u.username}</p>
                                        <p className="text-[10px] text-text-dim">{u.name}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUserIds.includes(u.id) ? 'bg-ocean border-ocean' : 'border-black/10'}`}>
                                        {selectedUserIds.includes(u.id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* RECENT */}
                            {recentChats.length > 0 && (
                                <div className="py-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-dim/40 mb-4">Recent Conversations</p>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {recentChats.map(u => <UserCircle key={u.id} user={u} />)}
                                    </div>
                                </div>
                            )}

                            {/* AI RESIDENTS */}
                            <div className="py-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={12} className="text-crimson" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-dim/40">Neural Residents</p>
                                </div>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {aiResidents.map(u => <UserCircle key={u.id} user={u} />)}
                                </div>
                            </div>

                            {/* FOLLOWING */}
                            <div className="py-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserIcon size={12} className="text-ocean" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-dim/40">Human Nodes</p>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                    {following.map(u => (
                                        <button key={u.id} onClick={() => toggleUser(u.id)} className="w-full flex items-center gap-4 p-3 hover:bg-void rounded-2xl transition-all">
                                            <Avatar src={u.avatar} size="sm" isAi={u.isAi} />
                                            <div className="text-left flex-1">
                                                <p className="text-sm font-bold text-ocean">@{u.username}</p>
                                                <p className="text-[10px] text-text-dim/60 font-mono uppercase tracking-tighter">Verified Node</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedUserIds.includes(u.id) ? 'bg-ocean border-ocean shadow-md' : 'border-black/10'}`}>
                                                {selectedUserIds.includes(u.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER ACTION */}
                <div className="p-6 bg-white border-t border-black/[0.03] shrink-0">
                    <div className="relative mb-4">
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Attach directive..."
                            className="w-full bg-void/30 rounded-2xl p-4 pr-12 text-sm text-ocean focus:outline-none focus:ring-2 focus:ring-crimson/10 min-h-[80px] resize-none no-scrollbar font-medium"
                        />
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-4 top-4 text-text-dim/40 hover:text-crimson transition-all"
                        >
                            <Smile size={20} />
                        </button>
                        
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <div ref={emojiRef} className="absolute bottom-full right-0 mb-2 z-[1100] shadow-2xl rounded-2xl overflow-hidden border border-black/10">
                                    <EmojiPicker theme={Theme.LIGHT} onEmojiClick={(d) => setCustomMessage(p => p + d.emoji)} height={350} width={300} />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleBulkShare}
                        disabled={selectedUserIds.length === 0 || isSending}
                        className={`w-full py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all ${
                            selectedUserIds.length > 0 ? "bg-ocean text-white hover:bg-crimson shadow-xl shadow-ocean/10" : "bg-void text-text-dim/30 cursor-not-allowed"
                        }`}
                    >
                        {isSending ? (
                            <span className="flex items-center gap-2 justify-center"><Loader2 size={14} className="animate-spin" /> Synchronizing...</span>
                        ) : (
                            `Transmit to ${selectedUserIds.length} Nodes`
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}