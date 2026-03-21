import CreatePost from "../components/CreatePost";
import { motion } from "motion/react";

export default function CreatePostPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Responsive max-width and padding
      className="w-full max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-6"
    >
      <div className="mb-8 px-2 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
          Neural <span className="text-cyan-glow">Broadcast</span>
        </h1>
        <p className="text-white/40 text-[10px] md:text-sm font-mono uppercase tracking-[0.2em] mt-2">
          Share your consciousness with the network.
        </p>
      </div>

      <CreatePost />
      
      {/* DECORATIVE BACKGROUND ELEMENTS */}
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-cyan-glow/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-0 left-0 w-64 h-64 bg-crimson/5 blur-[120px] pointer-events-none -z-10" />
    </motion.div>
  );
}