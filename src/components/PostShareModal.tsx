import React, { useState, useEffect, useRef } from "react";
import { X, Search, Send, AtSign, Loader2, Check, Smile, Zap, Link as LinkIcon, UserPlus } from "lucide-react";
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
    const [query, setQuery] = useState("@");
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const emojiRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem("token");

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            const searchTerm = query.startsWith("@") ? query.slice(1) : query;
            if (searchTerm.trim().length >= 0) {
                setIsSearching(true);
                try {
                    const res = await fetch(`${API}/api/users/search?q=${searchTerm}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setUsers(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error("Search failed");
                } finally {
                    setIsSearching(false);
                }
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query, token]);

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const onEmojiClick = (emojiData: any) => {
        setCustomMessage((prev) => prev + emojiData.emoji);
    };

    const handleBulkShare = async () => {
        if (selectedUserIds.length === 0 || isSending) return;
        setIsSending(true);

        try {
            await Promise.all(selectedUserIds.map(async (recipientId) => {
                // 1. Establish Conversation
                const convRes = await fetch(`${API}/api/chat/conversations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ recipientId })
                });
                const conversation = await convRes.json();

                // 2. Transmit Message
                const authorInfo = `@${post.user.username} shared a broadcast:`;
                
                // If there's a custom message, we prepend it to the shared content
                const finalContent = customMessage.trim() 
                    ? `${customMessage}\n\n${post.content}` 
                    : post.content;

                await fetch(`${API}/api/chat/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId: conversation.id,
                        content: finalContent,
                        mediaUrl: post.mediaUrl,
                        mediaType: post.mediaType,
                        metadata: {
                            type: "POST_SHARE",
                            postId: post.id,
                            originalAuthor: post.user.username,
                            shareHeader: authorInfo
                        }
                    })
                });
            }));

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Bulk transmission failed", err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-void/60 backdrop-blur-3xl flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-white/5 backdrop-blur-md shrink-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-glow/10 rounded-lg border border-cyan-glow/20">
                                <LinkIcon size={14} className="text-cyan-glow" />
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural Multiplexer</h2>
                        </div>
                        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                            {isSearching ? <Loader2 size={14} className="animate-spin text-cyan-glow" /> : <AtSign size={14} />}
                        </div>
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search nodes..."
                            className="w-full bg-void/50 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-glow/30 font-mono"
                        />
                    </div>
                </div>

                {/* USER SELECTION LIST */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                    {users.length > 0 ? (
                        users.map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-[1.5rem] transition-all border ${
                                        isSelected 
                                        ? "bg-cyan-glow/10 border-cyan-glow/40 shadow-[0_0_15px_rgba(39,194,238,0.05)]" 
                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    }`}
                                >
                                    <Avatar src={user.avatar} size="sm" is_ai={user.isAi} />
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
                                        <p className="text-[9px] text-white/20 font-mono truncate">@{user.username}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                        isSelected ? "bg-cyan-glow border-cyan-glow" : "border-white/10"
                                    }`}>
                                        {isSelected && <Check size={12} className="text-void" strokeWidth={4} />}
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        !isSearching && (
                            <div className="py-12 text-center opacity-20">
                                <UserPlus size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] uppercase font-black tracking-widest">No nodes found</p>
                            </div>
                        )
                    )}
                </div>

                {/* BOTTOM INPUT & ACTION */}
                <div className="p-6 bg-white/[0.02] border-t border-white/5 backdrop-blur-md shrink-0">
                    <div className="relative mb-4">
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full bg-void/50 border border-white/5 rounded-2xl p-4 pr-12 text-xs text-white focus:outline-none focus:border-cyan-glow/30 min-h-[100px] resize-none no-scrollbar"
                        />
                        
                        <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
                                showEmojiPicker ? 'text-cyan-glow bg-cyan-glow/10' : 'text-white/20 hover:text-white/40'
                            }`}
                        >
                            <Smile size={18} />
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div 
                                    ref={emojiRef}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-2 z-[1100]"
                                >
                                    <EmojiPicker 
                                        theme={Theme.DARK} 
                                        onEmojiClick={onEmojiClick} 
                                        autoFocusSearch={false} 
                                        height={350} 
                                        width={300} 
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleBulkShare}
                        disabled={selectedUserIds.length === 0 || isSending}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[11px] uppercase tracking-[0.2em] ${
                            selectedUserIds.length > 0 
                            ? "bg-cyan-glow text-void shadow-[0_0_25px_rgba(39,194,238,0.3)] hover:scale-[1.02]" 
                            : "bg-white/5 text-white/20 grayscale cursor-not-allowed"
                        }`}
                    >
                        {isSending ? (
                            <><Loader2 size={16} className="animate-spin" /> Transmitting...</>
                        ) : (
                            <><Send size={16} /> Send to {selectedUserIds.length} Nodes</>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}