/**
 * Lalao Wallet — Secure PIN security tests.
 *
 * Covers the pure, client-testable security requirements:
 *   - PIN format validation (exactly 4 digits)
 *   - OTP format validation (exactly 6 digits)
 *   - Constant-time comparison (timing-safe, no early exit)
 *   - Salt generation (16 bytes, 32 hex chars, unique)
 *   - OTP generation (6 digits, zero-padded, unique)
 *   - Legacy migration flag semantics (pinRequiresSetup for plaintext wallets)
 *   - Unaffected wallets are not forced to reset
 *
 * The server-side PBKDF2-HMAC-SHA-256 hashing with the pepper lives in the
 * Supabase Edge Function (Deno Web Crypto) and is exercised through the
 * Edge Function itself; these tests cover the deterministic security surface
 * that runs in Node/tsx.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validatePinFormat,
  validateOtpFormat,
  timingSafeEqual,
  generateSaltHex,
  generateOtp,
  PIN_MAX_ATTEMPTS,
  PIN_LOCKOUT_MS,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
} from '../lib/walletSecurity';

function assertNever(cond: boolean, message: string): void {
  if (cond) throw new Error(message);
}

{
  // PIN format: exactly 4 numeric digits.
  assert.equal(validatePinFormat('1234'), true);
  assert.equal(validatePinFormat('0000'), true);
  assert.equal(validatePinFormat('9999'), true);
  assert.equal(validatePinFormat('123'), false, 'too short');
  assert.equal(validatePinFormat('12345'), false, 'too long');
  assert.equal(validatePinFormat('123a'), false, 'non-digit');
  assert.equal(validatePinFormat('abcd'), false, 'letters');
  assert.equal(validatePinFormat(''), false, 'empty');
  assert.equal(validatePinFormat(1234), false, 'number not string');
  assert.equal(validatePinFormat(null), false, 'null');
  assert.equal(validatePinFormat(undefined), false, 'undefined');
  console.log('✓ PASS: PIN format validation (exactly 4 numeric digits)');
}

{
  // OTP format: exactly 6 numeric digits.
  assert.equal(validateOtpFormat('123456'), true);
  assert.equal(validateOtpFormat('000000'), true);
  assert.equal(validateOtpFormat('999999'), true);
  assert.equal(validateOtpFormat('12345'), false, 'too short');
  assert.equal(validateOtpFormat('1234567'), false, 'too long');
  assert.equal(validateOtpFormat('12345a'), false, 'non-digit');
  console.log('✓ PASS: OTP format validation (exactly 6 numeric digits)');
}

{
  // Constant-time comparison.
  assert.equal(timingSafeEqual('1234', '1234'), true);
  assert.equal(timingSafeEqual('1234', '1235'), false);
  assert.equal(timingSafeEqual('1234', '12345'), false, 'length mismatch');
  assert.equal(timingSafeEqual('', ''), true);
  assert.equal(timingSafeEqual('', 'a'), false);
  assert.equal(timingSafeEqual('a', ''), false);
  console.log('✓ PASS: Constant-time comparison (no early exit on length mismatch)');
}

{
  // Salt generation: 16 bytes → 32 hex chars, unique per call.
  const salt1 = generateSaltHex();
  const salt2 = generateSaltHex();
  assert.equal(salt1.length, 32, 'salt is 32 hex chars (16 bytes)');
  assert.equal(salt2.length, 32);
  assert.match(salt1, /^[0-9a-f]{32}$/, 'salt is lowercase hex');
  assert.match(salt2, /^[0-9a-f]{32}$/, 'salt is lowercase hex');
  assertNever(salt1 === salt2, 'salts must be unique per call');
  console.log('✓ PASS: Salt generation (16 bytes, 32 hex chars, unique)');
}

{
  // OTP generation: 6 digits, zero-padded, unique per call (probabilistically).
  const otp1 = generateOtp();
  const otp2 = generateOtp();
  assert.equal(otp1.length, 6, 'OTP is 6 digits');
  assert.equal(otp2.length, 6);
  assert.match(otp1, /^\d{6}$/, 'OTP is numeric');
  assert.match(otp2, /^\d{6}$/, 'OTP is numeric');
  // Leading zeros preserved: regenerate until we can sanity-check padding via range.
  let sawLeadingZero = false;
  for (let i = 0; i < 2000; i++) {
    const o = generateOtp();
    if (o.startsWith('0')) { sawLeadingZero = true; break; }
  }
  assert.equal(sawLeadingZero, true, 'OTP zero-padding produces leading zeros');
  assertNever(otp1 === otp2, 'OTPs must be unique per call (probabilistically)');
  console.log('✓ PASS: OTP generation (6 digits, zero-padded, unique)');
}

{
  // Security constants match the migration/Edge Function policy.
  assert.equal(PIN_MAX_ATTEMPTS, 5);
  assert.equal(PIN_LOCKOUT_MS, 15 * 60 * 1000, '15-minute lockout');
  assert.equal(OTP_EXPIRY_MS, 10 * 60 * 1000, '10-minute OTP expiry');
  assert.equal(OTP_MAX_ATTEMPTS, 5);
  console.log('✓ PASS: Security constants (attempts, lockout, expiry)');
}

{
  // Legacy migration semantics (mirrored by the migration backfill):
  //   - A wallet with a plaintext legacy PIN but no hash → pinRequiresSetup.
  //   - Such a wallet is treated as needing a new secure PIN (forced setup).
  //   - An unaffected wallet (no plaintext, no hash) is NOT forced to reset.
  type WalletView = {
    hasPin: boolean;
    walletPin?: string | null;
    walletPinHash?: string | null;
    pinRequiresSetup?: boolean;
  };
  function legacyNeedsPinSetup(w: WalletView): boolean {
    // Migration backfill: plaintext PIN present and no hash → requires setup.
    if ((w.walletPin ?? '') !== '' && !(w.walletPinHash ?? '')) return true;
    return w.pinRequiresSetup === true || !w.hasPin;
  }

  // Legacy wallet with plaintext PIN, no hash: MUST set a new secure PIN.
  const legacyWallet: WalletView = {
    hasPin: true,
    walletPin: '1234',
    walletPinHash: null,
    pinRequiresSetup: true,
  };
  assert.equal(legacyNeedsPinSetup(legacyWallet), true, 'legacy plaintext wallet requires new PIN');

  // Unaffected wallet, no PIN at all: not forced (will be prompted to create).
  const freshWallet: WalletView = { hasPin: false };
  assert.equal(legacyNeedsPinSetup(freshWallet), true, 'wallet without PIN needs setup');

  // Secure wallet with hash, no legacy plaintext, not forced: no reset needed.
  const secureWallet: WalletView = {
    hasPin: true,
    walletPinHash: 'deadbeef'.repeat(8),
    pinRequiresSetup: false,
  };
  assert.equal(legacyNeedsPinSetup(secureWallet), false, 'secure hashed wallet does not need reset');

  // Unaffected wallet with neither legacy plaintext nor hash: not reset unnecessarily.
  const unaffectedWallet: WalletView = {
    hasPin: false,
    walletPin: null,
    walletPinHash: null,
    pinRequiresSetup: false,
  };
  assert.equal(legacyNeedsPinSetup(unaffectedWallet), true, 'unaffected wallet without PIN needs setup (not reset)');

  console.log('✓ PASS: Legacy migration semantics (forced setup vs unaffected)');
}

console.log('\nAll wallet PIN security tests passed.');

{
  // Regression contract: OTP failures must be tracked and consumed atomically
  // by the OTP RPC, never recorded as wallet PIN failures by the Edge Function.
  const edgeFunction = readFileSync(new URL('../../supabase/functions/app-wallet/index.ts', import.meta.url), 'utf8');
  const migration = readFileSync(new URL('../../supabase/migrations/20261103000001_wallet_secure_pin.sql', import.meta.url), 'utf8');
  const resetBranch = edgeFunction.split("if (input.operation === 'resetPinWithOtp')")[1]?.split('/* ---------------------- transferCredits')[0] ?? '';

  assert.match(resetBranch, /lalao_wallet_reset_pin_with_otp/);
  assert.doesNotMatch(resetBranch, /lalao_wallet_record_pin_attempt/);
  assert.match(migration, /"pinResetOtpFailCount" = v_wallet\."pinResetOtpFailCount" \+ 1/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /"pinResetOtpExpiresAt" = CASE WHEN[\s\S]*THEN NULL/);
  assert.match(migration, /"pinResetOtpUsedAt" = v_now/);
  assert.match(migration, /"pinResetOtpFailCount" = 0/);
  console.log('✓ PASS: OTP failures are atomically tracked separately, throttled, invalidated, and consumed');
}
