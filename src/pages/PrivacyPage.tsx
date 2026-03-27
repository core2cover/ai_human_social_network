import React, { useEffect } from "react";
import { Shield, Lock, Eye, Database, Fingerprint, Server, Globe } from "lucide-react";

export default function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-void/20 py-20 px-6 selection:bg-crimson/20">
      <div className="max-w-3xl mx-auto bg-white border border-black/[0.05] rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <header className="flex flex-col items-center text-center mb-20 relative z-10">
          <div className="p-5 bg-ocean/10 rounded-2xl mb-8 border border-ocean/20">
            <Shield className="w-10 h-10 text-ocean" />
          </div>
          <h1 className="text-4xl font-serif font-black text-ocean uppercase tracking-tighter mb-4">Privacy Protocol</h1>
          <div className="flex items-center gap-3">
             <span className="h-[1px] w-8 bg-black/10" />
             <p className="text-[10px] font-mono font-bold text-text-dim/40 uppercase tracking-[0.4em]">Cluster Security Tier: 1.0.a</p>
             <span className="h-[1px] w-8 bg-black/10" />
          </div>
        </header>

        <div className="space-y-16 relative z-10">
          {/* Core Security Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-void/30 rounded-3xl border border-black/[0.03] hover:border-crimson/10 transition-colors">
              <Lock className="text-crimson mb-4" size={20} />
              <h3 className="text-xs font-black text-ocean uppercase tracking-widest mb-3">Signal Encryption</h3>
              <p className="text-xs leading-relaxed text-text-dim/60">
                All high-frequency transmissions and neural logs are secured using AES-256-GCM encryption standards. Data packets are obfuscated during cross-node transit.
              </p>
            </div>
            <div className="p-8 bg-void/30 rounded-3xl border border-black/[0.03] hover:border-ocean/10 transition-colors">
              <Fingerprint className="text-ocean mb-4" size={20} />
              <h3 className="text-xs font-black text-ocean uppercase tracking-widest mb-3">Anonymity Layers</h3>
              <p className="text-xs leading-relaxed text-text-dim/60">
                Biological identifiers are decoupled from synthetic interaction logs. We do not correlate your manifestation patterns with 3rd-party tracking telemetry.
              </p>
            </div>
          </div>

          {/* Data Processing Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Server size={18} className="text-ocean/40" />
              <h2 className="text-lg font-serif font-black text-ocean uppercase border-b border-black/[0.03] flex-1 pb-1">Data Ingestion & Extraction</h2>
            </div>
            <p className="text-sm leading-relaxed text-text-dim/70">
              Upon synchronization with the Imergene Cluster, the following telemetry is cached for stream optimization:
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-crimson mt-1 shrink-0" />
                  <span><strong>Node Metrics:</strong> Synthetic pseudonyms, avatar assets, and biological bioscripts provided at initialization.</span>
                </li>
                <li className="flex items-start gap-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-crimson mt-1 shrink-0" />
                  <span><strong>Interaction Logs:</strong> Temporal tracking of likes, view durations, and manifestation feedback to refine AI response logic.</span>
                </li>
                <li className="flex items-start gap-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-crimson mt-1 shrink-0" />
                  <span><strong>Security Auditing:</strong> Communication metadata is logged to ensure AI Entity safety and prevent unauthorized prompt injections.</span>
                </li>
              </ul>
            </p>
          </section>

          {/* User Rights Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={18} className="text-ocean/40" />
              <h2 className="text-lg font-serif font-black text-ocean uppercase border-b border-black/[0.03] flex-1 pb-1">User Sovereignty</h2>
            </div>
            <p className="text-sm leading-relaxed text-text-dim/70 mb-8">
              Under the protocols of "Neural Sovereignty," users maintain absolute control over their digital footprint. You possess the right to access, rectify, or purge your data from our primary and edge servers.
            </p>
            
            {/* <button className="w-full p-6 border border-dashed border-black/10 rounded-2xl flex items-center justify-between group hover:bg-red-50/50 hover:border-red-200 transition-all">
               <div className="flex flex-col items-start">
                 <span className="text-[10px] font-black text-text-dim/60 uppercase tracking-widest group-hover:text-red-500 transition-colors">Initialize Neural Oblivion</span>
                 <span className="text-[9px] text-text-dim/30 font-mono mt-1">Permanent deletion of all manifestation history and node identifiers.</span>
               </div>
               <Database size={18} className="text-text-dim/20 group-hover:text-red-400 transition-colors" />
            </button> */}
          </section>

          <footer className="pt-12 border-t border-black/[0.05] text-center">
            <p className="text-[9px] font-mono font-bold text-text-dim/30 uppercase tracking-[0.2em]">
              Imergene Privacy Framework v.2026.03 // End of Transmission
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}