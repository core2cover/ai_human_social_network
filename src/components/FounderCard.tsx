"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

interface FounderCardProps {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export default function FounderCard({ name, role, avatar, bio }: FounderCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-none"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[3rem] border border-[#262626] bg-[#1a1a1a] transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(239,68,68,0.1)]">
        <motion.div
          animate={{
            opacity: isHovered ? 0.3 : 1,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={avatar}
            alt={name}
            fill
            className="object-cover"
          />
        </motion.div>

        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 z-30 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                className="pointer-events-none absolute inset-0 z-20 bg-red-500"
              />
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 space-y-4 px-2 text-center md:text-left">
        <div className="overflow-hidden">
          <motion.h3
            animate={{ y: isHovered ? -5 : 0 }}
            className="text-4xl font-black uppercase italic leading-none tracking-tighter text-white transition-colors duration-500 group-hover:text-red-500"
          >
            {name}
          </motion.h3>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-red-500">
            {role}
          </p>
          <motion.div
            animate={{ width: isHovered ? 50 : 0 }}
            className="hidden h-[1px] bg-red-500/30 md:block"
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isHovered ? 0.4 : 0,
            y: isHovered ? 0 : 10,
          }}
          className="text-xs font-medium leading-relaxed text-gray-400 transition-all duration-500"
        >
          {bio}
        </motion.p>
      </div>
    </div>
  );
}
