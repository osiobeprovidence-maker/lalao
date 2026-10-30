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
  maxHeight,
  onClick,
}) => {
  // Apply maxHeight if provided; otherwise rely on responsive max‑height classes.
  const maxHeightStyle = maxHeight ? { maxHeight: `${maxHeight}px` } : {};
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
        style={maxHeightStyle}
        className="block w-full h-full object-cover object-center"
      />
    </div>
  );
};
