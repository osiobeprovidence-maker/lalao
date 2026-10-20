import React from 'react';
import { VerificationTier, User } from '../../types';

export interface VerificationBadgeProps {
  tier?: VerificationTier;
  user?: Partial<User> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  asSpan?: boolean;
  interactive?: boolean;
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
export function normalizeTier(tier?: string | null): VerificationTier {
  if (!tier) return 'none';
  const t = String(tier).toLowerCase().trim();
  if (t === 'creator' || t === 'creator_premium' || t === 'tier_5' || t === 'tier 5' || t === 'tier5') return 'creator';
  if (t === 'priority' || t === 'tier_4' || t === 'tier 4' || t === 'tier4') return 'priority';
  if (t === 'verified' || t === 'standard' || t === 'tier_3' || t === 'tier 3' || t === 'tier3') return 'verified';
  return 'none';
}

/**
 * Resolve a user's CURRENT active subscription tier.
 * Robustly inspects verificationTier, subscription object, and boolean verification flags.
 */
export function getActiveSubscriptionTier(user?: Partial<User> | null): VerificationTier {
  if (!user) return 'none';
  const u = user as any;

  // 1. Check direct candidate tier fields
  const candidateTier = u.verificationTier || u.tier || u.creatorTier || u.subscription?.tier;

  // Status check: if explicitly inactive, expired, or cancelled, treat as none
  const rawStatus = u.verificationStatus ?? u.subscription?.status;
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase().trim() : undefined;
  if (status && (status === 'inactive' || status === 'expired' || status === 'cancelled')) {
    return 'none';
  }

  // Expiration check: if timestamp has passed, return 'none'
  const rawExp = u.verificationExpiresAt ?? u.subscription?.expiresAt ?? u.subscription?.nextBillingDate;
  if (rawExp) {
    const expTime = typeof rawExp === 'string' ? new Date(rawExp).getTime() : Number(rawExp);
    if (!isNaN(expTime) && expTime > 0 && expTime <= Date.now()) {
      return 'none';
    }
  }

  // If candidate tier is recognized, return normalized tier
  if (candidateTier) {
    const normalized = normalizeTier(candidateTier);
    if (normalized !== 'none') {
      return normalized;
    }
  }

  // 2. Boolean flag check (isVerified, verified, is_verified, hasActiveSubscription)
  const isFlagged = Boolean(u.isVerified || u.verified || u.is_verified || u.hasActiveSubscription);
  if (isFlagged) {
    if (u.creatorCategory || (typeof u.creatorLevel === 'number' && u.creatorLevel > 0)) {
      return 'creator';
    }
    return 'verified';
  }

  return 'none';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  tier: propTier,
  user,
  size = 'sm',
  showTooltip = true,
  className = '',
  asSpan = false,
  interactive = true,
}) => {
  // Resolve tier: explicit propTier takes precedence if recognized, otherwise derive from user
  const explicitTier = propTier ? normalizeTier(propTier) : 'none';
  const resolvedTier: VerificationTier = explicitTier !== 'none' ? explicitTier : getActiveSubscriptionTier(user);
  const normalizedTier = normalizeTier(resolvedTier);

  if (normalizedTier === 'none') {
    return null;
  }

  const { box, px } = SIZE_MAP[size];

  // Tooltip descriptions
  const isCreator = normalizedTier === 'creator';
  const isPriority = normalizedTier === 'priority';
  const tooltipText = isCreator
    ? 'Creator Verified\nThis person is a verified creator on Lalao.'
    : isPriority
    ? 'Priority Verified\nThis person has priority verification on Lalao.'
    : 'Verified\nThis person has completed Lalao verification.';

  // Standard verified blue across verified profiles matching the post badge
  const badgeColor = '#1DA1F2';

  const svgIcon = (
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
  );

  if (asSpan || !interactive) {
    return (
      <span
        title={showTooltip ? tooltipText : undefined}
        className={`inline-flex items-center justify-center shrink-0 align-middle ${box} ${className}`}
        aria-label={isCreator ? 'Creator Verified' : isPriority ? 'Priority Verified' : 'Verified'}
      >
        {svgIcon}
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alert(tooltipText);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          alert(tooltipText);
        }
      }}
      title={showTooltip ? tooltipText : undefined}
      className={`inline-flex items-center justify-center shrink-0 align-middle transition-transform hover:scale-110 cursor-pointer ${box} ${className}`}
      aria-label={isCreator ? 'Creator Verified' : isPriority ? 'Priority Verified' : 'Verified'}
    >
      {svgIcon}
    </span>
  );
};

/** Global alias: the subscription badge IS the tier badge (Verified / Priority / Creator Premium). */
export const SubscriptionBadge = VerificationBadge;
