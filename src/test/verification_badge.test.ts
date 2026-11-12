import { test } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getActiveSubscriptionTier, normalizeTier, VerificationBadge } from '../components/common/VerificationBadge';
import { UserIdentity } from '../components/common/UserIdentity';
import { resolveUserVerification } from '../../convex/social';

test('normalizeTier correctly parses and normalizes verification tiers', () => {
  assert.strictEqual(normalizeTier('creator_premium'), 'creator');
  assert.strictEqual(normalizeTier('Tier 5 — Creator Premium'), 'none');
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

test('server-confirmed active premium users receive a badge beside their display name', () => {
  const activeUser = {
    name: 'Providence Osiobe',
    username: 'providence',
    isVerified: true,
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
    verificationExpiresAt: Date.now() + 60_000,
  };
  const markup = renderToStaticMarkup(React.createElement(UserIdentity, { user: activeUser, badgeSize: 'xs' }));
  assert.match(markup, /Providence Osiobe/);
  assert.match(markup, /aria-label="Verified account"/);
  assert.match(markup, /shrink-0/);
  assert.match(markup, /truncate/);
  assert.strictEqual((markup.match(/aria-label="Verified account"/g) || []).length, 1);
  assert.strictEqual(getActiveSubscriptionTier(activeUser), 'creator');
});

test('unverified or client-only premium flags do not display a badge', () => {
  const clientFlagsOnly = {
    name: 'Unverified User',
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
    hasActiveSubscription: true,
  };
  const markup = renderToStaticMarkup(React.createElement(UserIdentity, { user: clientFlagsOnly }));
  assert.doesNotMatch(markup, /Verified account/);
  assert.strictEqual(getActiveSubscriptionTier(clientFlagsOnly), 'none');
  assert.strictEqual(getActiveSubscriptionTier({ isVerified: true }), 'none');
});

test('historical posts use the author current verification status', () => {
  const activeAuthor = {
    name: 'Verified User',
    username: 'verifieduser',
    ...resolveUserVerification({
      verificationTier: 'priority',
      verificationStatus: 'active',
      verificationExpiresAt: Date.now() + 60_000,
    }),
  };
  const expiredAuthor = {
    name: 'Formerly Verified User',
    username: 'formeruser',
    ...resolveUserVerification({
      verificationTier: 'priority',
      verificationStatus: 'active',
      verificationExpiresAt: Date.now() - 60_000,
    }),
  };
  const historicalPost = {
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    author: activeAuthor,
  };

  assert.ok(Date.parse(historicalPost.createdAt) < Date.now());
  assert.match(renderToStaticMarkup(React.createElement(VerificationBadge, { user: historicalPost.author })), /Verified account/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(VerificationBadge, { user: expiredAuthor })), /Verified account/);
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(VerificationBadge, { user: { verificationTier: 'priority' } })),
    /Verified account/
  );
});

test('expired and cancelled subscriptions lose verification; renewed active subscriptions restore it', () => {
  const expiredUser = {
    isVerified: true,
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
    verificationExpiresAt: Date.now() - 5000,
  };
  const cancelledUser = {
    isVerified: true,
    verificationTier: 'creator' as const,
    verificationStatus: 'cancelled' as const,
  };
  const renewedUser = {
    isVerified: true,
    verificationTier: 'creator' as const,
    verificationStatus: 'active' as const,
    verificationExpiresAt: Date.now() + 60_000,
  };

  assert.strictEqual(getActiveSubscriptionTier(expiredUser), 'none');
  assert.strictEqual(getActiveSubscriptionTier(cancelledUser), 'none');
  assert.strictEqual(getActiveSubscriptionTier(renewedUser), 'creator');
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(VerificationBadge, { user: expiredUser })), /Verified account/);
  assert.match(renderToStaticMarkup(React.createElement(VerificationBadge, { user: renewedUser })), /Verified account/);
});

test('backend verification projection rejects inactive and expired entitlements', () => {
  assert.deepStrictEqual(
    resolveUserVerification({ verificationTier: 'creator', verificationStatus: 'active', verificationExpiresAt: Date.now() + 60_000 }),
    { isVerified: true, verificationTier: 'creator' }
  );
  assert.deepStrictEqual(
    resolveUserVerification({ verificationTier: 'creator', verificationStatus: 'cancelled' }),
    { isVerified: false, verificationTier: 'none' }
  );
  assert.deepStrictEqual(
    resolveUserVerification({ verificationTier: 'priority', verificationStatus: 'active', verificationExpiresAt: Date.now() - 1 }),
    { isVerified: false, verificationTier: 'none' }
  );
});
