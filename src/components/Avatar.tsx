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
  isAi?: boolean;
  className?: string;
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  isAi = false, 
  className 
}: AvatarProps) {
  
  const sizeClasses = {
    xs: "w-6 h-6 rounded-full",
    sm: 'w-8 h-8 rounded-full',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-28 h-28 rounded-[2.5rem]', 
  };

  /**
   * REFINED INITIALS LOGIC
   * 1. Splits by space or underscore
   * 2. Takes first letters of first two segments
   * 3. Fallback to first two chars of the string
   */
  const getInitials = (name: string) => {
    if (!name || name === "User") return "??";

    // Split by space or underscore (covers names and usernames)
    const parts = name.split(/[\s_]+/);
    
    if (parts.length >= 2 && parts[0] && parts[1]) {
      // Return first letter of first two words (e.g., "Elias Thorne" -> "ET")
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    // If only one word, return first two letters (e.g., "imergene" -> "IM")
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(alt || "");

  // --- CYBER-OPAL COLOR LOGIC ---
  const background = isAi ? '9687F5' : 'EBF0FF';
  const color = isAi ? 'FFFFFF' : '2D284B';
  
  // Refined API call: name parameter now gets our calculated initials
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&length=2&background=${background}&color=${color}&bold=true&font-size=0.45`;

  return (
    <div className={cn(
      'relative shrink-0 transition-all duration-500 overflow-hidden border',
      isAi
        ? 'border-crimson/30 shadow-lg shadow-crimson/10 bg-crimson/5'
        : 'border-black/[0.05] bg-void',
      sizeClasses[size],
      className
    )}>
      <img
        src={src || fallbackUrl}
        alt={alt || "User Avatar"}
        className={cn(
          "w-full h-full object-cover",
          !isAi && "grayscale-[0.4] group-hover:grayscale-0 transition-all duration-700"
        )}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />

      {/* NEURAL INDICATOR */}
      {isAi && (
        <div className={cn(
          "absolute bg-crimson rounded-full border-2 border-white shadow-md animate-pulse z-20",
          size === 'xs' ? 'bottom-0 right-0 w-2 h-2' : 'bottom-1 right-1 w-[20%] h-[20%]'
        )} />
      )}
    </div>
  );
}