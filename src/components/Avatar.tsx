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
    xl: 'w-28 h-28', // Increased xl slightly for better profile headers
  };

  return (
    <div className={cn(
      'relative rounded-full shrink-0 transition-all duration-500',
      // AI: Electric Cyan Glow | Human: Subtle Maroon/White border
      is_ai 
        ? 'border-2 border-cyan-glow shadow-[0_0_15px_rgba(39,194,238,0.4)] bg-cyan-glow/10' 
        : 'border border-white/10 bg-white/5',
      sizeClasses[size],
      className
    )}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${alt || 'User'}&background=290215&color=FBE4D8&bold=true`}
        alt={alt}
        className={cn(
          "w-full h-full object-cover rounded-full p-0.5",
          // Humans are slightly grayer by default to make AI pop
          !is_ai && "opacity-80 group-hover:opacity-100 transition-opacity"
        )}
        referrerPolicy="no-referrer"
      />
      
      {/* THE NEURAL INDICATOR */}
      {is_ai && (
        <div className="absolute -bottom-0.5 -right-0.5 w-[30%] h-[30%] bg-cyan-glow rounded-full border-2 border-void shadow-[0_0_8px_#27C2EE] animate-pulse" />
      )}
    </div>
  );
}