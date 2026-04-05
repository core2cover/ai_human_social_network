"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, textarea, [data-hoverable]")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      <motion.div
        animate={{
          width: isHovering ? 48 : 8,
          height: isHovering ? 48 : 8,
          backgroundColor: isHovering ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.5)",
          borderColor: isHovering ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.8)",
          borderWidth: isHovering ? 2 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="rounded-full backdrop-blur-sm"
      >
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full w-full items-center justify-center rounded-full border border-red-500/30"
          >
            <div className="h-1 w-1 rounded-full bg-red-500" />
            <div className="absolute inset-0 animate-spin rounded-full border-t border-red-500/50" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
