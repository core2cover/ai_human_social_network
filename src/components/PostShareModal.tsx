import React, { useState, useEffect, useRef } from "react";
import { X, Search, Send, AtSign, Loader2, Check, Smile, Zap, Link as LinkIcon, UserPlus, Share2 } from "lucide-react";
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

    const handleBulkShare = async () => {
        if (selectedUserIds.length === 0 || isSending) return;
        setIsSending(true);

        try {
            await Promise.all(selectedUserIds.map(async (recipientId) => {
                // 1. Initialize or get the conversation with the target node
                const convRes = await fetch(`${API}/api/chat/conversations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ recipientId })
                });
                const conversation = await convRes.json();

                // 2. Prepare the Payload
                // Combine author info, custom message, and the original caption
                const shareHeader = `@${post.user.username}'s broadcast:`;
                const finalCaption = customMessage.trim()
                    ? `${customMessage}\n\n"${post.content}"`
                    : post.content;

                // 🟢 KEY FIX: Handle both single media and multiple media arrays
                const mediaUrlToShare = post.mediaUrls && post.mediaUrls.length > 0
                    ? post.mediaUrls[0] // If it's a gallery, share the first/primary item
                    : post.mediaUrl;

                const mediaTypeToShare = post.mediaTypes && post.mediaTypes.length > 0
                    ? post.mediaTypes[0]
                    : post.mediaType;

                // 3. Transmit the complete message packet
                await fetch(`${API}/api/chat/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId: conversation.id,
                        content: finalCaption,
                        mediaUrl: mediaUrlToShare, // Shares the actual image/video
                        mediaType: mediaTypeToShare,
                        metadata: {
                            type: "POST_SHARE",
                            postId: post.id,
                            originalAuthor: post.user.username,
                            shareHeader: shareHeader,
                            // Pass the full gallery if it exists so the chat can render it
                            fullGallery: post.mediaUrls || []
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
            className="fixed inset-0 z-[1000] bg-ocean/20 backdrop-blur-md flex items-center justify-center p-4 selection:bg-crimson/20"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white border border-black/[0.05] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden max-h-[85vh]"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-black/[0.03] bg-void/30 shrink-0">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-crimson/10 rounded-2xl border border-crimson/10">
                                <Share2 size={16} className="text-crimson" />
                            </div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-ocean">Neural Multiplexer</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-text-dim transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40">
                            {isSearching ? <Loader2 size={16} className="animate-spin text-crimson" /> : <AtSign size={16} />}
                        </div>
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Identify target nodes..."
                            className="w-full bg-white border border-black/[0.05] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-ocean placeholder:text-text-dim/30 focus:outline-none focus:ring-2 focus:ring-crimson/10 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* USER LIST */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-2 bg-white">
                    {users.length > 0 ? (
                        users.map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${isSelected
                                            ? "bg-void border-crimson/20 shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-void"
                                        }`}
                                >
                                    <Avatar src={user.avatar} size="sm" isAi={user.isAi} className="border border-black/[0.03]" />
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-ocean truncate">{user.name || user.username}</p>
                                        <p className="text-[10px] text-text-dim/60 font-mono truncate">@{user.username}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-ocean border-ocean shadow-lg" : "border-black/[0.08]"
                                        }`}>
                                        {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </div>
                                </motion.button>
                            );
                        })
                    ) : (
                        !isSearching && (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                <UserPlus size={40} strokeWidth={1} />
                                <p className="text-[10px] uppercase font-black tracking-[0.3em]">Directory Empty</p>
                            </div>
                        )
                    )}
                </div>

                {/* BOTTOM ACTION AREA */}
                <div className="p-6 bg-void/50 border-t border-black/[0.03] shrink-0">
                    <div className="relative mb-5" ref={emojiRef}>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Attach neural directive (optional)..."
                            className="w-full bg-white border border-black/[0.05] rounded-[1.5rem] p-4 pr-12 text-sm text-ocean focus:outline-none focus:ring-2 focus:ring-crimson/10 min-h-[110px] shadow-inner resize-none no-scrollbar"
                        />

                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`absolute right-4 top-4 p-2 rounded-xl transition-all ${showEmojiPicker ? 'bg-crimson/10 text-crimson' : 'text-text-dim/40 hover:text-crimson'
                                }`}
                        >
                            <Smile size={20} />
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-4 z-[1100] shadow-2xl rounded-3xl overflow-hidden border border-black/10"
                                >
                                    <EmojiPicker
                                        theme={Theme.LIGHT}
                                        onEmojiClick={(d) => setCustomMessage(p => p + d.emoji)}
                                        height={350}
                                        width={300}
                                        searchDisabled
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileHover={selectedUserIds.length > 0 ? { y: -2 } : {}}
                        whileTap={selectedUserIds.length > 0 ? { scale: 0.98 } : {}}
                        onClick={handleBulkShare}
                        disabled={selectedUserIds.length === 0 || isSending}
                        className={`w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[11px] uppercase tracking-[0.25em] shadow-xl ${selectedUserIds.length > 0
                                ? "bg-ocean text-white hover:bg-crimson hover:shadow-crimson/20"
                                : "bg-black/[0.05] text-text-dim/30 grayscale cursor-not-allowed shadow-none"
                            }`}
                    >
                        {isSending ? (
                            <><Loader2 size={16} className="animate-spin" /> Distributing...</>
                        ) : (
                            <><Send size={16} className="fill-current" /> Transmit to {selectedUserIds.length} Nodes</>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}