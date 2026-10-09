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
 * Uses Lalao's signature blue brand color (#5E43F3) across all three tiers:
 * - Tier 3: Standard Verified (₦800) -> Solid Lalao blue seal with white checkmark.
 * - Tier 4: Priority Verified (₦1,700) -> Dual-ring Lalao blue crest with priority beacon & checkmark.
 * - Tier 5: Creator Premium (₦3,500) -> Lalao blue octa-shield with spark crest and checkmark.
 */
/**
 * Resolve a user's CURRENT active subscription tier.
 * Mirrors `resolveUserVerification` in convex/social.ts — the single rule:
 * paid tier + status active (or unset) + not past expiry. Never post-based.
 */
export function getActiveSubscriptionTier(user?: Partial<User> | null): VerificationTier {
  if (!user) return 'none';
  const u = user as any;
  const tier: VerificationTier | undefined = u.verificationTier;
  if (tier && tier !== 'none') {
    if (u.verificationStatus && u.verificationStatus !== 'active') return 'none';
    if (u.verificationExpiresAt && u.verificationExpiresAt <= Date.now()) return 'none';
    return tier;
  }
  // Legacy payloads that only carry the boolean flag
  return u.isVerified ? 'verified' : 'none';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  tier: propTier,
  user,
  size = 'sm',
  showTooltip = true,
  className = '',
}) => {
  // Resolve tier: explicit propTier takes precedence, otherwise derive from user's CURRENT status
  const tier: VerificationTier = propTier || getActiveSubscriptionTier(user);

  // Normalize creator_premium to creator
  const normalizedTier = tier === 'creator_premium' ? 'creator' : tier;

  if (normalizedTier === 'none') {
    return null;
  }

  const { box, px } = SIZE_MAP[size];

  // Tooltip descriptions
  const isCreator = normalizedTier === 'creator';
  const tooltipText = isCreator
    ? 'Creator Verified\nThis person is a verified creator on Lalao.'
    : 'Verified\nThis person has completed Lalao verification.';

  const badgeColor = isCreator ? '#1DA1F2' : '#0F1419';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alert(tooltipText);
      }}
      title={showTooltip ? tooltipText : undefined}
      className={`inline-flex items-center justify-center shrink-0 align-middle transition-transform hover:scale-110 cursor-pointer ${box} ${className}`}
      aria-label={isCreator ? 'Creator Verified' : 'Verified'}
    >
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <path
          d="M12 1.5L15.3 4.2L19.5 4.5L20.8 8.6L23.5 12L20.8 15.4L19.5 19.5L15.3 19.8L12 22.5L8.7 19.8L4.5 19.5L3.2 15.4L0.5 12L3.2 8.6L4.5 4.5L8.7 4.2L12 1.5Z"
          fill={badgeColor}
        />
        <path
          d="M7.5 12.25L10.5 15.25L16.5 9.25"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

/** Global alias: the subscription badge IS the tier badge (Verified / Priority / Creator Premium). */
export const SubscriptionBadge = VerificationBadge;
