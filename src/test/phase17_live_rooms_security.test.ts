import assert from 'node:assert/strict';
import {
  applyPlaysoleRefreshResponse,
  PLAYSOLE_CONFIG,
  refreshPlaysoleSession,
  type PlaysoleSession,
} from '../lib/playsoleAuth';
import { getTokenForSelectedIdentity } from '../lib/selectedIdentityToken';
import { assertCloudinarySignatureRequest } from '../../convex/cloudinary';
import { requireAuthenticatedUploadIdentity } from '../../convex/lib/uploadSecurity';

const now = 1_800_000_000_000;
const encodeClaims = (claims: Record<string, unknown>) => Buffer.from(JSON.stringify(claims)).toString('base64url');
const makeIdToken = (sub: string, exp = Math.floor(now / 1000) + 3600) => `e30.${encodeClaims({
  iss: PLAYSOLE_CONFIG.issuer,
  aud: PLAYSOLE_CONFIG.clientId,
  sub,
  exp,
})}.signature`;
const session: PlaysoleSession = {
  accessToken: 'old-access',
  idToken: makeIdToken('playsole-user-1', Math.floor(now / 1000) - 1),
  refreshToken: 'refresh-secret-test-fixture',
  expiresAt: now - 1,
  user: { sub: 'playsole-user-1' },
};

const stillValid = { ...session, expiresAt: now + 10 * 60_000 };
let refreshCalls = 0;
assert.equal(await refreshPlaysoleSession(stillValid, async () => {
  refreshCalls += 1;
  throw new Error('must not refresh a valid token');
}, now), stillValid, 'a valid Playsole token remains the selected identity');
assert.equal(refreshCalls, 0, 'valid token does not perform an unnecessary refresh');

const refreshed = await refreshPlaysoleSession(session, async (refreshToken) => {
  assert.equal(refreshToken, session.refreshToken);
  return {
    access_token: 'new-access',
    id_token: makeIdToken('playsole-user-1'),
    refresh_token: 'rotated-refresh-test-fixture',
    expires_in: 3600,
  };
}, now);
assert.equal(refreshed.idToken, makeIdToken('playsole-user-1'));
assert.equal(refreshed.refreshToken, 'rotated-refresh-test-fixture');
assert.equal(refreshed.user.sub, session.user.sub, 'refresh preserves the selected Playsole subject');

await assert.rejects(
  refreshPlaysoleSession(session, async () => { throw new Error('provider unavailable'); }, now),
  /provider unavailable/,
  'failed refresh remains a failure and cannot fabricate a token',
);
assert.throws(() => applyPlaysoleRefreshResponse(session, {
  access_token: 'new-access',
  id_token: makeIdToken('different-user'),
  expires_in: 3600,
}, now), /did not match the active account/, 'a token for another Playsole subject is rejected');

let firebaseCalls = 0;
assert.equal(await getTokenForSelectedIdentity({
  playsoleSelected: false,
  getPlaysoleToken: async () => { throw new Error('should not call Playsole'); },
  getFirebaseToken: async () => { firebaseCalls += 1; return 'firebase-id-token'; },
}), 'firebase-id-token', 'Firebase-only login keeps using its Firebase token');
assert.equal(firebaseCalls, 1);
firebaseCalls = 0;
assert.equal(await getTokenForSelectedIdentity({
  playsoleSelected: true,
  getPlaysoleToken: async () => 'playsole-id-token',
  getFirebaseToken: async () => { firebaseCalls += 1; return 'wrong-provider-token'; },
}), 'playsole-id-token', 'valid Playsole authentication remains the active identity');
assert.equal(firebaseCalls, 0);
await assert.rejects(getTokenForSelectedIdentity({
  playsoleSelected: true,
  getPlaysoleToken: async () => { throw new Error('Playsole reauthentication required'); },
  getFirebaseToken: async () => { firebaseCalls += 1; return 'wrong-provider-token'; },
}), /Playsole reauthentication required/);
assert.equal(firebaseCalls, 0, 'a Playsole failure never falls through to Firebase');

for (const folder of ['posts', 'avatars', 'pages', 'products', 'ads', 'plum-photos', 'plum-vault']) {
  assertCloudinarySignatureRequest(folder, 'image', { authenticated: true, role: 'user' });
}
assertCloudinarySignatureRequest('chatrooms', 'image', { authenticated: true, role: 'admin' });
assertCloudinarySignatureRequest('branding', 'image', { authenticated: true, role: 'editor' });
assert.throws(() => assertCloudinarySignatureRequest('chatrooms', 'image', { authenticated: true, role: 'editor' }), /Administrator access/);
assert.throws(() => assertCloudinarySignatureRequest('branding', 'image', { authenticated: true, role: 'user' }), /Administrator access/);
assert.throws(() => assertCloudinarySignatureRequest('arbitrary-folder', 'image', { authenticated: true, role: 'admin' }), /folder is not permitted/);
assert.throws(() => assertCloudinarySignatureRequest('avatars', 'video', { authenticated: true, role: 'user' }), /Only image uploads/);
assert.throws(() => assertCloudinarySignatureRequest('avatars', 'image', { authenticated: false, role: undefined }), /Authentication is required/);

const identity = { subject: 'verified-test-identity' };
assert.equal(await requireAuthenticatedUploadIdentity({ auth: { getUserIdentity: async () => identity } }), identity,
  'authenticated fallback uploads retain their existing workflow');
await assert.rejects(requireAuthenticatedUploadIdentity({ auth: { getUserIdentity: async () => null } }), /Authentication is required/,
  'unauthenticated fallback upload requests are rejected');

console.log('Phase 17 authentication and upload authorization policies passed.');
