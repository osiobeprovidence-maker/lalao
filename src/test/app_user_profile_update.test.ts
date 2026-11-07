import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-user/index.ts'), 'utf8')
  .replace("import { withLalaoAuth, type LalaoAuthContext } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__profileTestWithAuth;')
  .replace("import { FIREBASE_ISSUER, parseProvisioningClaims } from '../_shared/currentUser.ts';", 'const { FIREBASE_ISSUER, parseProvisioningClaims } = globalThis.__profileTestCurrentUser;')
  .replace("import { projectPublicUserProfile, publicUserProfileSelect } from '../_shared/publicUserProfile.ts';", 'const { projectPublicUserProfile, publicUserProfileSelect } = globalThis.__profileTestPublicProfile;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __profileTestWithAuth?: (handler: unknown) => unknown;
  __profileTestCurrentUser?: unknown;
  __profileTestPublicProfile?: unknown;
};
globals.__profileTestWithAuth = (handler) => handler;
globals.__profileTestCurrentUser = await import('../../supabase/functions/_shared/currentUser');
globals.__profileTestPublicProfile = await import('../../supabase/functions/_shared/publicUserProfile');
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__profileTestWithAuth;
  delete globals.__profileTestCurrentUser;
  delete globals.__profileTestPublicProfile;
}

type RpcCall = { name: string; args: Record<string, unknown> };
let rpcResult: { data: unknown; error: { code?: string; message?: string } | null } = {
  data: 'profile-owner-a',
  error: null,
};
const rpcCalls: RpcCall[] = [];
let cleanupJobs: Array<{ id: number; cloudinary_public_id: string; attempts: number }> = [];
const cleanupUpdates: Record<string, unknown>[] = [];
const userProfileUpdates: Record<string, unknown>[] = [];
let duplicatePhone: Record<string, unknown> | null = null;
const admin = {
  async rpc(name: string, args: Record<string, unknown>) {
    rpcCalls.push({ name, args });
    return rpcResult;
  },
  from(table: string) {
    const query: any = {
      select() { return query; },
      eq() { return query; },
      is() { return query; },
      order() { return query; },
      limit() { return table === 'users' ? query : Promise.resolve({ data: cleanupJobs, error: null }); },
      update(values: Record<string, unknown>) {
        if (table === 'users') userProfileUpdates.push(values);
        else cleanupUpdates.push(values);
        return query;
      },
      or() { return query; },
      neq() { return query; },
      async maybeSingle() { return { data: duplicatePhone, error: null }; },
      then(resolve: (value: { error: null }) => unknown, reject: (reason: unknown) => unknown) {
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
const originalDeno = (globalThis as typeof globalThis & { Deno?: unknown }).Deno;
(globalThis as typeof globalThis & { Deno?: unknown }).Deno = {
  env: {
    get(name: string) {
      return ({
        CLOUDINARY_CLOUD_NAME: 'synthetic-cloud',
        CLOUDINARY_API_KEY: 'synthetic-key',
        CLOUDINARY_API_SECRET: 'synthetic-secret',
      } as Record<string, string>)[name];
    },
  },
};

async function postOperation(
  operation: string,
  payload?: unknown,
  currentUser: Record<string, unknown> | null = { _id: 'profile-owner-a' },
) {
  return appUser.fetch(new Request('http://local/functions/v1/app-user', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation, payload }),
  }), { supabaseAdmin: admin, principal, currentUser });
}

async function post(payload: unknown, currentUser: Record<string, unknown> | null = { _id: 'profile-owner-a' }) {
  return postOperation('updateUserProfile', payload, currentUser);
}

const fullUpdate = await post({
  name: 'Updated Name',
  username: 'CaseSensitive',
  bio: 'Synthetic biography',
  locationName: 'Synthetic location',
  avatarUrl: 'https://res.cloudinary.com/synthetic-cloud/image/upload/v123/avatars/profile-owner-a/avatar-1.png',
  avatarCloudinaryPublicId: 'avatars/profile-owner-a/avatar-1',
  publicIdentityType: 'both',
  dateOfBirth: '2000-01-02',
  birthDateVisibility: 'age_only',
});
assert.equal(fullUpdate.status, 200);
assert.deepEqual(await fullUpdate.json(), { userId: 'profile-owner-a', avatarCleanupPending: false });
assert.equal(rpcCalls.at(-1)?.name, 'update_lalao_user_profile');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, 'profile-owner-a');
assert.equal((rpcCalls.at(-1)?.args.p_payload as Record<string, unknown>).username, 'CaseSensitive');

const partial = await post({ bio: 'Only this field' });
assert.equal(partial.status, 200);
assert.deepEqual(rpcCalls.at(-1)?.args.p_payload, { bio: 'Only this field' }, 'omitted fields remain omitted for SQL partial-update semantics');

for (const [countryCode, phoneCountryCode, phoneNumber] of [
  ['NG', '234', '+2348012345678'],
  ['KE', '254', '+254712345678'],
  ['GH', '233', '+233241234567'],
] as const) {
  const phoneSetup = await postOperation('updatePhoneSetup', {
    phoneNumber, countryCode, countryName: countryCode, phoneCountryCode,
  });
  assert.equal(phoneSetup.status, 200);
  assert.equal(await phoneSetup.json(), 'available');
  assert.equal(userProfileUpdates.at(-1)?.phone, phoneNumber);
  assert.equal(userProfileUpdates.at(-1)?.phoneNumber, phoneNumber);
  assert.equal(userProfileUpdates.at(-1)?.accessStatus, 'available');
}
const restrictedCountry = await postOperation('updatePhoneSetup', {
  phoneNumber: '+12025550123', countryCode: 'US', countryName: 'US', phoneCountryCode: '1',
});
assert.equal(restrictedCountry.status, 200);
assert.equal(await restrictedCountry.json(), 'country_restricted', 'other countries remain restricted');
assert.equal(userProfileUpdates.at(-1)?.accessStatus, 'country_restricted');
assert.equal(rpcCalls.some((call) => call.name === 'update_lalao_user_onboarding'), false,
  'phone setup persists through the authenticated Supabase profile path without the older NG-only RPC');
const phoneUpdateCount = userProfileUpdates.length;
assert.equal((await postOperation('updatePhoneSetup', {
  phoneNumber: '+254712345678', countryCode: 'KE', countryName: 'KE', phoneCountryCode: '233',
})).status, 400, 'calling-code mismatch rejected');
assert.equal(userProfileUpdates.length, phoneUpdateCount, 'invalid phone setup does not update profile');
duplicatePhone = { _id: 'another-user' };
assert.equal((await postOperation('updatePhoneSetup', {
  phoneNumber: '+254712345678', countryCode: 'KE', countryName: 'KE', phoneCountryCode: '254',
})).status, 409, 'duplicate phone number rejected');
duplicatePhone = null;
assert.equal((await postOperation('updatePhoneSetup', {
  phoneNumber: '07123', countryCode: 'KE', countryName: 'KE', phoneCountryCode: '254',
})).status, 400, 'invalid phone number rejected');

const beforeInvalid = rpcCalls.length;
const invalidType = await post({ bio: null });
assert.equal(invalidType.status, 400);
assert.equal(rpcCalls.length, beforeInvalid, 'invalid fields never reach the database');
assert.equal((await invalidType.json() as { error: string }).error, 'Invalid profile update.');
assert.equal((await post({ publicIdentityType: 'admin' })).status, 400);
assert.equal((await post({ userId: 'profile-owner-b', bio: 'cross-user' })).status, 400);
assert.equal((await post({
  avatarUrl: 'https://images.example.invalid/avatar.png',
  avatarCloudinaryPublicId: 'avatars/profile-owner-b/avatar-1',
})).status, 400);
assert.equal((await post({
  avatarUrl: 'https://images.example.invalid/avatar.png',
  avatarCloudinaryPublicId: 'avatars/profile-owner-a/avatar-1',
})).status, 400);
assert.equal((await post({
  avatarCloudinaryPublicId: 'avatars/profile-owner-a/avatar-1',
})).status, 400);
assert.equal(rpcCalls.length, beforeInvalid, 'invalid fields and cross-user avatar IDs never reach the database');

const duplicateBefore = rpcCalls.length;
rpcResult = { data: null, error: { code: '23505', message: 'Username already taken' } };
const duplicate = await post({ username: 'already_used' });
assert.equal(duplicate.status, 409);
assert.equal((await duplicate.json() as { error: string }).error, 'Username already taken');
assert.equal(rpcCalls.length, duplicateBefore + 1);
rpcResult = { data: 'profile-owner-a', error: null };

assert.equal((await post({ avatarStorageId: 'synthetic-convex-storage-id' })).status, 409);
assert.equal((await post({ avatarStorageId: null })).status, 409);
assert.deepEqual(
  (rpcCalls.at(-1)?.args.p_payload as Record<string, unknown>),
  { username: 'already_used' },
  'unsupported storage identifiers never reach the profile RPC',
);

const unauthorizedBefore = rpcCalls.length;
const unauthorized = await post({ bio: 'not authenticated' }, null);
assert.equal(unauthorized.status, 404);
assert.equal(rpcCalls.length, unauthorizedBefore, 'a missing identity-resolved profile cannot update');

const notificationPrefsResponse = await postOperation('updateNotificationPrefs', {
  prefs: { messages: false, likes: true },
});
assert.equal(notificationPrefsResponse.status, 200);
assert.equal(await notificationPrefsResponse.json(), null);
assert.equal(rpcCalls.at(-1)?.name, 'update_lalao_user_notification_preferences');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, 'profile-owner-a');
assert.deepEqual(rpcCalls.at(-1)?.args.p_prefs, { messages: false, likes: true });
const beforeInvalidPrefs = rpcCalls.length;
assert.equal((await postOperation('updateNotificationPrefs', {
  prefs: { userId: 'profile-owner-b' },
})).status, 400);
assert.equal((await postOperation('updateNotificationPrefs', {
  prefs: { messages: 'false' },
})).status, 400);
assert.equal(rpcCalls.length, beforeInvalidPrefs, 'invalid or cross-user preference fields never reach the database');

const feedInterestsResponse = await postOperation('updateInterests', { interests: ['anime', 'gaming'] });
assert.equal(feedInterestsResponse.status, 200);
assert.equal(rpcCalls.at(-1)?.name, 'update_lalao_user_onboarding');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, 'profile-owner-a');
assert.equal(rpcCalls.at(-1)?.args.p_operation, 'updateInterests');
assert.deepEqual(rpcCalls.at(-1)?.args.p_payload, { interests: ['anime', 'gaming'] });

const waitlistResponse = await postOperation('joinWaitlist', {});
assert.equal(waitlistResponse.status, 200);
assert.equal(await waitlistResponse.json(), 'profile-owner-a');
assert.equal(rpcCalls.at(-1)?.name, 'join_lalao_user_waitlist');
assert.deepEqual(rpcCalls.at(-1)?.args, { p_user_id: 'profile-owner-a' });
assert.equal((await postOperation('joinWaitlist', { userId: 'profile-owner-b' })).status, 400);
rpcResult = { data: null, error: { code: 'P0001', message: 'User is not country restricted' } };
const restrictedWaitlist = await postOperation('joinWaitlist', {});
assert.equal(restrictedWaitlist.status, 409);
assert.equal((await restrictedWaitlist.json() as { error: string }).error, 'User is not country restricted.');
rpcResult = { data: 'profile-owner-a', error: null };
const unauthenticatedWaitlistRpcCount = rpcCalls.length;
assert.equal((await postOperation('joinWaitlist', {}, null)).status, 404);
assert.equal(rpcCalls.length, unauthenticatedWaitlistRpcCount, 'a missing identity-resolved profile cannot join the waitlist');
rpcResult = { data: null, error: { code: 'P0002', message: 'Lalao profile not found' } };
assert.equal((await postOperation('updateNotificationPrefs', { prefs: {} })).status, 404);
rpcResult = { data: null, error: { code: 'XX000', message: 'synthetic database failure' } };
assert.equal((await postOperation('joinWaitlist', {})).status, 500);
assert.equal((await postOperation('updateNotificationPrefs', { prefs: {} })).status, 500);
rpcResult = { data: 'profile-owner-a', error: null };

try {
  const signatureResponse = await postOperation('createAvatarUploadSignature');
  assert.equal(signatureResponse.status, 200);
  const signature = await signatureResponse.json() as {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    publicId: string;
  };
  assert.match(signature.signature, /^[0-9a-f]{40}$/);
  assert.equal(signature.apiKey, 'synthetic-key');
  assert.equal(signature.cloudName, 'synthetic-cloud');
  assert.match(signature.publicId, /^avatars\/profile-owner-a\/[0-9a-f-]{36}$/);
  assert.equal('apiSecret' in signature, false);

  const originalFetch = globalThis.fetch;
  cleanupJobs = [{
    id: 21,
    cloudinary_public_id: 'avatars/profile-owner-a/old-avatar',
    attempts: 2,
  }];
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.cloudinary.com/v1_1/synthetic-cloud/image/destroy');
    assert.equal(init?.method, 'POST');
    return Response.json({ result: 'ok' });
  };
  try {
    const cleanupResponse = await post({ bio: 'Cleanup retry' });
    assert.equal(cleanupResponse.status, 200);
    assert.deepEqual(await cleanupResponse.json(), { userId: 'profile-owner-a', avatarCleanupPending: false });
    assert.equal(cleanupUpdates.at(-1)?.attempts, 3);
    assert.equal(typeof cleanupUpdates.at(-1)?.completed_at, 'string');
    assert.equal(cleanupUpdates.at(-1)?.last_error, null);

    cleanupJobs = [{
      id: 22,
      cloudinary_public_id: 'avatars/profile-owner-a/unavailable-avatar',
      attempts: 0,
    }];
    globalThis.fetch = async () => Response.json({ error: 'synthetic failure' }, { status: 500 });
    const failedCleanupResponse = await post({ bio: 'Cleanup pending' });
    assert.equal(failedCleanupResponse.status, 200);
    assert.deepEqual(await failedCleanupResponse.json(), { userId: 'profile-owner-a', avatarCleanupPending: true });
    assert.equal(cleanupUpdates.at(-1)?.attempts, 1);
    assert.equal(cleanupUpdates.at(-1)?.completed_at, null);
    assert.equal(cleanupUpdates.at(-1)?.last_error, 'cloudinary_delete_failed');
  } finally {
    globalThis.fetch = originalFetch;
    cleanupJobs = [];
  }
} finally {
  if (originalDeno === undefined) delete (globalThis as typeof globalThis & { Deno?: unknown }).Deno;
  else (globalThis as typeof globalThis & { Deno?: unknown }).Deno = originalDeno;
}

console.log('app-user tests passed (profile updates, notifications, waitlist, identity, scoped Cloudinary uploads, cleanup retries, and validation).');
