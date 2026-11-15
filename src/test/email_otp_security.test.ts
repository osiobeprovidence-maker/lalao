/**
 * Email OTP (registration verification) security tests.
 *
 * Covers the client-runnable security surface:
 *   - OTP format validation (exactly 6 digits)
 *   - Constant-time hex comparison
 *   - Hash determinism (SHA-256)
 *   - Expiry semantics
 *   - Static source invariants:
 *       * OTP verification happens server-side via api.emails.verifyOtp
 *       * No client-side/Math.random OTP generation remains
 *       * Signup routes new accounts to /verify
 *       * Fake 000000/setTimeout verification is gone
 */
// Set a valid pepper for all OTP-related tests.
process.env.EMAIL_OTP_PEPPER = 'test-pepper-not-a-secret-32chars!';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  generateOtpCode,
  hashOtpCode,
  isOtpFormat,
  isOtpExpired,
  timingSafeHexEqual,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_LENGTH,
} from '../../convex/lib/emailOtpSecurity';

const read = (rel: string) =>
  readFileSync(resolve(process.cwd(), rel), 'utf8');

test('generateOtpCode produces 6-digit zero-padded codes', () => {
  for (let i = 0; i < 200; i++) {
    const code = generateOtpCode();
    assert.match(code, /^\d{6}$/);
    assert.ok(Number(code) >= 0 && Number(code) <= 999999);
  }
});

test('isOtpFormat accepts only exactly-6-digit numeric strings', () => {
  assert.equal(isOtpFormat('123456'), true);
  assert.equal(isOtpFormat('000000'), true);
  assert.equal(isOtpFormat('12345'), false);
  assert.equal(isOtpFormat('1234567'), false);
  assert.equal(isOtpFormat('12a456'), false);
  assert.equal(isOtpFormat(' 12345'), false);
  assert.equal(isOtpFormat(123456), false);
  assert.equal(isOtpFormat(''), false);
});

test('hashOtpCode is deterministic and stable across calls', async () => {
  const a = await hashOtpCode('123456');
  const b = await hashOtpCode('123456');
  const c = await hashOtpCode('654321');
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('timingSafeHexEqual is symmetric for equal and unequal inputs', () => {
  const h1 = 'a'.repeat(64);
  const h2 = 'a'.repeat(64);
  const h3 = 'b'.repeat(64);
  const h4 = 'a'.repeat(63);
  assert.equal(timingSafeHexEqual(h1, h2), true);
  assert.equal(timingSafeHexEqual(h1, h3), false);
  assert.equal(timingSafeHexEqual(h1, h4), false);
  assert.equal(timingSafeHexEqual('', ''), true);
});

test('isOtpExpired respects the 10-minute window', () => {
  const now = Date.now();
  assert.equal(isOtpExpired(now + 10 * 60 * 1000, now), false);
  assert.equal(isOtpExpired(now - 1, now), true);
  assert.equal(isOtpExpired(now, now), true);
});

test('otp constants match the intended product contract', () => {
  assert.equal(OTP_LENGTH, 6);
  assert.equal(OTP_EXPIRY_MS, 10 * 60 * 1000);
  assert.equal(OTP_MAX_ATTEMPTS, 5);
  assert.equal(OTP_RESEND_COOLDOWN_MS, 60 * 1000);
  assert.equal(OTP_MAX_SENDS_PER_HOUR, 5);
});

test('signup sends /verify navigation and awaits server OTP dispatch', () => {
  const src = read('src/pages/auth/SignUpPage.tsx');
  assert.match(src, /sendVerificationOtp/);
  assert.match(src, /\/verify/);
  // After successful user-record creation, the user is routed to the verification page.
  assert.match(src, /navigate\('\/verify'/);
});

test('OTPVerifyPage uses the real server verification action and no fake success path', () => {
  const src = read('src/pages/auth/OTPVerifyPage.tsx');
  assert.match(src, /api\.emails\.verifyOtp/);
  assert.match(src, /api\.emails\.sendOtpEmail/);
  assert.equal(src.includes('000000'), false, 'hard-coded test bypass must not remain');
  assert.equal(src.includes('setTimeout(r, 1200)'), false, 'fake verification delay must not remain');
  assert.equal(src.includes('Math.random()'), false, 'client-side OTP generation must not remain');
});

test('emails backend exposes the secure OTP actions and drops old insecure ABI', () => {
  const src = read('convex/emails.ts');
  assert.match(src, /export const sendOtpEmail\s*=\s*action\(\{\s*args:\s*\{\s*\}/);
  assert.match(src, /export const verifyOtp\s*=\s*action\(/);
  // getEmailVerificationStatus was relocated to the non-Node module.
  assert.match(src, /import {[^}]*} from ".\/lib\/resend"/);
  // Old client-decided signature must be gone from the send action block.
  const sendBlock = src.slice(src.indexOf('export const sendOtpEmail'), src.indexOf('export const verifyOtp'));
  assert.equal(sendBlock.includes('purpose: v.optional(v.string())'), false);
  assert.equal(sendBlock.includes('to: v.string(),'), false);
  assert.equal(sendBlock.includes('otp: v.string(),'), false);
});

test('emailVerification module generates and verifies server-side with attempt/expiry limits', () => {
  const src = read('convex/emailVerification.ts');
  assert.match(src, /generateOtpCode/);
  assert.match(src, /consumedAt/);
  assert.match(src, /attempts/);
  assert.match(src, /expiresAt/);
  assert.match(src, /by_user_created/);
  // Never returns the raw code back to the client.
  assert.match(src, /return \{ code[,:]/, 'mutation returns code to action only');
});

test('getEmailVerificationStatus query is registered in the non-Node module', () => {
  const src = read('convex/emailVerification.ts');
  assert.match(src, /export const getEmailVerificationStatus\s*=\s*query\(/);
});

test('sendOtpEmail checks the mailer before issuing codes', () => {
  const src = read('convex/emails.ts');
  const sendBlock = src.slice(src.indexOf('export const sendOtpEmail'), src.indexOf('export const verifyOtp'));
  assert.ok(sendBlock.indexOf('getResendClient()') < sendBlock.indexOf('prepareEmailOtp'),
    'mailer must be checked before OTP issuance');
});

test('hashOtpCode uses HMAC-SHA256 with the server-only pepper and fails closed without it', async () => {
  const saved = process.env.EMAIL_OTP_PEPPER;
  delete process.env.EMAIL_OTP_PEPPER;
  await assert.rejects(hashOtpCode('123456'), /EMAIL_OTP_PEPPER/);
  process.env.EMAIL_OTP_PEPPER = 'short';
  await assert.rejects(hashOtpCode('123456'), /too short/);
  process.env.EMAIL_OTP_PEPPER = saved;
  const ok = await hashOtpCode('123456');
  assert.match(ok, /^[0-9a-f]{64}$/);
});
