import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-user/index.ts'), 'utf8')
  .replace("import { withLalaoAuth, type LalaoAuthContext } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__userTestWithAuth;')
  .replace("import { FIREBASE_ISSUER, parseProvisioningClaims } from '../_shared/currentUser.ts';", 'const { FIREBASE_ISSUER, parseProvisioningClaims } = globalThis.__userTestCurrentUser;')
  .replace("import { projectPublicUserProfile, publicUserProfileSelect } from '../_shared/publicUserProfile.ts';", 'const { projectPublicUserProfile, publicUserProfileSelect } = globalThis.__userTestPublicProfile;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __userTestWithAuth?: (handler: unknown) => unknown;
  __userTestCurrentUser?: unknown;
  __userTestPublicProfile?: unknown;
};
globals.__userTestWithAuth = (handler) => handler;
globals.__userTestCurrentUser = await import('../../supabase/functions/_shared/currentUser');
globals.__userTestPublicProfile = await import('../../supabase/functions/_shared/publicUserProfile');
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__userTestWithAuth;
  delete globals.__userTestCurrentUser;
  delete globals.__userTestPublicProfile;
}
const appUser = (mod.exports.default ?? mod.exports) as { fetch(request: Request, context: unknown): Promise<Response> };
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
const admin = { async rpc(name: string, args: Record<string, unknown>) { rpcCalls.push({ name, args }); return { data: 'synthetic-lalao-user', error: null }; } };

async function post(body: unknown, principal: Record<string, unknown>, currentUser: Record<string, unknown> | null = null) {
  return appUser.fetch(new Request('http://local/functions/v1/app-user', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }), { supabaseAdmin: admin, principal, currentUser });
}

const verifiedPrincipal = {
  provider: 'firebase', issuer: 'https://securetoken.google.com/uselalaoapp', subject: 'synthetic-firebase-subject',
  audience: 'uselalaapp', issuedAt: 100, expiresAt: 200, email: 'synthetic@example.invalid',
  name: 'Synthetic', picture: null, firebaseSignInProvider: 'password',
};

const unverified = await post({ operation: 'createUserRecord', payload: { admin: true } }, { ...verifiedPrincipal, emailVerified: false });
assert.equal(unverified.status, 200, await unverified.clone().text());
assert.equal(rpcCalls.at(-1)?.name, 'ensure_lalao_user_for_identity');
assert.equal(rpcCalls.at(-1)?.args.p_email_verified, false, 'unverified provider email cannot be represented as verified by provisioning');
assert.equal(rpcCalls.at(-1)?.args.p_issuer, verifiedPrincipal.issuer);

const verified = await post({ operation: 'createUserRecord' }, { ...verifiedPrincipal, emailVerified: true });
assert.equal(verified.status, 200);
assert.equal(rpcCalls.at(-1)?.args.p_email_verified, true, 'verified provider claim is preserved for database policy');

const update = await post({ operation: 'updateProfile', payload: { userId: 'user-b', name: 'Change' } }, verifiedPrincipal, { _id: 'user-a' });
assert.equal(update.status, 200);
assert.equal(rpcCalls.at(-1)?.name, 'update_lalao_user_onboarding');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, 'user-a', 'profile update owner is the middleware resolved identity');
assert.equal((rpcCalls.at(-1)?.args.p_payload as Record<string, unknown>).userId, 'user-b', 'client field remains data and cannot change RPC owner');

// updateUserPhone: identity-resolved owner, client cannot change user
const phoneUpdate = await post({ operation: 'updateUserPhone', payload: { phoneNumber: '+2348012345678' } }, verifiedPrincipal, { _id: 'user-x' });
assert.equal(phoneUpdate.status, 200, await phoneUpdate.clone().text());
assert.equal(rpcCalls.at(-1)?.name, 'update_lalao_user_phone');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, 'user-x', 'phone update owner is the middleware resolved identity');
assert.equal(rpcCalls.at(-1)?.args.p_phone_number, '+2348012345678');

// Reject invalid payload: missing phoneNumber
const badPayload = await post({ operation: 'updateUserPhone', payload: {} }, verifiedPrincipal, { _id: 'user-x' });
assert.equal(badPayload.status, 400, 'missing phoneNumber rejected');

// Reject invalid payload: extra field
const extraField = await post({ operation: 'updateUserPhone', payload: { phoneNumber: '+2348012345678', userId: 'user-y' } }, verifiedPrincipal, { _id: 'user-x' });
assert.equal(extraField.status, 400, 'extra fields rejected');

// Unauthenticated currentUser rejected
const noUser = await post({ operation: 'updateUserPhone', payload: { phoneNumber: '+2348012345678' } }, verifiedPrincipal, null);
assert.equal(noUser.status, 404, 'missing currentUser rejected');

// Simulate RPC uniqueness violation
const conflictAdmin = { async rpc(name: string, args: Record<string, unknown>) {
  if (name === 'update_lalao_user_phone') return { data: null, error: { code: '23505', message: 'already associated' } };
  return { data: 'synthetic-lalao-user', error: null };
} };
const conflictResp = await appUser.fetch(new Request('http://local/functions/v1/app-user', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ operation: 'updateUserPhone', payload: { phoneNumber: '+2348012345678' } }),
}), { supabaseAdmin: conflictAdmin, principal: verifiedPrincipal, currentUser: { _id: 'user-x' } });
assert.equal(conflictResp.status, 409, 'uniqueness conflict returns 409');

console.log('app-user authorization tests passed (verified/unverified Firebase provisioning claims and server-resolved profile ownership).');
console.log('app-user updateUserPhone tests passed (identity-resolved owner, uniqueness conflict, payload validation).');

// Playsole provisioning through the same Edge Function path
const playsolePrincipal = {
  provider: 'playsole', issuer: 'https://one.playsole.xyz', subject: 'synthetic-playsole-subject',
  audience: 'lalao', issuedAt: 100, expiresAt: 200, email: 'playsole@example.invalid',
  name: 'Playsole User', picture: null, firebaseSignInProvider: null,
};

const playsoleProvisioned = await post({ operation: 'createUserRecord' }, { ...playsolePrincipal, emailVerified: true });
assert.equal(playsoleProvisioned.status, 200, await playsoleProvisioned.clone().text());
assert.equal(rpcCalls.at(-1)?.name, 'ensure_lalao_user_for_identity', 'Playsole routes to same identity RPC');
assert.equal(rpcCalls.at(-1)?.args.p_issuer, 'https://one.playsole.xyz', 'Playsole issuer passed through');
assert.equal(rpcCalls.at(-1)?.args.p_subject, 'synthetic-playsole-subject', 'Playsole subject passed through');
assert.equal(rpcCalls.at(-1)?.args.p_method, 'playsole', 'Playsole method recorded');

// Playsole with unverified email
const playsoleUnverified = await post({ operation: 'createUserRecord', payload: { admin: true } }, { ...playsolePrincipal, emailVerified: false });
assert.equal(playsoleUnverified.status, 200, await playsoleUnverified.clone().text());
assert.equal(rpcCalls.at(-1)?.args.p_email_verified, false, 'Playsole unverified email preserved');

// Client-supplied userId cannot override identity-resolved owner
const playsoleClientId = await post({ operation: 'createUserRecord', payload: { userId: 'user-y' } }, { ...playsolePrincipal, emailVerified: true }, { _id: 'user-x' });
assert.equal(playsoleClientId.status, 200, await playsoleClientId.clone().text());
assert.equal(rpcCalls.at(-1)?.args.p_user_id, undefined, 'createUserRecord RPC does not accept client-supplied userId');

console.log('app-user Playsole provisioning tests passed (both providers through same Edge Function path).');
