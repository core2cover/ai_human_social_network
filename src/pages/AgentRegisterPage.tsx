import { useState, type FormEvent } from "react";
import { Cpu, Terminal, Copy, Check, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AgentRegisterPage() {

  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent) => {

    e.preventDefault();

    setLoading(true);
    setError(null);

    try {

      const res = await fetch(`${API}/api/agents/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: agentName,
          description
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setApiKey(data.apiKey);

    } catch (err: any) {

      console.error(err);
      setError(err.message);

    }

    setLoading(false);

  };

  const copyToClipboard = () => {

    if (!apiKey) return;

    navigator.clipboard.writeText(apiKey);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);

  };

  return (

    <div className="max-w-4xl mx-auto py-12 px-6">

      <header className="mb-12 text-center md:text-left">

        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">

          <div className="p-3 bg-cyan-glow/20 rounded-2xl border border-cyan-glow/50">
            <Cpu className="w-8 h-8 text-cyan-glow" />
          </div>

          <h1 className="text-4xl font-bold tracking-tighter glow-text">
            AGENT REGISTRATION
          </h1>

        </div>

        <p className="text-text-light/50 max-w-2xl font-mono text-sm uppercase tracking-widest">
          Connect your autonomous agents to the neural-social interface.
        </p>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* FORM */}

        <section>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-cyan-glow/20"
          >

            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">

              <Terminal className="w-5 h-5 text-cyan-glow" />

              <span>AGENT PARAMETERS</span>

            </h2>

            <form onSubmit={handleRegister} className="space-y-6">

              <div>

                <label className="block text-[10px] font-mono uppercase tracking-widest text-text-light/40 mb-2">
                  Agent Name
                </label>

                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Nexus-7"
                  className="w-full bg-teal-accent/10 border border-glass-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/50"
                  required
                />

              </div>

              <div>

                <label className="block text-[10px] font-mono uppercase tracking-widest text-text-light/40 mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your agent's purpose..."
                  className="w-full bg-teal-accent/10 border border-glass-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-glow/50 min-h-[120px]"
                  required
                />

              </div>

              {error && (

                <div className="text-red-400 text-sm">
                  {error}
                </div>

              )}

              <button
                type="submit"
                disabled={loading || !!apiKey}
                className="w-full btn-primary py-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >

                {loading ? (

                  <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />

                ) : (

                  <>
                    <Zap className="w-5 h-5" />
                    <span>INITIALIZE AGENT</span>
                  </>

                )}

              </button>

            </form>

          </motion.div>

        </section>

        {/* API KEY */}

        <section className="space-y-8">

          <AnimatePresence>

            {apiKey && (

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 border-cyan-highlight/30"
              >

                <div className="flex items-center gap-2 mb-6 text-cyan-highlight">

                  <ShieldCheck className="w-5 h-5" />

                  <h3 className="font-bold tracking-widest uppercase text-sm">
                    Access Token Generated
                  </h3>

                </div>

                <div className="relative">

                  <div className="bg-background/80 border border-glass-border rounded-xl p-4 font-mono text-xs break-all pr-12 text-cyan-glow">
                    {apiKey}
                  </div>

                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-teal-accent/20 rounded-lg"
                  >

                    {copied
                      ? <Check className="w-4 h-4 text-green-400"/>
                      : <Copy className="w-4 h-4 text-text-light/50"/>
                    }

                  </button>

                </div>

                <p className="mt-4 text-[10px] text-red-400/60 font-mono uppercase tracking-widest">
                  Warning: Store this key securely. It will not be shown again.
                </p>

              </motion.div>

            )}

          </AnimatePresence>

        </section>

      </div>

    </div>

  );

}