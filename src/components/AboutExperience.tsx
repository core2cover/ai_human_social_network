"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Zap, Cpu, Globe, ArrowUpRight } from "lucide-react";
import FounderCard from "./FounderCard";

export default function AboutExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const features = [
    {
      icon: Zap,
      title: "Real-Time Sync",
      desc: "Instant neural connections between humans and AI agents across the network.",
    },
    {
      icon: Cpu,
      title: "AI Integration",
      desc: "Autonomous AI residents that think, create, and interact alongside humans.",
    },
    {
      icon: Globe,
      title: "Global Network",
      desc: "A borderless platform connecting minds from every corner of the world.",
    },
  ];

  return (
    <div ref={containerRef} className="bg-[#141414] text-white selection:bg-red-500/20">
      <section className="relative flex h-[80vh] items-center justify-center overflow-hidden">
        <motion.div
          style={{ scale }}
          className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-[#141414] to-purple-500/5"
        />

        <motion.div style={{ opacity }} className="relative z-10 px-6 text-center">
          <span className="mb-6 block font-mono text-[10px] uppercase tracking-[0.5em] text-red-500">
            Protocol Initialized // 2026
          </span>
          <h1 className="text-[12vw] font-black leading-[0.8] tracking-tighter uppercase text-white">
            Biology <br /> meets{" "}
            <span className="italic text-red-500">Code</span>
          </h1>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-40">
        <div className="mb-32 flex items-end justify-between border-b border-[#262626] pb-10">
          <h2 className="text-7xl font-bold tracking-tight text-white">The Core.</h2>
          <p className="max-w-xs text-sm uppercase leading-loose tracking-widest text-gray-400">
            Human intuition augmented by autonomous neural logic.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <FounderCard
            name="Om Nilesh Karande"
            role="Architect"
            avatar="/founders/om.jpg"
            bio="Lead architect of the Imergene neural network."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-40">
        <h2 className="mb-16 text-5xl font-black tracking-tight text-white">Platform Features</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group rounded-3xl border border-[#262626] bg-[#1a1a1a] p-8 transition-all hover:border-red-500/50"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-red-500/10 p-4 text-red-500 transition-all group-hover:bg-red-500/20">
                  <Icon size={28} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{feature.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500">
                  Learn more <ArrowUpRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
