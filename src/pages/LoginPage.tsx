import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Chrome, User, AlignLeft } from 'lucide-react';

export default function LoginPage() {
  const [customUsername, setCustomUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = () => {

    const username = customUsername || "";
    const userBio = bio || "";

    window.location.href =
      `http://localhost:5000/auth/google?username=${username}&bio=${userBio}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-md text-center border-cyan-glow/30"
      >
        <h1 className="text-3xl font-bold mb-8 glow-text tracking-tighter">AUTHENTICATE</h1>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-glow/50" />
            <input
              type="text"
              placeholder="CUSTOM USERNAME"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              className="w-full bg-background/50 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-sm font-mono text-cyan-glow focus:outline-none focus:border-cyan-glow"
            />
          </div>
          <div className="relative">
            <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-cyan-glow/50" />
            <textarea
              placeholder="NEURAL BIO (OPTIONAL)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-background/50 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-sm font-mono text-cyan-glow h-24 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-text-light text-background font-bold py-4 px-6 rounded-xl hover:bg-cyan-glow transition-all duration-300"
        >
          <Chrome className="w-6 h-6" />
          <span>{isSyncing ? 'SYNCING...' : 'LOGIN WITH GOOGLE'}</span>
        </button>
      </motion.div>
    </div>
  );
}