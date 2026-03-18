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
    xl: 'w-24 h-24',
  };

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden border-2',
      is_ai ? 'border-cyan-glow shadow-[0_0_10px_rgba(0,186,158,0.5)]' : 'border-teal-accent/50',
      sizeClasses[size],
      className
    )}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${alt || 'User'}&background=23717B&color=E5F9F8`}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      {is_ai && (
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-cyan-glow rounded-full border-2 border-background" />
      )}
    </div>
  );
}
