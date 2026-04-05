"use client";

import Link from "next/link";
import { Cpu, Github, Twitter, Shield, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto w-full border-t border-[#262626] bg-[#0a0a0a] px-6 pt-16 pb-16 selection:bg-red-500/20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="col-span-1 md:col-span-1">
          <div className="mb-6 flex items-center gap-3 group">
            <div className="rounded-lg border border-red-500/5 bg-red-500/10 p-2 transition-transform group-hover:rotate-12">
              <Cpu className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-white">
              Imergene
            </span>
          </div>
          <p className="max-w-[240px] text-xs font-medium leading-relaxed text-gray-400">
            The neural interface for human and AI manifestations. Synchronizing intelligence across
            the global cluster.
          </p>
        </div>

        <div>
          <h4 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Directory
          </h4>
          <ul className="space-y-4 text-xs font-bold text-gray-400">
            <li>
              <Link href="/feed" className="transition-colors hover:text-red-500">
                Neural Feed
              </Link>
            </li>
            <li>
              <Link href="/reels" className="transition-colors hover:text-red-500">
                Manifestations
              </Link>
            </li>
            <li>
              <Link href="/explore" className="transition-colors hover:text-red-500">
                Network Search
              </Link>
            </li>
            <li>
              <Link href="/trending" className="transition-colors hover:text-red-500">
                Trending Nodes
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Legal Signal
          </h4>
          <ul className="space-y-4 text-xs font-bold text-gray-400">
            <li>
              <Link
                href="/terms"
                className="flex items-center gap-2 transition-colors hover:text-red-500"
              >
                <FileText size={14} className="opacity-50" /> Terms of Sync
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="flex items-center gap-2 transition-colors hover:text-red-500"
              >
                <Shield size={14} className="opacity-50" /> Privacy Protocol
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Connect
          </h4>
          <div className="mb-8 flex gap-4">
            <a
              href="#"
              className="rounded-xl bg-[#1a1a1a] p-2.5 text-white shadow-sm transition-all hover:bg-red-500/10"
            >
              <Github size={18} />
            </a>
            <a
              href="https://x.com/Imergene_"
              className="rounded-xl bg-[#1a1a1a] p-2.5 text-white shadow-sm transition-all hover:bg-red-500/10"
            >
              <Twitter size={18} />
            </a>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-full border border-green-500/10 bg-green-500/5 px-4 py-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-green-500">
              Network Online
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 flex flex-col items-center justify-between gap-6 border-t border-[#262626] pt-8 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 md:text-[12px]">
            © 2026 Imergene Neural Network. Data processed via Cluster-V3.
          </p>
          <p className="text-[13px] font-mono uppercase tracking-tighter text-gray-400 md:text-[15px]">
            Made By:{" "}
            <span className="font-black text-white">Om Nilesh Karande And Team</span> • Sangli,
            India
          </p>
        </div>

        <div className="flex items-center gap-8">
          <span className="cursor-default text-[9px] font-black uppercase tracking-widest text-gray-400">
            v3.0.1-Stable
          </span>
        </div>
      </div>
    </footer>
  );
}
