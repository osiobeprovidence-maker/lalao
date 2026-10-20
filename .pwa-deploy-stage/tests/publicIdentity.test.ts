import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicIdentityLabel } from '../src/components/common/UserIdentity';

test('User Public Identity Display Preference', async (t) => {
  await t.test('Option A: Display Name preference returns display name and hides username', () => {
    const userA = {
      name: 'Somtochukwu Jasper',
      username: 'jasper',
      publicIdentityType: 'display_name' as const,
    };

    const label = getPublicIdentityLabel(userA);
    assert.equal(label, 'Somtochukwu Jasper');
    assert.notEqual(label, 'jasper');
    assert.notEqual(label, '@jasper');
  });

  await t.test('Option B: Username preference returns username without @ prefix and hides display name', () => {
    const userB = {
      name: 'John Example',
      username: 'johnexample',
      publicIdentityType: 'username' as const,
    };

    const label = getPublicIdentityLabel(userB);
    assert.equal(label, 'johnexample');
    assert.notEqual(label, 'John Example');
    assert.notEqual(label, '@johnexample');
  });

  await t.test('Strip leading @ from username if stored with @', () => {
    const userWithAt = {
      name: 'Jasper King',
      username: '@jasperking',
      publicIdentityType: 'username' as const,
    };

    const label = getPublicIdentityLabel(userWithAt);
    assert.equal(label, 'jasperking');
  });

  await t.test('Default migration behavior: defaults to display name when publicIdentityType is unset', () => {
    const legacyUser = {
      name: 'Amaka Bello',
      username: 'amakab',
    };

    const label = getPublicIdentityLabel(legacyUser);
    assert.equal(label, 'Amaka Bello');
  });

  await t.test('Safe fallback: fallback to username if display name is empty', () => {
    const userMissingName = {
      name: '',
      username: 'warricoder',
      publicIdentityType: 'display_name' as const,
    };

    const label = getPublicIdentityLabel(userMissingName);
    assert.equal(label, 'warricoder');
  });

  await t.test('Safe fallback: fallback to display name if username is empty under username preference', () => {
    const userMissingUsername = {
      name: 'Delta Star',
      username: '',
      publicIdentityType: 'username' as const,
    };

    const label = getPublicIdentityLabel(userMissingUsername);
    assert.equal(label, 'Delta Star');
  });

  await t.test('Safe fallback: fallback label if both are missing or user is null', () => {
    assert.equal(getPublicIdentityLabel(null), 'User');
    assert.equal(getPublicIdentityLabel(undefined, 'Anonymous'), 'Anonymous');
    assert.equal(getPublicIdentityLabel({ name: '', username: '' }), 'User');
  });
});
