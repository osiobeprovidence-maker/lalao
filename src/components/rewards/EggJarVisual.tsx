import React from 'react';

export interface EggJarVisualProps {
  progressPercent: number; // 0 - 100
  timePercent?: number;    // 0 - 100
  points: number;
  nairaValue: number;
  eggState: 'empty' | 'filling' | 'almost_full' | 'reward_ready' | 'reward_redeemed';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const EggJarVisual: React.FC<EggJarVisualProps> = ({
  progressPercent,
  timePercent = 0,
  points,
  nairaValue,
  eggState,
  size = 'md',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  // Determine height/widths based on size
  const dimensions = {
    xs: { width: 14, height: 18, stroke: 2 },
    sm: { width: 24, height: 31, stroke: 2 },
    md: { width: 110, height: 140, stroke: 3 },
    lg: { width: 160, height: 200, stroke: 4 },
  }[size];

  // Colors: LaLao Primary Blue/Purple (#5E43F3 and vibrant cyan/blue gradients)
  const isReady = eggState === 'reward_ready';
  const isAlmostFull = eggState === 'almost_full';

  // SVG clip path coordinates for an attractive egg shape:
  // Center: (50, 60), rx: 36, ry: 48 (narrower at top, rounder at bottom)
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer Glow */}
      <div
        className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
          size === 'xs'
            ? isReady
              ? 'w-5 h-5 blur-sm bg-[#5E43F3]/25 animate-pulse'
              : 'w-4 h-4 blur-sm bg-[#5E43F3]/10'
            : size === 'sm'
            ? isReady
              ? 'w-8 h-8 blur-md bg-[#5E43F3]/25 animate-pulse'
              : 'w-7 h-7 blur-md bg-[#5E43F3]/10'
            : isReady
              ? 'w-32 h-32 blur-xl bg-[#5E43F3]/40 animate-pulse'
              : isAlmostFull
                ? 'w-28 h-28 blur-xl bg-[#5E43F3]/25'
                : 'w-24 h-24 blur-xl bg-[#5E43F3]/10'
        }`}
      />

      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-md"
      >
        <defs>
          {/* Solid LaLao blue shell */}
          <linearGradient id="eggShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="52%" stopColor="#5E43F3" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Progress fill stays within the LaLao blue palette */}
          <linearGradient id="eggLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="35%" stopColor="#818CF8" />
            <stop offset="70%" stopColor="#5E43F3" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Shimmer Reflection */}
          <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Clip path defining the Egg Silhouette */}
          <clipPath id="eggClip">
            {/* Egg path: d defines standard organic egg form */}
            <path d="M 50,8 C 22,8 10,48 10,84 C 10,110 27,126 50,126 C 73,126 90,110 90,84 C 90,48 78,8 50,8 Z" />
          </clipPath>
        </defs>

        {/* 1. Dark Egg Jar Base Background */}
        <path
          d="M 50,8 C 22,8 10,48 10,84 C 10,110 27,126 50,126 C 73,126 90,110 90,84 C 90,48 78,8 50,8 Z"
          fill="url(#eggShellGrad)"
        />

        {/* 2. Liquid Filling Level clipped inside egg */}
        <g clipPath="url(#eggClip)">
          {/* Liquid Fill Rectangle that rises as clampedProgress increases */}
          {/* Y calculation: 126 is bottom (0%), 8 is top (100%). Height range = 118 */}
          {clampedProgress > 0 && (
            <>
              <rect
                x="0"
                y={126 - (clampedProgress / 100) * 118}
                width="100"
                height="130"
                fill="url(#eggLiquidGrad)"
                className="transition-all duration-700 ease-out"
              />

              {/* Surface Wave Effect */}
              <ellipse
                cx="50"
                cy={126 - (clampedProgress / 100) * 118}
                rx="42"
                ry="4"
                fill="#A5B4FC"
                fillOpacity="0.6"
                className="transition-all duration-700 ease-out"
              />

              {/* Floating Bubbles if active */}
              {clampedProgress > 15 && (
                <>
                  <circle cx="36" cy={120 - (clampedProgress / 100) * 80} r="2.5" fill="#C7D2FE" fillOpacity="0.4" />
                  <circle cx="62" cy={124 - (clampedProgress / 100) * 60} r="1.8" fill="#C7D2FE" fillOpacity="0.3" />
                  <circle cx="48" cy={118 - (clampedProgress / 100) * 100} r="2" fill="#C7D2FE" fillOpacity="0.5" />
                </>
              )}
            </>
          )}
        </g>

        {/* 3. Glass Highlights & Shimmer Reflection */}
        <path
          d="M 46,14 C 30,16 18,48 18,78 C 18,90 20,102 24,110 C 22,100 22,80 26,62 C 30,42 40,22 46,14 Z"
          fill="url(#shimmerGrad)"
          pointerEvents="none"
        />

        {/* 4. Outer Glass Egg Contour Border */}
        <path
          d="M 50,8 C 22,8 10,48 10,84 C 10,110 27,126 50,126 C 73,126 90,110 90,84 C 90,48 78,8 50,8 Z"
          stroke={isReady ? '#A5B4FC' : '#4338CA'}
          strokeWidth={dimensions.stroke}
          strokeOpacity={isReady ? 0.9 : 0.65}
          fill="none"
          className="transition-colors duration-500"
        />

        {/* 5. Center Badge or Sparkle when Ready */}
        {isReady && (
          <g transform="translate(42, 60)">
            <circle cx="8" cy="8" r="9" fill="#4338CA" fillOpacity="0.9" />
            <path
              d="M 8,2 L 10,6 L 14,8 L 10,10 L 8,14 L 6,10 L 2,8 L 6,6 Z"
              fill="#E0E7FF"
              className="animate-spin origin-center"
              style={{ animationDuration: '6s' }}
            />
          </g>
        )}
      </svg>

      {/* Numerical Labels for Medium/Large sizes */}
      {size !== 'sm' && (
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-bold text-theme-primary tracking-wide">
              {points.toLocaleString()} pts
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#5E43F3]/20 text-[#818CF8] border border-[#5E43F3]/30">
              ≈ ₦{nairaValue.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-theme-tertiary mt-0.5">
            {clampedProgress}% of daily ceiling
          </p>
        </div>
      )}
    </div>
  );
};
