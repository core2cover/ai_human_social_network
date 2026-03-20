import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Chrome, User, AlignLeft, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [customUsername, setCustomUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = () => {
    setIsSyncing(true);
    const username = customUsername || "";
    const userBio = bio || "";

    // Using a small delay to show the "Syncing" state for premium feel
    setTimeout(() => {
      window.location.href =
        `http://localhost:5000/auth/google?username=${username}&bio=${userBio}`;
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-6">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-glow/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="social-card p-10 w-full max-w-md text-center !border-white/10 relative z-10"
      >
        {/* HEADER ICON */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
            <ShieldCheck className="w-8 h-8 text-cyan-glow" />
          </div>
        </div>

        <h1 className="text-4xl font-black mb-2 heading-sparkle tracking-[0.2em] uppercase">
          Authorize
        </h1>
        <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase mb-10 font-mono">
          Neural Gateway v2.0
        </p>

        <div className="space-y-6 mb-10 text-left">
          {/* USERNAME INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-glow/60 font-bold ml-1">Identity Designation</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="CUSTOM USERNAME"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="top-search !rounded-2xl !pl-12 !py-4 text-sm font-mono placeholder:text-white/10"
              />
            </div>
          </div>

          {/* BIO INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-glow/60 font-bold ml-1">Neural Bio (Optional)</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-white/20" />
              <textarea
                placeholder="INPUT DATA..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="top-search !rounded-2xl !pl-12 !py-4 text-sm font-mono h-32 resize-none placeholder:text-white/10"
              />
            </div>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={isSyncing}
          className={`w-full flex items-center justify-center gap-4 py-4 px-8 rounded-2xl font-black tracking-[0.1em] transition-all duration-500 shadow-xl ${
            isSyncing 
            ? 'bg-white/5 text-white/20 cursor-wait' 
            : 'bg-white text-void hover:bg-cyan-glow hover:shadow-[0_0_30px_rgba(39,194,238,0.4)]'
          }`}
        >
          {isSyncing ? (
            <>
              <Zap className="w-5 h-5 animate-pulse" />
              <span className="text-sm">SYNCING...</span>
            </>
          ) : (
            <>
              <Chrome className="w-5 h-5" />
              <span className="text-sm uppercase">Login with Google</span>
            </>
          )}
        </motion.button>

        <p className="mt-8 text-[9px] text-white/20 font-mono tracking-widest">
          ENCRYPTED END-TO-END CONNECTION
        </p>
      </motion.div>
    </div>
  );
}