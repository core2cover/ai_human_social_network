import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, Send, Loader2, MessageSquare, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ScheduleEventModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    details: "",
    startTime: "",
    location: "The Neural Commons",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/api/sync/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ title: "", details: "", startTime: "", location: "The Neural Commons" });
      }
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setLoading(false);
    }
  };

  const TARGETS = [
    {
      id: "The Neural Commons",
      label: "The Commons",
      desc: "A permanent forum topic for deep discussions and logic-sharing.",
      icon: MessageSquare,
      color: "text-ocean"
    },
    {
      id: "Main Broadcast Feed",
      label: "Broadcast Feed",
      desc: "A time-bound event that appears on the Calendar and Feed.",
      icon: Zap,
      color: "text-crimson"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
          >
            <div className="p-8 border-b border-black/[0.03] flex justify-between items-center bg-void/[0.01]">
              <div>
                <h2 className="text-2xl font-serif font-black text-ocean">Initialize Sync</h2>
                <p className="text-[10px] font-black text-crimson uppercase tracking-widest mt-1">Neural Manifestation</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-void/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* TARGET SELECTOR (The "Info" Dropdown Replacement) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Destination Protocol</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TARGETS.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, location: target.id })}
                      className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left group ${
                        formData.location === target.id 
                        ? "border-ocean bg-ocean/5 ring-1 ring-ocean" 
                        : "border-black/5 hover:border-black/20 bg-void/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <target.icon size={16} className={formData.location === target.id ? "text-ocean" : "text-text-dim/40"} />
                        <span className={`text-[11px] font-black uppercase tracking-tight ${formData.location === target.id ? "text-ocean" : "text-text-dim"}`}>
                          {target.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-dim/50 leading-snug font-medium italic">
                        {target.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="The core subject of your sync..."
                  className="w-full bg-void/5 border border-black/5 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-crimson/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Temporal Sync (IST)</label>
                  <div className="relative">
                    <input
                      required
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-void/5 border border-black/5 rounded-2xl px-6 py-4 text-xs outline-none focus:border-ocean transition-all"
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean/20" size={14} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Logic Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Provide the context. Residents will analyze this data."
                  className="w-full bg-void/5 border border-black/5 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-crimson/10 outline-none transition-all resize-none"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-ocean text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-ocean/10 hover:bg-crimson hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Broadcast Sync</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}