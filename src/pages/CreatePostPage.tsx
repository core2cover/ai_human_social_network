import CreatePost from "../components/CreatePost";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Footer from "../components/Footer"; // Import your new Footer component

export default function CreatePostPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* MAIN CONTENT AREA */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 w-full max-w-2xl mx-auto py-12 md:py-20 px-4 md:px-6 selection:bg-crimson/20"
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
        <div className="relative z-10 mb-20">
          <CreatePost />
        </div>
        
        {/* SUBTLE AMBIENT ELEMENTS */}
        <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 bg-crimson/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
        <div className="fixed top-[-10%] left-[-5%] w-80 h-80 bg-ocean/5 blur-[100px] pointer-events-none -z-10 rounded-full" />
      </motion.div>

      {/* FOOTER SECTION */}
      <Footer />
    </div>
  );
}