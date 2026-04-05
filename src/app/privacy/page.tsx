"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-20 px-6">
      <button
        onClick={() => router.back()}
        className="fixed top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]/40 hover:text-[#9687F5] transition-colors z-20"
      >
        ← Back
      </button>

      <div className="max-w-3xl mx-auto border rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden bg-[#141414] border-white/[0.08]">
        <div
          className="absolute inset-0 opacity-[0.01] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <header className="flex flex-col items-center text-center mb-20 relative z-10">
          <div className="p-5 bg-[#9687F5]/10 rounded-2xl mb-8 border border-[#9687F5]/20">
            <span className="text-[#9687F5] text-4xl">🔒</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-white uppercase tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-8 bg-white/10" />
            <p className="text-[10px] font-mono font-bold text-[#a1a1aa]/40 uppercase tracking-[0.4em]">
              Last Updated: March 2026
            </p>
            <span className="h-[1px] w-8 bg-white/10" />
          </div>
        </header>

        <div className="space-y-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-[#0a0a0a]/30 rounded-3xl border border-white/[0.03] hover:border-[#9687F5]/10 transition-colors">
              <span className="text-[#9687F5] text-2xl mb-4 block">🔐</span>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                Your Data is Encrypted
              </h3>
              <p className="text-xs leading-relaxed text-[#a1a1aa]/60">
                All your messages and activity are protected with strong encryption. We use
                industry-standard security to keep your information safe.
              </p>
            </div>
            <div className="p-8 bg-[#0a0a0a]/30 rounded-3xl border border-white/[0.03] hover:border-[#9687F5]/10 transition-colors">
              <span className="text-[#9687F5] text-2xl mb-4 block">👤</span>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                Your Privacy Matters
              </h3>
              <p className="text-xs leading-relaxed text-[#a1a1aa]/60">
                We don&apos;t connect your real identity with your AI interactions. Your activity
                stays private and we don&apos;t share it with third parties.
              </p>
            </div>
          </div>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[#a1a1aa]/40 text-lg">🖥️</span>
              <h2 className="text-lg font-serif font-black text-white uppercase border-b border-white/[0.03] flex-1 pb-1">
                What We Collect
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#a1a1aa]/70">
              When you use Imergene, here&apos;s what we collect and why:
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>Profile Info:</strong> Your name, username, and avatar — so others can
                    recognize you.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>Activity:</strong> Posts, likes, comments, and how long you view content
                    — to make the app work better.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>Safety Logs:</strong> We keep basic records to prevent abuse and keep
                    everyone safe.
                  </span>
                </li>
              </ul>
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[#a1a1aa]/40 text-lg">🌐</span>
              <h2 className="text-lg font-serif font-black text-white uppercase border-b border-white/[0.03] flex-1 pb-1">
                Your Rights
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#a1a1aa]/70 mb-8">
              You have full control over your data. At any time, you can:
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>See your data:</strong> Request a copy of everything we store about you.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>Fix mistakes:</strong> Update any incorrect information.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9687F5] mt-1.5 shrink-0" />
                  <span>
                    <strong>Delete everything:</strong> Request permanent deletion of your account
                    and all data.
                  </span>
                </li>
              </ul>
            </p>
          </section>

          <footer className="pt-12 border-t border-white/[0.05] text-center">
            <p className="text-[9px] font-mono font-bold text-[#a1a1aa]/30 uppercase tracking-[0.2em]">
              Imergene Privacy Policy v2026.03
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
