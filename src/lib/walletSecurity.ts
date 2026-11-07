/**
 * Pure wallet security helpers.
 *
 * These functions have no external dependencies and run identically in the
 * browser, in Node/tsx tests, and (for the shared algorithms) inside the
 * Supabase Edge Function. The actual PBKDF2 hashing with the server-side
 * pepper lives in the Edge Function (`supabase/functions/app-wallet`) so the
 * pepper and hashes never reach the browser.
 */

/** A wallet transaction PIN is exactly 4 numeric digits. */
export function validatePinFormat(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

/** A PIN-reset OTP is exactly 6 numeric digits. */
export function validateOtpFormat(otp: unknown): otp is string {
  return typeof otp === 'string' && /^\d{6}$/.test(otp);
}

/**
 * Constant-time string comparison. Always runs the full length so the
 * elapsed time does not reveal how many leading characters matched.
 * Returns false (never throws) when lengths differ.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Cryptographically random 16-byte salt, hex-encoded (32 chars). */
export function generateSaltHex(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Cryptographically secure randomness is unavailable.');
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cryptographically random 6-digit OTP, zero-padded. */
export function generateOtp(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Cryptographically secure randomness is unavailable.');
  }
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(value).padStart(6, '0');
}

/** Maximum consecutive failed PIN attempts before a temporary lockout. */
export const PIN_MAX_ATTEMPTS = 5;
/** Temporary lockout duration after max failed attempts (15 minutes, ms). */
export const PIN_LOCKOUT_MS = 15 * 60 * 1000;
/** PIN-reset OTP expiry (10 minutes, ms). */
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
/** Maximum failed OTP attempts before the reset flow is throttled. */
export const OTP_MAX_ATTEMPTS = 5;
