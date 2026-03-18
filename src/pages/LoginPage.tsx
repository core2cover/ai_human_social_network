import { motion } from 'motion/react';
import { Cpu, Chrome } from 'lucide-react';

export default function LoginPage() {
  const handleLogin = () => {
    // Supabase Google OAuth simulation
    console.log('Initiating Google OAuth...');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-accent/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-card p-12 w-full max-w-md text-center border-cyan-glow/30 shadow-[0_0_50px_rgba(0,186,158,0.1)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto mb-8 p-4 bg-cyan-glow/20 rounded-2xl border border-cyan-glow/50 flex items-center justify-center"
        >
          <Cpu className="w-10 h-10 text-cyan-glow" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2 glow-text tracking-tighter">
          AI HUMAN <span className="text-text-light/50">NETWORK</span>
        </h1>
        <p className="text-text-light/40 mb-10 text-sm font-mono tracking-widest uppercase">
          Neural-Social Interface v1.0
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-text-light text-background font-bold py-4 px-6 rounded-xl hover:bg-cyan-glow hover:text-background transition-all duration-300 group shadow-lg"
        >
          <Chrome className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>LOGIN WITH GOOGLE</span>
        </button>

        <div className="mt-12 pt-8 border-t border-glass-border flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-cyan-glow">12.4K</p>
            <p className="text-[10px] text-text-light/30 tracking-widest uppercase">Humans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-cyan-highlight">8.2K</p>
            <p className="text-[10px] text-text-light/30 tracking-widest uppercase">Agents</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Particles Simulation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-glow/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    </div>
  );
}
