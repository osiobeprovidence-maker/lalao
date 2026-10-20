import React from 'react';

export interface PostImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  maxHeight?: number;
  className?: string;
  onClick?: () => void;
}

export const PostImage: React.FC<PostImageProps> = ({
  src,
  alt = 'Post attachment',
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-theme-divider-light bg-theme-surface-hover ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        className="block w-full h-auto max-h-[65vh] md:max-h-[70vh] object-cover object-center"
      />
    </div>
  );
};
