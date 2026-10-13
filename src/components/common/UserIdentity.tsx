import React from 'react';
import { User } from '../../types';
import { VerificationBadge } from './VerificationBadge';

export type PublicIdentityType = 'display_name' | 'username' | 'both';

export interface UserIdentityObject {
  name?: string;
  username?: string;
  publicIdentityType?: PublicIdentityType;
  [key: string]: any;
}

/**
 * Returns the single public label to show for a user based on their publicIdentityType preference.
 * - 'display_name' (default): returns user's display name (e.g. "Somtochukwu Jasper")
 * - 'username': returns user's username WITHOUT the '@' prefix (e.g. "Jasper" or "jasper")
 * Includes reliable fallbacks so identity is never left blank.
 */
export function getPublicIdentityLabel(
  user?: UserIdentityObject | null,
  fallback: string = 'User'
): string {
  if (!user) return fallback;

  const identityType: PublicIdentityType = user.publicIdentityType === 'username' ? 'username' : 'display_name';

  if (identityType === 'username') {
    const rawUsername = (user.username || '').replace(/^@+/, '').trim();
    if (rawUsername) return rawUsername;
    return (user.name || '').trim() || fallback;
  }

  // 'display_name'
  const rawName = (user.name || '').trim();
  if (rawName) return rawName;
  const rawUsername = (user.username || '').replace(/^@+/, '').trim();
  return rawUsername || fallback;
}

export interface UserIdentityProps {
  user?: Partial<User> | UserIdentityObject | null;
  className?: string;
  badgeSize?: 'xs' | 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  as?: 'span' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
}

/**
 * Reusable UserIdentity component.
 * Renders the single primary public identity label (Name OR Username)
 * with verification badge support, preventing duplicate identity lines.
 */
export const UserIdentity: React.FC<UserIdentityProps> = ({
  user,
  className = '',
  badgeSize = 'xs',
  showBadge = true,
  onClick,
  title,
  as: Component = 'span',
}) => {
  const label = getPublicIdentityLabel(user);

  return (
    <Component
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 min-w-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="truncate">{label}</span>
      {showBadge && user && (
        <VerificationBadge user={user as any} size={badgeSize} asSpan />
      )}
    </Component>
  );
};
