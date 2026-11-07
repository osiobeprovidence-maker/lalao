import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-user/index.ts'), 'utf8')
  .replace("import { withLalaoAuth, type LalaoAuthContext } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__publicProfileTestWithAuth;')
  .replace("import { FIREBASE_ISSUER, parseProvisioningClaims } from '../_shared/currentUser.ts';", 'const { FIREBASE_ISSUER, parseProvisioningClaims } = globalThis.__publicProfileTestCurrentUser;')
  .replace("import { projectPublicUserProfile, publicUserProfileSelect } from '../_shared/publicUserProfile.ts';", 'const { projectPublicUserProfile, publicUserProfileSelect } = globalThis.__publicProfileTestProjection;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __publicProfileTestWithAuth?: (handler: unknown) => unknown;
  __publicProfileTestCurrentUser?: unknown;
  __publicProfileTestProjection?: unknown;
};
globals.__publicProfileTestWithAuth = (handler) => handler;
globals.__publicProfileTestCurrentUser = await import('../../supabase/functions/_shared/currentUser');
globals.__publicProfileTestProjection = await import('../../supabase/functions/_shared/publicUserProfile');
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__publicProfileTestWithAuth;
  delete globals.__publicProfileTestCurrentUser;
  delete globals.__publicProfileTestProjection;
}

const { projectPublicUserProfile, publicUserProfileSelect } = await import('../../supabase/functions/_shared/publicUserProfile');
const userFixture = {
  _id: 'public-profile-user',
  name: 'Public Profile',
  username: 'exactCase',
  avatarUrl: 'https://images.example.invalid/avatar.png',
  bio: 'A public bio',
  pronouns: 'they/them',
  userType: 'person',
  locationName: 'Warri',
  latitude: 5.5,
  longitude: 5.7,
  followersCount: 12,
  followingCount: 9,
  publicIdentityType: 'both',
  dateOfBirth: '2000-11-04',
  birthDateVisibility: 'age_only',
  email: 'private@example.invalid',
  emailNormalized: 'private@example.invalid',
  phone: '+2348000000000',
  phoneNumber: '+2348000000000',
  phoneVerified: true,
  role: 'admin',
  tokenIdentifier: 'private-token',
  notificationPrefs: { messages: false },
  walletBalance: 12345,
  suspended: false,
  verificationTier: 'verified',
  verificationStatus: 'active',
  verificationExpiresAt: 1_800_000_000_000,
  creatorType: 'manga',
  creatorAccountStatus: 'active',
  mangaPublisherName: 'Public Manga',
  mangaCreatorAbout: 'Public creator details',
  creatorEarnings: 9999,
  creatorPendingEarnings: 400,
};

const projected = projectPublicUserProfile(userFixture, new Date('2026-11-03T12:00:00Z'));
assert.ok(projected);
assert.equal(projected.username, 'exactCase');
assert.equal(projected._id, 'public-profile-user');
assert.equal(projected.avatar, userFixture.avatarUrl);
assert.equal(projected.age, 25);
assert.equal('dateOfBirth' in projected, false, 'age-only visibility never exposes the exact birth date');
for (const sensitiveField of [
  'email', 'emailNormalized', 'phone', 'phoneNumber', 'phoneVerified', 'role',
  'tokenIdentifier', 'notificationPrefs', 'walletBalance', 'creatorEarnings',
  'creatorPendingEarnings', 'latitude', 'longitude', 'suspended', 'creatorAccountStatus',
  'verificationStatus', 'verificationExpiresAt',
]) {
  assert.equal(sensitiveField in projected, false, `${sensitiveField} is never returned`);
}

const privateBirthday = projectPublicUserProfile({
  ...userFixture,
  birthDateVisibility: 'private',
}, new Date('2026-11-03T12:00:00Z'));
assert.ok(privateBirthday);
assert.equal('dateOfBirth' in privateBirthday, false);
assert.equal('age' in privateBirthday, false);

const publicBirthday = projectPublicUserProfile({
  ...userFixture,
  birthDateVisibility: 'public',
}, new Date('2026-11-03T12:00:00Z'));
assert.ok(publicBirthday);
assert.equal(publicBirthday.dateOfBirth, userFixture.dateOfBirth);

assert.equal(projectPublicUserProfile({ ...userFixture, suspended: true }), null);
const suspendedCreator = projectPublicUserProfile({ ...userFixture, creatorAccountStatus: 'suspended' });
assert.ok(suspendedCreator);
assert.equal('creatorType' in suspendedCreator, false);
assert.equal('mangaPublisherName' in suspendedCreator, false);
const closedCreator = projectPublicUserProfile({ ...userFixture, creatorAccountStatus: 'closed' });
assert.ok(closedCreator);
assert.equal('creatorType' in closedCreator, false);

type QueryCall = { table: string; selected: string; column: string; value: unknown };
const queryCalls: QueryCall[] = [];
let profileRow: Record<string, unknown> | null = userFixture;
let profileQueryError: { message: string } | null = null;
const admin = {
  from(table: string) {
    const query: any = {
      select(selected: string) {
        query.selected = selected;
        return query;
      },
      eq(column: string, value: unknown) {
        query.column = column;
        query.value = value;
        return query;
      },
      async maybeSingle() {
        queryCalls.push({
          table,
          selected: query.selected,
          column: query.column,
          value: query.value,
        });
        return {
          data: profileRow?.username === query.value ? profileRow : null,
          error: profileQueryError,
        };
      },
      update() { return query; },
      then(resolve: (result: { error: null }) => unknown, reject: (reason: unknown) => unknown) {
        return Promise.resolve({ error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
const appUser = (mod.exports.default ?? mod.exports) as {
  fetch(request: Request, context: unknown): Promise<Response>;
};
const principal = {
  provider: 'firebase',
  issuer: 'https://securetoken.google.com/uselalaoapp',
  subject: 'synthetic-profile-subject',
  audience: 'uselalaapp',
  issuedAt: 100,
  expiresAt: 200,
  email: 'synthetic@example.invalid',
  emailVerified: true,
  name: 'Synthetic',
  picture: null,
  firebaseSignInProvider: 'password',
};

async function post(operation: string, payload: unknown, currentUser: Record<string, unknown> | null = { _id: 'requester-user' }) {
  return appUser.fetch(new Request('http://local/functions/v1/app-user', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation, payload }),
  }), { supabaseAdmin: admin, principal, currentUser });
}

const publicResponse = await post('getUserByUsername', { username: 'exactCase' });
assert.equal(publicResponse.status, 200);
const publicBody = await publicResponse.json() as Record<string, unknown>;
assert.equal(publicBody.username, 'exactCase');
const birthDate = new Date('2000-11-04');
  const now = new Date();
  let expectedAge = now.getFullYear() - birthDate.getFullYear();
  if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
    expectedAge -= 1;
  }
  assert.equal(publicBody.age, expectedAge);
assert.equal('dateOfBirth' in publicBody, false);
assert.equal(queryCalls.at(-1)?.table, 'users');
assert.equal(queryCalls.at(-1)?.column, 'username');
assert.equal(queryCalls.at(-1)?.value, 'exactCase');
assert.equal(queryCalls.at(-1)?.selected, publicUserProfileSelect);
assert.equal(queryCalls.at(-1)?.selected.includes('email'), false);

assert.equal(await (await post('getUserByUsername', { username: 'exactcase' })).json(), null);

profileRow = null;
assert.equal(await (await post('getUserByUsername', { username: 'missing' })).json(), null);
assert.equal(queryCalls.at(-1)?.value, 'missing');

profileRow = { ...userFixture, suspended: true };
assert.equal(await (await post('getUserByUsername', { username: 'exactCase' })).json(), null);

const queryCountBeforeInvalid = queryCalls.length;
assert.equal((await post('getUserByUsername', { username: 'exactCase', userId: 'other-user' })).status, 400);
assert.equal((await post('getUserByUsername', { username: 42 })).status, 400);
assert.equal(queryCalls.length, queryCountBeforeInvalid, 'invalid and caller-supplied identity fields never query users');

const queryCountBeforeUnauthenticated = queryCalls.length;
assert.equal((await post('getUserByUsername', { username: 'exactCase' }, null)).status, 404);
assert.equal(queryCalls.length, queryCountBeforeUnauthenticated, 'unmapped callers cannot retrieve profiles through the Edge Function');

profileQueryError = { message: 'synthetic database failure' };
assert.equal((await post('getUserByUsername', { username: 'exactCase' })).status, 500);
profileQueryError = null;

console.log('app-user public profile tests passed (allowlist, username matching, DOB visibility, suspended accounts, and identity-bound access).');
