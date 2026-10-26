import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decidePlaysoleLogin,
  FIREBASE_ISSUER,
  isAuthLinkChallengeValid,
  PLAYSOLE_ISSUER,
  providerForIssuer,
} from '../../convex/lib/authLinkPolicy';

test('only configured issuers map to supported authentication providers', () => {
  assert.equal(providerForIssuer(FIREBASE_ISSUER), 'firebase');
  assert.equal(providerForIssuer(PLAYSOLE_ISSUER), 'playsole');
  assert.equal(providerForIssuer('https://attacker.example'), null);
});

test('an explicit immutable identity mapping remains usable without an email claim', () => {
  assert.equal(decidePlaysoleLogin({
    explicitMapping: true,
    legacyIdentityOwner: false,
    verifiedEmail: false,
    hasEmail: false,
    emailOwnerExists: false,
    emailOwnerIsLegacyIdentityOwner: false,
  }), 'ready');
});

test('an already known immutable provider identity does not depend on its email claim', () => {
  assert.equal(decidePlaysoleLogin({
    explicitMapping: false,
    legacyIdentityOwner: true,
    verifiedEmail: false,
    hasEmail: true,
    emailOwnerExists: false,
    emailOwnerIsLegacyIdentityOwner: false,
  }), 'ready');
});

test('an unverified matching email cannot discover or take over an existing account', () => {
  assert.equal(decidePlaysoleLogin({
    explicitMapping: false,
    legacyIdentityOwner: false,
    verifiedEmail: false,
    hasEmail: true,
    emailOwnerExists: true,
    emailOwnerIsLegacyIdentityOwner: false,
  }), 'email_verification_required');
});

test('a verified matching email requests authenticated linking instead of merging', () => {
  assert.equal(decidePlaysoleLogin({
    explicitMapping: false,
    legacyIdentityOwner: false,
    verifiedEmail: true,
    hasEmail: true,
    emailOwnerExists: true,
    emailOwnerIsLegacyIdentityOwner: false,
  }), 'link_required');
});

test('a verified provider identity with no collision can register once', () => {
  assert.equal(decidePlaysoleLogin({
    explicitMapping: false,
    legacyIdentityOwner: false,
    verifiedEmail: true,
    hasEmail: true,
    emailOwnerExists: false,
    emailOwnerIsLegacyIdentityOwner: false,
  }), 'create');
});

test('link challenges are single-use, time-limited, and bound to the requested provider', () => {
  const valid = {
    exists: true,
    consumed: false,
    expiresAt: 1_100,
    now: 1_000,
    requestedProvider: 'playsole' as const,
    authenticatedProvider: 'playsole' as const,
  };
  assert.equal(isAuthLinkChallengeValid(valid), true);
  assert.equal(isAuthLinkChallengeValid({ ...valid, consumed: true }), false);
  assert.equal(isAuthLinkChallengeValid({ ...valid, expiresAt: 999 }), false);
  assert.equal(isAuthLinkChallengeValid({ ...valid, authenticatedProvider: 'firebase' }), false);
});
