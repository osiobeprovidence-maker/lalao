/**
 * Email OTP security surface shared between Convex actions/mutations and
 * Node/tsx tests. Follows the wallet-OTP model:
 *   - OTP codes are cryptographically random 6-digit values.
 *   - Codes are HMAC-SHA256 tagged with a server-only pepper (EMAIL_OTP_PEPPER),
 *     never stored or returned. A missing/weak pepper fails closed.
 *   - Constant-time comparison for tag equality.
 *
 * Uses Web Crypto only (no Node-specific imports) so it runs in both the
 * Convex edge runtime and Node >= 19 (all tests run on Node 24).
 */
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;          // per issued code
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends
export const OTP_MAX_SENDS_PER_HOUR = 5;

const MIN_PEPPER_LENGTH = 16;

function readPepper(): string {
  const pepper = process.env.EMAIL_OTP_PEPPER;
  if (!pepper || typeof pepper !== "string") {
    throw new Error("EMAIL_OTP_PEPPER is not configured. Refusing to handle verification codes.");
  }
  if (pepper.length < MIN_PEPPER_LENGTH) {
    throw new Error("EMAIL_OTP_PEPPER is too short (minimum 16 characters). Refusing to handle verification codes.");
  }
  return pepper;
}

let cachedPepper: string | undefined;
let cachedKey: CryptoKey | undefined;

async function hmacKey(): Promise<CryptoKey> {
  if (cachedKey && cachedPepper === process.env.EMAIL_OTP_PEPPER) return cachedKey;
  const pepper = readPepper();
  const encoded = new TextEncoder().encode(pepper);
  cachedKey = await crypto.subtle.importKey(
    "raw",
    encoded,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  cachedPepper = pepper;
  return cachedKey;
}

export function generateOtpCode(): string {
  const n = new DataView(new Uint8Array(4).buffer);
  crypto.getRandomValues(new Uint8Array(n.buffer));
  return String(n.getUint32(0) % 1_000_000).padStart(OTP_LENGTH, "0");
}

/** HMAC-SHA256 hex of a code, keyed by the server-only pepper. */
export async function hashOtpCode(code: string): Promise<string> {
  const key = await hmacKey();
  const data = new TextEncoder().encode(code);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isOtpFormat(otp: unknown): otp is string {
  return typeof otp === "string" && /^\d{6}$/.test(otp);
}

/** Constant-time equality for equal-length hex strings. */
export function timingSafeHexEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    const dummy = new TextEncoder().encode("0".repeat(bufA.length));
    cryptoConstantTimeEqual(bufA, dummy);
    return false;
  }
  return cryptoConstantTimeEqual(bufA, bufB);
}

function cryptoConstantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export function isOtpExpired(expiresAt: number, now: number = Date.now()): boolean {
  return now >= expiresAt;
}
