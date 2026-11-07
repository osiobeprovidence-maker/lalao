import type { VerifiedLalaoPrincipal } from './verifyLalaoJwt.ts';

export const FIREBASE_ISSUER = 'https://securetoken.google.com/uselalaoapp';
export const PLAYSOLE_ISSUER = 'https://one.playsole.xyz';

export type ProvisioningClaims = {
  issuer: string;
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  method: string;
};

export type CurrentUserRepository = {
  findLinkedUserIds(issuer: string, subject: string): Promise<string[]>;
  findLegacyUserIds(tokenIdentifier: string): Promise<string[]>;
  findUserById(userId: string): Promise<Record<string, unknown> | null>;
};

export type CurrentUserResult = { status: number; body: Record<string, unknown> | null | { error: string } };

function error(errorMessage: string, status: number): CurrentUserResult {
  return { status, body: { error: errorMessage } };
}

/** Keep the current-user projection aligned with convex/social.resolveUserVerification. */
export function resolveLalaoUserVerification(
  user: Record<string, unknown>,
  now = Date.now(),
): { isVerified: boolean; verificationTier: 'none' | 'verified' | 'priority' | 'creator' } {
  const tier = user.verificationTier;
  const status = user.verificationStatus;
  const expiresAt = user.verificationExpiresAt as number | undefined;
  const isVerified = Boolean(
    tier &&
    tier !== 'none' &&
    (!status || status === 'active') &&
    (!expiresAt || expiresAt > now)
  );
  return {
    isVerified,
    verificationTier: isVerified ? tier as 'verified' | 'priority' | 'creator' : 'none',
  };
}

/** These claims are accepted only after verifyLalaoJwt has checked the signature and provider claims. */
export function parseProvisioningClaims(principal: VerifiedLalaoPrincipal): ProvisioningClaims {
  return {
    issuer: principal.issuer,
    subject: principal.subject,
    email: principal.email,
    emailVerified: principal.emailVerified,
    name: principal.name,
    avatarUrl: principal.picture,
    method: principal.provider === 'playsole' ? 'playsole' : principal.firebaseSignInProvider ?? 'firebase',
  };
}

export async function resolveCurrentUser(
  principal: VerifiedLalaoPrincipal,
  repository: CurrentUserRepository,
): Promise<CurrentUserResult> {
  const linkedUserIds = await repository.findLinkedUserIds(principal.issuer, principal.subject);
  if (linkedUserIds.length > 1) return error('This sign-in identity has a conflicting account mapping. Contact support.', 409);
  if (linkedUserIds.length === 1 && !linkedUserIds[0]) return error('Could not load your Lalao profile. Please try again.', 500);

  // Check both sources even when an explicit link exists. A stale or conflicting
  // legacy tokenIdentifier must not be silently hidden by the newer mapping.
  const legacyUserIds = await repository.findLegacyUserIds(`${principal.issuer}|${principal.subject}`);
  if (legacyUserIds.length > 1) return error('This sign-in identity has a conflicting account mapping. Contact support.', 409);
  if (legacyUserIds.length === 1 && !legacyUserIds[0]) return error('Could not load your Lalao profile. Please try again.', 500);

  const linkedUserId = linkedUserIds[0] || null;
  const legacyUserId = legacyUserIds[0] || null;
  if (linkedUserId && legacyUserId && linkedUserId !== legacyUserId) {
    return error('This sign-in identity has a conflicting account mapping. Contact support.', 409);
  }
  const userId = linkedUserId || legacyUserId;
  if (!userId) return { status: 200, body: null };

  const user = await repository.findUserById(userId);
  if (!user) return { status: 200, body: null };
  const avatar = (typeof user.avatarUrl === 'string' && user.avatarUrl)
    || (principal.picture || '')
    || (typeof user.avatar === 'string' && user.avatar)
    || '';
  return {
    status: 200,
    body: { ...user, avatarUrl: avatar, avatar, ...resolveLalaoUserVerification(user) },
  };
}
