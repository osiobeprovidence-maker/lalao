import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string;
  avatarUrl?: string;
  photoURL?: string;
  profileImage?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  avatarUrl,
  photoURL,
  profileImage,
  alt,
  size = 'md',
  className = '',
  onClick,
  online,
}) => {
  const rawSrc = src || avatarUrl || photoURL || profileImage;
  const imageSrc = typeof rawSrc === 'string' ? rawSrc.trim() : '';
  const [hasError, setHasError] = useState(false);

  // Reset error state when the image source changes
  useEffect(() => {
    setHasError(false);
  }, [imageSrc]);

  const initials = (alt || 'User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size];

  // Online dot size scales with avatar
  const dotClass = {
    xs: 'w-2 h-2 border',
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  }[size];

  const showImage = Boolean(imageSrc && !hasError);

  return (
    // Outer wrapper: sizing + positioning anchor. NO overflow-hidden here
    // so the online dot is never clipped.
    <div
      id={`avatar-${(alt || 'user').replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      className={`relative shrink-0 select-none ${sizeClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Inner image circle — overflow-hidden lives here, keeps photo cropped */}
      <div
        className={`w-full h-full rounded-full overflow-hidden bg-neutral-200 border border-black/5 ${
          onClick ? 'hover:opacity-90 active:scale-95 transition-all' : ''
        }`}
      >
        {showImage ? (
          <img
            src={imageSrc}
            alt={alt || 'User'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => {
              setHasError(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-600 font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Online presence dot — positioned outside overflow-hidden, never clipped */}
      {online && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-white ${dotClass}`}
          aria-label="Online"
        />
      )}
    </div>
  );
};
