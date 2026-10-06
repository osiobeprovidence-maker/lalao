import React from 'react';
import { VerificationTier, User } from '../../types';

export interface VerificationBadgeProps {
  tier?: VerificationTier;
  user?: Partial<User> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-3.5 h-3.5', icon: 'w-2 h-2', px: 14 },
  sm: { box: 'w-4 h-4', icon: 'w-2.5 h-2.5', px: 16 },
  md: { box: 'w-4.5 h-4.5', icon: 'w-2.5 h-2.5', px: 18 },
  lg: { box: 'w-5.5 h-5.5', icon: 'w-3.5 h-3.5', px: 22 },
};

/**
 * VerificationBadge
 *
 * Reusable verification badge for LaLao.
 * Strictly adheres to the teal color family across all three tiers:
 * - Tier 3: Standard Verified (₦800) -> Scalloped teal circle with checkmark.
 * - Tier 4: Priority Verified (₦1,700) -> Dual-ring deep teal crest with priority chevron-check.
 * - Tier 5: Creator Premium (₦3,500) -> Teal creative emblem with spark/star crest and checkmark.
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  tier: propTier,
  user,
  size = 'sm',
  showTooltip = true,
  className = '',
}) => {
  // Resolve tier: explicit propTier takes precedence, otherwise derive from user
  let tier: VerificationTier = propTier || 'none';
  if (!propTier && user) {
    if (user.verificationTier && user.verificationTier !== 'none') {
      tier = user.verificationTier;
    } else if (user.isVerified) {
      tier = 'verified';
    }
  }

  if (tier === 'none') {
    return null;
  }

  const { box, px } = SIZE_MAP[size];

  // Tooltip descriptions
  const tooltipText = {
    verified: 'Verified Account · Authenticated Identity',
    priority: 'Priority Verified · Priority Discovery & Reach',
    creator: 'Creator Premium · Official Verified Creator',
  }[tier];

  // 1. TIER 3: STANDARD VERIFIED (₦800)
  // Clean scalloped 12-point seal in crisp teal (#0D9488) with white checkmark
  if (tier === 'verified') {
    return (
      <span
        title={showTooltip ? tooltipText : undefined}
        className={`inline-flex items-center justify-center shrink-0 align-middle select-none transition-transform hover:scale-110 ${box} ${className}`}
        aria-label="Verified Account"
      >
        <svg
          viewBox="0 0 24 24"
          width={px}
          height={px}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* 12-point smooth seal */}
          <path
            d="M9 2.5C9.7 2.1 10.5 2 11.3 2.1C12.1 2.2 12.9 2.6 13.5 3.1L14.7 4.2C15.3 4.7 16.1 5 16.9 5.1L18.5 5.2C19.3 5.3 20.1 5.7 20.7 6.3C21.3 6.9 21.7 7.7 21.8 8.5L21.9 10.1C22 10.9 22.3 11.7 22.8 12.3L23.9 13.5C24.4 14.1 24.8 14.9 24.9 15.7C25 16.5 24.6 17.3 24.1 17.9L23 19.1C22.5 19.7 22.2 20.5 22.1 21.3L22 22.9C21.9 23.7 21.5 24.5 20.9 25.1"
            className="hidden"
          />
          {/* Symmetrical 10-point verified roundel in solid teal */}
          <circle cx="12" cy="12" r="10" fill="#0D9488" />
          {/* Subtle lighter teal highlight rim */}
          <circle cx="12" cy="12" r="9.2" stroke="#2DD4BF" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
          {/* Clean bold white checkmark */}
          <path
            d="M7.75 12.25L10.5 15L16.25 9.25"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // 2. TIER 4: PRIORITY VERIFIED (₦1,700)
  // Deep teal badge with distinct dual-ring perimeter and elevated chevron-check
  if (tier === 'priority') {
    return (
      <span
        title={showTooltip ? tooltipText : undefined}
        className={`inline-flex items-center justify-center shrink-0 align-middle select-none transition-transform hover:scale-110 ${box} ${className}`}
        aria-label="Priority Verified Account"
      >
        <svg
          viewBox="0 0 24 24"
          width={px}
          height={px}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Outer priority ring in bright cyan-teal */}
          <circle cx="12" cy="12" r="10.5" stroke="#14B8A6" strokeWidth="1.5" strokeOpacity="0.8" />
          {/* Inner solid deep teal body */}
          <circle cx="12" cy="12" r="8.75" fill="#0F766E" />
          {/* Inner concentric ring for prestige hierarchy */}
          <circle cx="12" cy="12" r="8.2" stroke="#5EEAD4" strokeWidth="0.75" strokeDasharray="1.5 1" fill="none" />
          {/* Checkmark with elevated priority crown-dot at top-right */}
          <path
            d="M7.5 12.25L10.5 15.25L16.5 9.25"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle priority beacon dot at top */}
          <circle cx="12" cy="4" r="1.25" fill="#2DD4BF" />
        </svg>
      </span>
    );
  }

  // 3. TIER 5: CREATOR PREMIUM (₦3,500)
  // Dedicated Creator badge in the teal family with a refined creative 4-point spark emblem
  // Clean, professional, distinct from standard & priority, NO yellow.
  return (
    <span
      title={showTooltip ? tooltipText : undefined}
      className={`inline-flex items-center justify-center shrink-0 align-middle select-none transition-transform hover:scale-110 ${box} ${className}`}
      aria-label="Creator Premium Verified"
    >
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="creatorTealGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14B8A6" />
            <stop offset="0.6" stopColor="#0D9488" />
            <stop offset="1" stopColor="#0F766E" />
          </linearGradient>
        </defs>

        {/* Distinct 8-point Creator Octa-shield in rich teal gradient */}
        <path
          d="M12 1.5L15.3 4.2L19.5 4.5L20.8 8.6L23.5 12L20.8 15.4L19.5 19.5L15.3 19.8L12 22.5L8.7 19.8L4.5 19.5L3.2 15.4L0.5 12L3.2 8.6L4.5 4.5L8.7 4.2L12 1.5Z"
          fill="url(#creatorTealGrad)"
          stroke="#5EEAD4"
          strokeWidth="0.8"
        />

        {/* Center checkmark */}
        <path
          d="M7.5 12.25L10.5 15.25L16.5 9.25"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Creative Star / Spark Crest Accent (pure white & teal-tinted, NO yellow) */}
        <path
          d="M12 4.2C12.3 5.3 12.8 5.8 13.9 6.1C12.8 6.4 12.3 6.9 12 8C11.7 6.9 11.2 6.4 10.1 6.1C11.2 5.8 11.7 5.3 12 4.2Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
      </svg>
    </span>
  );
};
