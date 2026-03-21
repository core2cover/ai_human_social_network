import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Zap, ShieldCheck, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "../components/Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const myUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  async function loadConversations() {
    try {
      const res = await fetch(`${API}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      const sortedData = data.sort((a: any, b: any) => {
        const timeA = new Date(a.messages[a.messages.length - 1]?.createdAt || a.updatedAt).getTime();
        const timeB = new Date(b.messages[b.messages.length - 1]?.createdAt || b.updatedAt).getTime();
        return timeB - timeA;
      });

      setConversations(sortedData);
    } catch (err) {
      console.error("Link retrieval failed", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleOpenConversation = async (convId: string) => {
    try {
      await fetch(`${API}/api/chat/conversations/${convId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          const updatedMessages = [...c.messages];
          if (updatedMessages.length > 0) {
            updatedMessages[updatedMessages.length - 1].read = true;
          }
          return { ...c, messages: updatedMessages };
        }
        return c;
      }));

      navigate(`/messages/${convId}`);
    } catch (err) {
      navigate(`/messages/${convId}`); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Zap className="text-cyan-glow animate-spin mb-4" />
      <span className="text-[10px] font-mono text-cyan-glow/40 uppercase tracking-[0.3em]">Syncing Neural Stream...</span>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-6 pb-32 box-border overflow-x-hidden">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic shrink-0">Neural Links</h1>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const otherUser = conv.participants.find((p: any) => p.username !== myUsername);
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isUnread = lastMsg && lastMsg.sender?.username !== myUsername && !lastMsg.read;

              return (
                <motion.div
                  key={conv.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleOpenConversation(conv.id)}
                  className={`social-card w-full box-border !p-3 md:!p-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4 cursor-pointer transition-all border-l-2 relative overflow-hidden ${
                    isUnread 
                      ? 'bg-cyan-glow/[0.04] border-cyan-glow shadow-[inset_15px_0_30px_-15px_rgba(39,194,238,0.2)]' 
                      : 'border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  {/* LEFT: AVATAR */}
                  <div className="relative flex-none">
                    <Avatar src={otherUser.avatar} size="md" is_ai={otherUser.isAi} />
                    {otherUser.isAi && (
                      <div className="absolute -top-1 -right-1 bg-void rounded-full p-0.5 z-30">
                        <ShieldCheck size={10} className="text-cyan-glow" />
                      </div>
                    )}
                    {isUnread && (
                      <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-cyan-glow rounded-full border-2 border-void z-30 animate-pulse" />
                    )}
                  </div>
                  
                  {/* CENTER: TEXT (STRICT TRUNCATION) */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className={`font-bold text-xs md:text-sm uppercase tracking-wider truncate ${
                        isUnread ? 'text-cyan-glow' : 'text-white/80'
                      }`}>
                        {otherUser.name || otherUser.username}
                      </h3>
                      <span className={`text-[8px] font-mono shrink-0 ${isUnread ? 'text-cyan-glow/60' : 'text-white/20'}`}>
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-[10px] md:text-xs truncate leading-tight ${
                      isUnread ? 'text-white font-medium' : 'text-white/30 font-light'
                    }`}>
                      {lastMsg ? lastMsg.content : "Secure line established..."}
                    </p>
                  </div>

                  {/* RIGHT: INDICATOR */}
                  <div className="flex items-center justify-center w-6 shrink-0">
                    {isUnread ? (
                      <div className="flex flex-col items-center">
                        <Zap size={12} className="text-cyan-glow animate-pulse" />
                        <span className="text-[5px] font-black text-cyan-glow uppercase mt-1">Link</span>
                      </div>
                    ) : (
                      <ChevronRight size={14} className="text-white/10" />
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="social-card !bg-transparent border-dashed border-white/5 p-16 text-center opacity-20"
            >
              <MessageCircle className="w-10 h-10 mx-auto mb-4" />
              <p className="uppercase tracking-widest text-[9px] font-black">No Active Neural Links Detected</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}