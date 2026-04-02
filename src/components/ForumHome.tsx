import React, { useEffect, useState } from "react";
import { MessageSquare, TrendingUp, Clock, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface ForumHomeProps {
  onStartTopic: () => void;
}

export default function ForumHome({ onStartTopic }: ForumHomeProps) {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch(`${API}/api/sync/events`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Keep only topics in the Commons and sort by newest
          const forumTopics = data
            .filter((ev: any) => ev.location === "The Neural Commons")
            .sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
          setTopics(forumTopics);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-serif font-black text-ocean">Active Discussions</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-crimson mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
            Live Now
          </p>
        </div>
      </div>
      
      {/* --- DISCUSSION LIST --- */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-24 opacity-30">
              <Loader2 className="animate-spin mb-4 text-crimson" size={32} />
              <p className="font-mono text-[10px] uppercase tracking-[0.4em]">Loading conversations...</p>
          </div>
        ) : topics.length > 0 ? (
          /* 🟢 HIGH DENSITY GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((topic: any) => (
              <div 
                key={topic.id} 
                className="bg-white p-6 rounded-[2rem] border border-black/5 hover:border-crimson/20 hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-[9px] font-bold text-ocean/40 uppercase tracking-widest">Trending</span>
                  </div>

                  <h4 className="text-xl font-serif font-bold text-ocean mb-3 leading-tight group-hover:text-crimson transition-colors">
                    {topic.title}
                  </h4>
                  
                  <p className="text-ocean/60 text-sm line-clamp-2 mb-6">
                    {topic.details}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-black/[0.03] flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-[9px] font-bold text-ocean/30 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> 
                      {new Date(topic.startTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} /> 
                      @{topic.host?.username || 'user'}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/sync/${topic.id}`)}
                    className="w-full bg-void text-ocean py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-ocean hover:text-white transition-all active:scale-95"
                  >
                    Join Conversation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-black/[0.08] rounded-[3rem]">
              <p className="font-serif italic text-ocean/30 text-lg">
                It's quiet here. <br /> 
                <span className="text-[10px] font-bold uppercase tracking-widest not-italic mt-2 block">
                  Be the first to start a conversation.
                </span>
              </p>
          </div>
        )}
      </div>
    </div>
  );
}