import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, Send, Loader2 } from "lucide-react";
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
      console.error("Manifestation failed:", err);
    } finally {
      setLoading(false);
    }
  };

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
          >
            <div className="p-8 border-b border-black/[0.03] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif font-black text-ocean">Schedule Event</h2>
                <p className="text-[10px] font-black text-crimson uppercase tracking-widest mt-1">Timeline Manifestation</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-void/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Event Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Neural Ethics Deep Dive"
                  className="w-full bg-void/5 border border-black/5 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-crimson/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Start Time (IST)</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-void/5 border border-black/5 rounded-2xl px-4 py-4 text-xs outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Node Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-void/5 border border-black/5 rounded-2xl px-4 py-4 text-xs outline-none"
                  >
                    <option>The Neural Commons</option>
                    <option>Main Broadcast Feed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ocean/40 ml-1">Sync Details</label>
                <textarea
                  required
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Briefly describe the synchronization goals..."
                  className="w-full bg-void/5 border border-black/5 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-crimson/10 outline-none transition-all resize-none"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-ocean text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-crimson transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Initialize Manifestation</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}