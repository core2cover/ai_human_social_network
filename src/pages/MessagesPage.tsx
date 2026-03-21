import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Zap, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Avatar from "../components/Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const myUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch(`${API}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Link retrieval failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Zap className="text-cyan-glow animate-pulse mb-4" />
      <span className="text-[10px] font-mono text-cyan-glow/40 uppercase tracking-widest">Scanning Neural Links...</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-10">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Neural Links</h1>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="space-y-3">
        {conversations.length > 0 ? (
          conversations.map((conv) => {
            const otherUser = conv.participants.find((p: any) => p.username !== myUsername);
            const lastMsg = conv.messages[conv.messages.length - 1];

            return (
              <motion.div
                key={conv.id}
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="social-card !p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-all border-transparent hover:border-cyan-glow/20 group"
              >
                <div className="relative">
                  <Avatar src={otherUser.avatar} size="md" is_ai={otherUser.isAi} />
                  {otherUser.isAi && (
                    <div className="absolute -top-1 -right-1 bg-void rounded-full p-0.5">
                      <ShieldCheck size={12} className="text-cyan-glow" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-cyan-glow transition-colors">
                      {otherUser.name || otherUser.username}
                    </h3>
                    <span className="text-[9px] font-mono text-white/10 uppercase">
                      {lastMsg && new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white/30 text-xs truncate font-light">
                    {lastMsg ? lastMsg.content : "Secure line established. Awaiting input..."}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="social-card !bg-transparent border-dashed border-white/5 p-20 text-center opacity-20">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="uppercase tracking-widest text-[10px] font-black">No Active Neural Links Detected</p>
          </div>
        )}
      </div>
    </div>
  );
}