export const PLAYSOLE_ISSUER = "https://one.playsole.xyz";
export const FIREBASE_ISSUER = "https://securetoken.google.com/uselalaoapp";

export type AuthProvider = "firebase" | "playsole";
export type PlaysoleLoginDecision = "ready" | "link_required" | "email_verification_required" | "create";

export function providerForIssuer(issuer: string): AuthProvider | null {
  if (issuer === PLAYSOLE_ISSUER) return "playsole";
  if (issuer === FIREBASE_ISSUER) return "firebase";
  return null;
}

export function decidePlaysoleLogin(input: {
  explicitMapping: boolean;
  legacyIdentityOwner: boolean;
  verifiedEmail: boolean;
  hasEmail: boolean;
  emailOwnerExists: boolean;
  emailOwnerIsLegacyIdentityOwner: boolean;
}): PlaysoleLoginDecision {
  if (input.explicitMapping) return "ready";
  if (input.legacyIdentityOwner) {
    if (input.emailOwnerExists && !input.emailOwnerIsLegacyIdentityOwner) return "link_required";
    return "ready";
  }
  if (input.hasEmail && !input.verifiedEmail) return "email_verification_required";
  if (input.emailOwnerExists) return "link_required";
  return "create";
}

export function isAuthLinkChallengeValid(input: {
  exists: boolean;
  consumed: boolean;
  expiresAt: number;
  now: number;
  requestedProvider: AuthProvider;
  authenticatedProvider: AuthProvider | null;
}): boolean {
  return input.exists && !input.consumed && input.expiresAt >= input.now && input.requestedProvider === input.authenticatedProvider;
}
