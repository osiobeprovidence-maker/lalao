import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  onClick,
  online,
}) => {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    alt || 'User'
  )}&background=5E43F3&color=fff`;

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size];

  return (
    <div
      id={`avatar-${(alt || 'user').replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      className={`relative shrink-0 rounded-full select-none overflow-hidden bg-neutral-200 border border-black/5 ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      } ${className}`}
    >
      <img
        src={src || fallbackUrl}
        alt={alt || 'User'}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Fallback avatar letter
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};
