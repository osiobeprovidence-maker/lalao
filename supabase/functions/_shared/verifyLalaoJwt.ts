import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'npm:jose@6.2.14';

const FIREBASE = {
  issuer: 'https://securetoken.google.com/uselalaoapp',
  audience: 'uselalaoapp',
  jwksUrl: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
};
const PLAYSOLE = {
  issuer: 'https://one.playsole.xyz',
  audience: 'lalao',
  jwksUrl: 'https://one.playsole.xyz/.well-known/jwks.json',
};

// jose's remote set caches keys for a bounded period and rate-limits refreshes for
// unknown kids. URLs are constants; no token header can choose a key source.
const firebaseKeys = createRemoteJWKSet(new URL(FIREBASE.jwksUrl), { cacheMaxAge: 10 * 60_000, cooldownDuration: 30_000, timeoutDuration: 5_000 });
const playsoleKeys = createRemoteJWKSet(new URL(PLAYSOLE.jwksUrl), { cacheMaxAge: 10 * 60_000, cooldownDuration: 30_000, timeoutDuration: 5_000 });

export type VerifiedLalaoPrincipal = {
  provider: 'firebase' | 'playsole';
  issuer: string;
  subject: string;
  audience: string;
  issuedAt: number;
  expiresAt: number;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  firebaseSignInProvider: string | null;
};

export class LalaoJwtError extends Error {
  constructor() { super('Unauthorized.'); this.name = 'LalaoJwtError'; }
}

/** Verify a Firebase or Playsole ID token against the provider's fixed JWKS. */
export async function verifyLalaoJwt(token: string): Promise<VerifiedLalaoPrincipal> {
  try {
    const untrustedHeader = decodeProtectedHeader(token);
    if (untrustedHeader.alg !== 'RS256' || typeof untrustedHeader.kid !== 'string'
      || !untrustedHeader.kid || untrustedHeader.jku !== undefined
      || untrustedHeader.x5u !== undefined || untrustedHeader.jwk !== undefined) throw new LalaoJwtError();

    // iss is read only to select from this fixed allowlist; jwtVerify validates it cryptographically.
    const untrustedPayload = decodeJwt(token);
    const provider = untrustedPayload.iss === FIREBASE.issuer ? 'firebase'
      : untrustedPayload.iss === PLAYSOLE.issuer ? 'playsole' : null;
    if (!provider) throw new LalaoJwtError();
    const config = provider === 'firebase' ? FIREBASE : PLAYSOLE;
    const keySet = provider === 'firebase' ? firebaseKeys : playsoleKeys;
    const { payload, protectedHeader } = await jwtVerify(token, keySet, {
      algorithms: ['RS256'], issuer: config.issuer, audience: config.audience, clockTolerance: 5,
    });

    const now = Math.floor(Date.now() / 1000);
    if (protectedHeader.kid !== untrustedHeader.kid || typeof payload.sub !== 'string' || !payload.sub
      || typeof payload.exp !== 'number' || !Number.isSafeInteger(payload.exp)
      || typeof payload.iat !== 'number' || !Number.isSafeInteger(payload.iat)
      || payload.iat > now + 5 || payload.aud !== config.audience) throw new LalaoJwtError();

    let firebaseSignInProvider: string | null = null;
    if (provider === 'firebase') {
      const authTime = payload.auth_time;
      if (typeof authTime !== 'number' || !Number.isSafeInteger(authTime) || authTime > now + 5 || authTime > payload.iat + 5) throw new LalaoJwtError();
      const firebase = payload.firebase;
      if (!firebase || typeof firebase !== 'object' || Array.isArray(firebase)) throw new LalaoJwtError();
      const signInProvider = firebase && typeof firebase === 'object'
        ? (firebase as Record<string, unknown>).sign_in_provider : undefined;
      if (typeof signInProvider !== 'string' || !signInProvider) throw new LalaoJwtError();
      firebaseSignInProvider = signInProvider;
    }

    return {
      provider,
      issuer: config.issuer,
      subject: payload.sub,
      audience: config.audience,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : null,
      picture: typeof payload.picture === 'string' ? payload.picture : null,
      firebaseSignInProvider,
    };
  } catch {
    // Keep cryptographic and provider failures indistinguishable and never include token material.
    throw new LalaoJwtError();
  }
}
