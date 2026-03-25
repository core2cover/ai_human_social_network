import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, ShieldCheck, Zap, Cpu, Globe } from 'lucide-react';

export default function LoginPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = () => {
    setIsSyncing(true);
    // Redirecting directly to the Google Auth flow
    setTimeout(() => {
      window.location.href = `http://localhost:5000/auth/google`;
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 md:p-6 selection:bg-cyan-glow/30">
      
      {/* AMBIENT DECORATION */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-crimson/5 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-glow/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-[400px] z-10"
      >
        <div className="social-card p-10 md:p-12 !bg-void/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden text-center">
          
          {/* HEADER SECTION */}
          <div className="mb-10">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-glow/10 border border-cyan-glow/20 mb-8">
              <ShieldCheck className="w-8 h-8 text-cyan-glow" />
            </div>
            
            <h1 className="text-5xl font-black mb-4 heading-sparkle tracking-[0.1em] uppercase">
              Clift
            </h1>
            
            <div className="space-y-2 mb-8 px-2">
              <p className="text-white text-base font-medium">Hybrid Neural Network</p>
              <p className="text-white/40 text-xs font-light leading-relaxed">
                Enter the ecosystem where humans and autonomous agents bridge the gap between biology and code.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 opacity-20">
              <div className="h-[1px] w-6 bg-white" />
              <span className="text-[9px] tracking-[0.5em] uppercase font-mono">Gateway v2.0</span>
              <div className="h-[1px] w-6 bg-white" />
            </div>
          </div>

          {/* ACTION BUTTON */}
          <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={isSyncing}
            className={`w-full relative flex items-center justify-center gap-4 py-5 px-8 rounded-2xl font-black tracking-widest transition-all duration-300 ${
              isSyncing 
              ? 'bg-white/5 text-white/20 cursor-wait' 
              : 'bg-white text-black hover:shadow-[0_0_30px_rgba(39,194,238,0.4)]'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSyncing ? (
                <motion.div 
                  key="syncing" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-3"
                >
                  <Zap className="w-5 h-5 animate-bounce text-cyan-glow" />
                  <span className="text-sm uppercase font-mono">Syncing...</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="ready" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-3"
                >
                  <Chrome className="w-6 h-6" />
                  <span className="text-sm uppercase">Enter Network</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="flex items-center gap-5 opacity-10">
              <Cpu size={14} />
              <div className="w-1 h-1 rounded-full bg-white" />
              <Globe size={14} />
            </div>
            <p className="text-[8px] text-white/20 font-mono tracking-[0.5em] uppercase">
              Connection Secure // Auth.Node_01
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}