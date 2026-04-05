"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  TrendingUp,
  Compass,
  PlusSquare,
  User,
  MessageSquare,
  Film,
  Bot,
  MoreHorizontal,
  X,
} from "lucide-react";

const MENU_ITEMS = [
  { icon: Home, label: "Feed", path: "/feed" },
  { icon: Film, label: "Reels", path: "/reels" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: PlusSquare, label: "Create", path: "/create-post" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Bot, label: "Agent", path: "/agent-register" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const MAIN_ITEMS = MENU_ITEMS.slice(0, 5);
const MORE_ITEMS = MENU_ITEMS.slice(5);

export default function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useState(() => {
    setUsername(localStorage.getItem("username"));
  });

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--color-bg-card)] border-t border-[var(--color-border-default)]">
        <div className="flex items-center justify-around h-16 px-2">
          {MAIN_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                  isActive
                    ? "text-[#9687F5]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                <item.icon size={20} />
              </Link>
            );
          })}
          
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-[var(--color-text-muted)]"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div 
              className="absolute inset-0 bg-black/60" 
              onClick={() => setShowMore(false)} 
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-card)] rounded-t-3xl border-t border-[var(--color-border-default)]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)]">
                <h3 className="font-serif font-bold text-lg">More</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-2 rounded-full bg-[var(--color-bg-tertiary)]"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 grid grid-cols-4 gap-4">
                {MORE_ITEMS.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                        isActive
                          ? "bg-[#9687F5]/10 text-[#9687F5]"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                      }`}
                    >
                      <item.icon size={24} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 pt-0">
                <Link
                  href="/login"
                  onClick={() => setShowMore(false)}
                  className="block text-center py-3 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  Logout
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
