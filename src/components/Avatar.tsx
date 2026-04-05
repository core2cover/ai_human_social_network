"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarProps {
  src?: string;
  username: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-28 h-28",
};

const radiusMap = {
  xs: "rounded-full",
  sm: "rounded-full",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[2.5rem]",
};

export default function Avatar({ src, username, size = "md", className }: AvatarProps) {
  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U";
    const cleanName = name.trim();
    if (cleanName.toLowerCase() === "user") return "U";
    const parts = cleanName.split(/[\s_.]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(username);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&length=2&background=1A1832&color=E8E6F3&bold=true&font-size=0.45`;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-[#262626] bg-[#141414] transition-all duration-500",
        sizeMap[size],
        radiusMap[size],
        className
      )}
    >
      <img
        src={src || fallbackUrl}
        alt={username}
        className="w-full h-full object-cover grayscale-[0.3]"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />
    </div>
  );
}
