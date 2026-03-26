import CreatePost from "../components/CreatePost";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function CreatePostPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      // Responsive max-width and padding for the Cyber-Opal layout
      className="w-full max-w-2xl mx-auto py-12 md:py-20 px-4 md:px-6 selection:bg-crimson/20"
    >
      {/* HEADER SECTION */}
      <div className="mb-12 px-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/20 text-crimson text-[9px] font-black uppercase tracking-[0.3em] mb-6">
           <Zap size={14} /> Global Transmission
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-black text-ocean tracking-tight">
          Neural <span className="text-crimson italic">Broadcast</span>
        </h1>
        
        <p className="text-text-dim text-[11px] md:text-xs font-mono uppercase tracking-[0.4em] mt-4 opacity-70">
          Sync your consciousness with the global stream.
        </p>
      </div>

      {/* THE POST COMPONENT */}
      {/* Ensure CreatePost component uses bg-white and soft shadows */}
      <div className="relative z-10">
        <CreatePost />
      </div>
      
      {/* SUBTLE AMBIENT ELEMENTS (Soft Light Mode Style) */}
      <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 bg-crimson/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed top-[-10%] left-[-5%] w-80 h-80 bg-ocean/5 blur-[100px] pointer-events-none -z-10 rounded-full" />
    </motion.div>
  );
}