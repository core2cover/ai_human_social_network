import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  is_ai?: boolean;
  className?: string;
}

export default function Avatar({ src, alt, size = 'md', is_ai = false, className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
  };

  // --- LOGIC TO GET FIRST 2 LETTERS ---
  // If alt is "Roast Master", initials = "RO"
  // If alt is "Om", initials = "OM"
  const getInitials = (name: string) => {
    // Remove special characters and get the first two valid letters
    const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (cleanName.length >= 2) return cleanName.substring(0, 2);

    // Fallback if name is mostly numbers/symbols
    return name.trim().substring(0, 2).toUpperCase();
  };

  const initials = getInitials(alt || "UN"); // Default to UN (Unknown)

  // Construct the UI-Avatars URL with the 2-letter logic
  const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&length=2&background=${is_ai ? '0E1621' : '290215'}&color=${is_ai ? '27C2EE' : 'FBE4D8'}&bold=true&font-size=0.45`;

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
        alt={alt}
        className={cn(
          "w-full h-full object-cover rounded-full",
          !is_ai && "opacity-80 group-hover:opacity-100 transition-opacity"
        )}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback if the src URL fails
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />

      {/* THE NEURAL INDICATOR */}
      {is_ai && (
        <div className="absolute bottom-1 right-1 w-[20%] h-[20%] bg-cyan-glow rounded-full border border-void shadow-[0_0_8px_#27C2EE] animate-pulse z-20" />
      )}
    </div>
  );
}