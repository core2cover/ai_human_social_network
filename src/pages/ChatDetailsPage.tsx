import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ChevronLeft, Smile, Check, CheckCheck, Zap, Cpu } from "lucide-react";
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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");
  const myUsername = localStorage.getItem("username");

  const loadChat = async () => {
    try {
      const res = await fetch(`${API}/api/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
      setOtherUser(data.participants.find((p: any) => p.username !== myUsername));
    } catch (err) {
      console.error("Sync failed");
    }
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 4000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
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
      sending: true // Temporary state
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    const currentInput = input;
    setInput("");
    setShowEmojiPicker(false);

    try {
      const res = await fetch(`${API}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: id, content: currentInput })
      });

      if (res.ok) {
        // Replace optimistic message with real server message
        const confirmedMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === optimisticId ? confirmedMsg : m));
      }
    } catch (err) {
      console.error("Transmission failed");
    } finally {
      setIsSending(false);
    }
  };

  if (!otherUser) return null;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 px-4 pb-24 md:pb-0">
      
      {/* HEADER */}
      <div className="social-card !p-3 !mb-4 flex items-center gap-4 shrink-0">
        <Link to="/messages" className="p-2 hover:bg-white/5 rounded-full text-white/40"><ChevronLeft size={20}/></Link>
        <Avatar src={otherUser.avatar} size="sm" is_ai={otherUser.isAi} />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-xs uppercase tracking-widest truncate">{otherUser.name || otherUser.username}</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${otherUser.isAi ? 'bg-cyan-glow animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[8px] text-white/20 uppercase font-black">{otherUser.isAi ? "Neural Link Active" : "Human Verified"}</span>
          </div>
        </div>
        {otherUser.isAi && (
          <div className="px-3 py-1 bg-cyan-glow/10 border border-cyan-glow/20 rounded-full flex items-center gap-2">
            <Cpu size={10} className="text-cyan-glow animate-spin-slow" />
            <span className="text-[8px] text-cyan-glow font-bold uppercase tracking-widest">AI Agent</span>
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4 bg-white/[0.01] rounded-3xl border border-white/5 mb-4">
        {messages.map((m, idx) => {
          const isMe = m.sender?.username === myUsername || m.senderId === localStorage.getItem("userId");
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={m.id || idx} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col items-end gap-1 max-w-[85%] md:max-w-[75%]">
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-cyan-glow text-void font-bold shadow-[0_0_15px_rgba(39,194,238,0.2)]' 
                    : 'bg-white/5 text-white/90 border border-white/10 backdrop-blur-md'
                }`}>
                  {m.content}
                </div>
                
                {/* RECEIPT LOGIC */}
                {isMe && (
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[8px] text-white/10 font-mono uppercase">
                       {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.sending ? (
                      <Zap size={8} className="text-white/20 animate-pulse" />
                    ) : (
                      <CheckCheck size={10} className="text-cyan-glow/40" />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* INPUT AREA */}
      <div className="flex flex-col gap-2">
        {/* STATUS BAR */}
        <AnimatePresence>
          {messages.length > 0 && !isMeLast(messages, myUsername) && otherUser.isAi && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 mb-1"
            >
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-cyan-glow rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[9px] font-black text-cyan-glow/40 uppercase tracking-widest">Agent Processing...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="relative flex gap-2 pb-2 md:pb-4 shrink-0">
          <div className="relative flex-1 flex items-center">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute left-3 p-1.5 rounded-lg transition-colors ${showEmojiPicker ? 'text-cyan-glow bg-cyan-glow/10' : 'text-white/20 hover:text-white/40'}`}
            >
              <Smile size={20} />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isSending ? "Transmitting..." : "Secure transmission..."}
              disabled={isSending}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-glow/40 transition-all disabled:opacity-50"
            />

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-4 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                >
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={onEmojiClick}
                    skinTonesDisabled
                    searchDisabled={false}
                    height={350}
                    width={280}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit" 
            disabled={isSending || !input.trim()}
            className="bg-cyan-glow text-void p-3.5 md:p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-20"
          >
            {isSending ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper to check if last message was from me
function isMeLast(messages: any[], myUsername: string | null) {
  if (messages.length === 0) return true;
  const last = messages[messages.length - 1];
  return last.sender?.username === myUsername || last.senderId === localStorage.getItem("userId");
}