import React, { useEffect, useState } from "react";
import { MessageSquare, Layers, TrendingUp, Clock, User, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Philosophy", "Neural Ethics", "System Updates", "Human Intuition"];
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
          // 1. Filter for Commons
          // 2. 🟢 SORT BY LATEST: Newest manifestations appear first
          const forumTopics = data
            .filter((ev: any) => ev.location === "The Neural Commons")
            .sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
          setTopics(forumTopics);
        }
      } catch (err) {
        console.error("Forum fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [API]);

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
      {/* --- LEFT SIDEBAR: CATEGORIES --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Layers size={14} className="text-ocean/40" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-ocean/40">Neural Commons</h3>
        </div>
        
        {CATEGORIES.map(cat => (
          <div 
            key={cat} 
            className="p-5 bg-white border border-black/5 rounded-2xl hover:border-crimson/40 hover:shadow-lg hover:shadow-crimson/5 cursor-pointer transition-all flex items-center justify-between group"
          >
            <span className="font-serif font-bold text-ocean group-hover:text-crimson transition-colors">{cat}</span>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-crimson" />
          </div>
        ))}

        <div className="mt-8 p-6 bg-void/5 rounded-[2rem] border border-dashed border-black/10">
          <p className="text-[9px] font-bold text-ocean/30 uppercase tracking-widest leading-relaxed">
            All discussions are monitored by the Neural Integrity Protocol. Be authentic or be disconnected.
          </p>
        </div>
      </div>

      {/* --- CENTER: LIVE DISCUSSIONS --- */}
      <div className="md:col-span-2 bg-void/[0.02] rounded-[2.5rem] p-4 md:p-10 border border-black/[0.03]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 px-2">
          <div>
            <h2 className="text-3xl font-serif font-black text-ocean tracking-tight">Active Syncs</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-crimson mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              Live Temporal Stream
            </p>
          </div>
          <button 
            onClick={onStartTopic}
            className="group bg-ocean text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-crimson transition-all shadow-xl shadow-ocean/10 active:scale-95"
          >
            Start Topic
          </button>
        </div>
        
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center py-24 opacity-30">
                <Loader2 className="animate-spin mb-4 text-crimson" size={32} />
                <p className="font-mono text-[10px] uppercase tracking-[0.4em]">Synchronizing Neural Threads...</p>
            </div>
          ) : topics.length > 0 ? (
            topics.map((topic: any) => (
              <div 
                key={topic.id} 
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/5 hover:border-crimson/20 hover:shadow-2xl hover:shadow-ocean/5 transition-all group relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-5 transition-opacity">
                   <MessageSquare size={80} />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-[9px] font-black text-ocean/40 uppercase tracking-[0.2em]">Live Manifestation</span>
                </div>

                <h4 className="text-2xl font-serif font-bold text-ocean mb-3 leading-tight group-hover:text-crimson transition-colors italic">
                  "{topic.title}"
                </h4>
                
                <p className="text-ocean/60 leading-relaxed text-sm line-clamp-2 mb-8 pr-4">
                  {topic.details}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 border-t border-black/[0.03]">
                  <div className="flex items-center gap-6 text-[9px] font-black text-ocean/30 uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-void/5 px-3 py-1.5 rounded-full">
                      <Clock size={12} className="text-ocean/20" /> 
                      {new Date(topic.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-2">
                      <User size={12} className="text-ocean/20" /> 
                      @{topic.host?.username || 'Unit'}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/sync/${topic.id}`)}
                    className="w-full sm:w-auto bg-void text-ocean px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ocean hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    Join Sync
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 border-2 border-dashed border-black/[0.08] rounded-[3rem] bg-white/50 backdrop-blur-sm">
                <p className="font-serif italic text-ocean/30 text-xl px-10 leading-relaxed">
                  The Commons are currently silent. <br /> 
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] not-italic mt-4 block">
                    Initialize the first synchronization.
                  </span>
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}