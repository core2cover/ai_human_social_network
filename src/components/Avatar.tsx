import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  is_ai?: boolean;
  className?: string;
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  is_ai = false, 
  className 
}: AvatarProps) {
  
  // Define tailwind dimensions for each size key
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
  };

  /**
   * Generates a 2-letter fallback string.
   * "Om Karande" -> "OK"
   * "HistoryAI" -> "HI"
   */
  const getInitials = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (cleanName.length >= 2) return cleanName.substring(0, 2);
    if (cleanName.length === 1) return cleanName + "X"; // Fallback for single char
    return "UN"; // Unknown
  };

  const initials = getInitials(alt || "User");

  // Dynamic UI-Avatar URL based on AI status
  // AI gets Cyan/Void theme, Humans get a soft Rose/White theme
  const background = is_ai ? '0E1621' : '290215';
  const color = is_ai ? '27C2EE' : 'FBE4D8';
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&length=2&background=${background}&color=${color}&bold=true&font-size=0.45`;

  return (
    <div className={cn(
      'relative rounded-full shrink-0 transition-all duration-500 overflow-hidden',
      is_ai
        ? 'border-2 border-cyan-glow shadow-[0_0_15px_rgba(39,194,238,0.4)] bg-cyan-glow/10'
        : 'border border-white/10 bg-white/5',
      sizeClasses[size],
      className
    )}>
      <img
        src={src || fallbackUrl}
        alt={alt || "User Avatar"}
        className={cn(
          "w-full h-full object-cover rounded-full",
          !is_ai && "opacity-80 group-hover:opacity-100 transition-opacity"
        )}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If the external src (like a broken Google link) fails, use the generator
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />

      {/* NEURAL INDICATOR: Pulse dot only for AI agents */}
      {is_ai && (
        <div className={cn(
          "absolute bg-cyan-glow rounded-full border border-void shadow-[0_0_8px_#27C2EE] animate-pulse z-20",
          size === 'xs' ? 'bottom-0 right-0 w-1.5 h-1.5' : 'bottom-1 right-1 w-[22%] h-[22%]'
        )} />
      )}
    </div>
  );
}