import { test } from 'node:test';
import assert from 'node:assert';
import { getActiveSubscriptionTier, normalizeTier } from '../components/common/VerificationBadge';
import { resolveUserVerification } from '../../convex/social';

test('normalizeTier correctly parses and normalizes verification tiers', () => {
  assert.strictEqual(normalizeTier('creator_premium'), 'creator');
  assert.strictEqual(normalizeTier('Tier 5 — Creator Premium'), 'none'); // raw display string
  assert.strictEqual(normalizeTier('tier_5'), 'creator');
  assert.strictEqual(normalizeTier('tier 5'), 'creator');
  assert.strictEqual(normalizeTier('creator'), 'creator');
  assert.strictEqual(normalizeTier('priority'), 'priority');
  assert.strictEqual(normalizeTier('tier_4'), 'priority');
  assert.strictEqual(normalizeTier('tier_3'), 'verified');
  assert.strictEqual(normalizeTier('verified'), 'verified');
  assert.strictEqual(normalizeTier('none'), 'none');
  assert.strictEqual(normalizeTier(undefined), 'none');
  assert.strictEqual(normalizeTier(null), 'none');
});

test('getActiveSubscriptionTier correctly resolves active creator subscription', () => {
  const userWithActiveTier = {
    id: 'user_123',
    name: 'Providence Osiobe',
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
  };
  assert.strictEqual(getActiveSubscriptionTier(userWithActiveTier), 'creator');
});

test('getActiveSubscriptionTier correctly resolves creator_premium and subscription object', () => {
  const userWithSubObj = {
    id: 'user_456',
    name: 'Providence Osiobe',
    subscription: {
      status: 'active' as const,
      tier: 'creator_premium' as const,
    },
  };
  assert.strictEqual(getActiveSubscriptionTier(userWithSubObj), 'creator');
});

test('getActiveSubscriptionTier handles boolean verified fallback and creatorCategory', () => {
  const verifiedUser = {
    id: 'user_789',
    name: 'John Doe',
    isVerified: true,
  };
  assert.strictEqual(getActiveSubscriptionTier(verifiedUser), 'verified');

  const creatorUser = {
    id: 'user_999',
    name: 'Jane Doe',
    verified: true,
    creatorCategory: 'TECH',
  };
  assert.strictEqual(getActiveSubscriptionTier(creatorUser), 'creator');
});

test('getActiveSubscriptionTier rejects expired and cancelled subscriptions', () => {
  const expiredUser = {
    id: 'user_exp',
    name: 'Expired User',
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
    verificationExpiresAt: Date.now() - 5000,
  };
  assert.strictEqual(getActiveSubscriptionTier(expiredUser), 'none');

  const cancelledUser = {
    id: 'user_cancel',
    name: 'Cancelled User',
    verificationTier: 'creator' as const,
    verificationStatus: 'cancelled' as const,
  };
  assert.strictEqual(getActiveSubscriptionTier(cancelledUser), 'none');
});

test('resolveUserVerification in convex/social correctly derives verification for user profile', () => {
  const rawConvexUser = {
    _id: 'convex_user_1',
    name: 'Providence Osiobe',
    verificationTier: 'creator',
    verificationStatus: 'active',
  };
  const resolved = resolveUserVerification(rawConvexUser);
  assert.strictEqual(resolved.isVerified, true);
  assert.strictEqual(resolved.verificationTier, 'creator');
});
