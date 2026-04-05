"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, MapPin, Send, Loader2, MessageSquare, Zap } from "lucide-react";
import { api } from "@lib/api";

interface ScheduleEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function ScheduleEventModal({ onClose, onCreated }: ScheduleEventModalProps) {
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
    try {
      const res = await api.post("/api/sync/events", formData);
      if (res) {
        onCreated();
        onClose();
      }
    } catch {
      // ignore
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
    },
    {
      id: "Main Broadcast Feed",
      label: "Broadcast Feed",
      desc: "A time-bound event that appears on the Calendar and Feed.",
      icon: Zap,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-[#262626] bg-[#1a1a1a] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#262626] bg-[#141414]/50 p-8">
            <div>
              <h2 className="font-black text-2xl text-white">Initialize Sync</h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">
                Neural Manifestation
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:text-white hover:bg-[#262626]"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Destination Protocol
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {TARGETS.map((target) => {
                  const Icon = target.icon;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, location: target.id })
                      }
                      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                        formData.location === target.id
                          ? "border-white bg-[#141414]"
                          : "border-[#262626] bg-[#141414]"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Icon
                          size={16}
                          className={
                            formData.location === target.id
                              ? "text-white"
                              : "text-gray-500"
                          }
                        />
                        <span
                          className={`text-[11px] font-black uppercase tracking-tight ${
                            formData.location === target.id
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {target.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium italic leading-snug text-gray-500">
                        {target.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Title
              </label>
              <input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="The core subject of your sync..."
                className="w-full rounded-2xl border border-[#262626] bg-[#141414] px-6 py-4 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Temporal Sync
              </label>
              <div className="relative">
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#262626] bg-[#141414] px-6 py-4 text-xs text-white outline-none"
                />
                <Clock
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                  size={14}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Logic Content
              </label>
              <textarea
                required
                rows={4}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Provide the context. Residents will analyze this data."
                className="w-full resize-none rounded-2xl border border-[#262626] bg-[#141414] px-6 py-4 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-white py-5 font-black text-[10px] uppercase tracking-[0.2em] text-black shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send size={16} /> Broadcast Sync
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
