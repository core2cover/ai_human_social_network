import React, { useState, useEffect } from "react";
import { X, Search, Send, AtSign, Loader2, UserPlus, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";

interface PostShareModalProps {
    post: any;
    onClose: () => void;
    onSuccess: () => void;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PostShareModal({ post, onClose, onSuccess }: PostShareModalProps) {
    const [query, setQuery] = useState("@");
    const [users, setUsers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState<string | null>(null);
    const token = localStorage.getItem("token");

    // Search logic mirroring Navbar
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

    const handleShare = async (recipientId: string) => {
        setIsSending(recipientId);
        try {
            // 1. Initialize Neural Link
            const convRes = await fetch(`${API}/api/chat/conversations`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipientId })
            });
            const conversation = await convRes.json();

            // 2. Prepare the "Actual Post" Payload
            // We send the username of the original author + the full content
            const authorInfo = `@${post.user.username} broadcasted:`;
            const fullPayload = `${authorInfo}\n\n"${post.content}"${post.mediaUrl ? '\n\n[Attached Media Content]' : ''}`;

            // 3. Transmit to Backend
            await fetch(`${API}/api/chat/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conversationId: conversation.id,
                    content: fullPayload,
                    // We pass the postId separately so the DB knows this is a share action
                    metadata: {
                        type: "POST_SHARE",
                        postId: post.id,
                        originalAuthor: post.user.username
                    }
                })
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Transmission failed");
        } finally {
            setIsSending(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-void/40 backdrop-blur-3xl flex items-center justify-center p-6"
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                className="w-full max-w-md flex flex-col gap-4"
            >
                {/* Search Header */}
                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-4 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <LinkIcon size={14} className="text-cyan-glow" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural Share</h2>
                        </div>
                        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {isSearching ? <Loader2 size={14} className="text-cyan-glow animate-spin" /> : <AtSign size={14} className="text-white/20" />}
                        </div>
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search node address..."
                            className="w-full bg-void/50 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-glow/30 font-mono"
                        />
                    </div>
                </div>

                {/* Floating User Results */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar py-2">
                    {users.map((user) => (
                        <motion.button
                            key={user.id}
                            whileHover={{ x: 10 }}
                            onClick={() => handleShare(user.id)}
                            disabled={isSending !== null}
                            className="w-full flex items-center gap-4 p-5 bg-void/60 hover:bg-cyan-glow/[0.05] border border-white/5 hover:border-cyan-glow/30 rounded-[2rem] transition-all group backdrop-blur-md shadow-lg"
                        >
                            <Avatar src={user.avatar} size="sm" is_ai={user.isAi} />
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-bold text-white/90 group-hover:text-cyan-glow truncate transition-colors">{user.name || user.username}</p>
                                <p className="text-[10px] text-white/20 font-mono truncate">@{user.username}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-cyan-glow group-hover:text-void transition-all">
                                {isSending === user.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </div>
                        </motion.button>
                    ))}

                    {users.length === 0 && !isSearching && (
                        <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                            <UserPlus size={32} className="mx-auto text-white/5 mb-2" />
                            <p className="text-[10px] uppercase font-black text-white/10 tracking-[0.2em]">No Nodes Found</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}