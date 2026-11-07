import assert from 'node:assert/strict';
import { FIREBASE_ISSUER, PLAYSOLE_ISSUER, parseProvisioningClaims, resolveCurrentUser, resolveLalaoUserVerification, type CurrentUserRepository } from '../../supabase/functions/_shared/currentUser';
import type { VerifiedLalaoPrincipal } from '../../supabase/functions/_shared/verifyLalaoJwt';

function repository(overrides: Partial<CurrentUserRepository> = {}) {
  const calls: string[] = [];
  const repo: CurrentUserRepository = {
    async findLinkedUserIds(issuer, subject) { calls.push(`linked:${issuer}:${subject}`); return []; },
    async findLegacyUserIds(identifier) { calls.push(`legacy:${identifier}`); return []; },
    async findUserById(userId) { calls.push(`user:${userId}`); return null; },
    ...overrides,
  };
  return { repo, calls };
}

function principal(overrides: Partial<VerifiedLalaoPrincipal> = {}): VerifiedLalaoPrincipal {
  return {
    provider: 'firebase', issuer: FIREBASE_ISSUER, subject: 'firebase-subject', audience: 'uselalaoapp',
    issuedAt: 1_800_000_000, expiresAt: 1_800_003_600, email: null, emailVerified: false,
    name: null, picture: 'https://images.example/avatar.png', firebaseSignInProvider: 'google.com', ...overrides,
  };
}

{
  const claims = parseProvisioningClaims(principal({ email: 'synthetic@example.invalid', emailVerified: true, name: 'Synthetic User' }));
  assert.deepEqual(claims, {
    issuer: FIREBASE_ISSUER, subject: 'firebase-subject', email: 'synthetic@example.invalid',
    emailVerified: true, name: 'Synthetic User', avatarUrl: 'https://images.example/avatar.png', method: 'google.com',
  });
}

{
  const { repo, calls } = repository({
    async findLinkedUserIds() { return ['user_linked']; },
    async findUserById(userId) { return { _id: userId, avatarUrl: '' }; },
  });
  const result = await resolveCurrentUser(principal(), repo);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    _id: 'user_linked', avatarUrl: 'https://images.example/avatar.png', avatar: 'https://images.example/avatar.png',
    isVerified: false, verificationTier: 'none',
  });
  assert.ok(calls.includes(`legacy:${FIREBASE_ISSUER}|firebase-subject`), 'legacy mapping is checked for disagreement');
}

{
  const now = 1_900_000_000_000;
  assert.deepEqual(resolveLalaoUserVerification({ verificationTier: 'creator', verificationStatus: 'active' }, now), {
    isVerified: true, verificationTier: 'creator',
  }, 'active verification without an expiry remains active');
  assert.deepEqual(resolveLalaoUserVerification({ verificationTier: 'priority' }, now), {
    isVerified: true, verificationTier: 'priority',
  }, 'legacy rows without a status retain Convex behavior');
  for (const verificationStatus of ['inactive', 'expired', 'cancelled']) {
    assert.deepEqual(resolveLalaoUserVerification({ verificationTier: 'verified', verificationStatus }, now), {
      isVerified: false, verificationTier: 'none',
    }, `${verificationStatus} verification is inactive`);
  }
  assert.deepEqual(resolveLalaoUserVerification({
    verificationTier: 'creator', verificationStatus: 'active', verificationExpiresAt: now - 1,
  }, now), { isVerified: false, verificationTier: 'none' }, 'past expiry is inactive');
  assert.deepEqual(resolveLalaoUserVerification({
    verificationTier: 'creator', verificationStatus: 'active', verificationExpiresAt: now + 1,
  }, now), { isVerified: true, verificationTier: 'creator' }, 'future expiry remains active');
  assert.deepEqual(resolveLalaoUserVerification({ verificationTier: 'none', verificationStatus: 'active' }, now), {
    isVerified: false, verificationTier: 'none',
  }, 'the none tier never grants a badge');
}

{
  const { repo } = repository({
    async findLinkedUserIds() { return ['user_creator']; },
    async findUserById(userId) {
      return { _id: userId, verificationTier: 'creator', verificationStatus: 'active', verificationExpiresAt: Date.now() + 60_000 };
    },
  });
  const result = await resolveCurrentUser(principal(), repo);
  assert.equal(result.status, 200);
  const userBody = result.body as Record<string, unknown> | null;
  assert.deepEqual(
    { isVerified: userBody?.isVerified, verificationTier: userBody?.verificationTier },
    { isVerified: true, verificationTier: 'creator' },
    'the authenticated current-user response includes the live verification projection',
  );
}

{
  const { repo } = repository({
    async findLinkedUserIds() { return ['user_linked']; },
    async findLegacyUserIds() { return ['user_legacy']; },
  });
  const result = await resolveCurrentUser(principal(), repo);
  assert.equal(result.status, 409, 'explicit and legacy mappings to different users fail closed');
}

{
  const { repo } = repository({
    async findLinkedUserIds() { return ['user_linked']; },
    async findLegacyUserIds() { return ['user_linked']; },
    async findUserById(userId) { return { _id: userId }; },
  });
  const result = await resolveCurrentUser(principal(), repo);
  assert.equal(result.status, 200, 'matching explicit and legacy mappings resolve to one user');
}

{
  const { repo, calls } = repository({
    async findLegacyUserIds(identifier) { calls.push(`legacy:${identifier}`); return ['user_legacy']; },
    async findUserById(userId) { return { _id: userId, avatar: 'https://images.example/old.png' }; },
  });
  const result = await resolveCurrentUser(principal(), repo);
  assert.equal(result.status, 200);
  assert.ok(calls.includes(`legacy:${FIREBASE_ISSUER}|firebase-subject`));
}

{
  const { repo } = repository({ async findLinkedUserIds() { return ['one', 'two']; } });
  assert.equal((await resolveCurrentUser(principal(), repo)).status, 409, 'ambiguous provider identity fails closed');
}

{
  const { repo, calls } = repository();
  const result = await resolveCurrentUser(principal({ provider: 'playsole', issuer: PLAYSOLE_ISSUER, audience: 'lalao' }), repo);
  assert.equal(result.status, 200);
  assert.equal(result.body, null);
  assert.equal(calls.length, 2, 'unmapped identity may be looked up but middleware must reject its business operation');
}

console.log('Supabase current-user tests passed (identity mapping consistency, avatar projection, and live verification parity).');
