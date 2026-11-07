import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { resolve } from 'node:path';
import * as ts from 'typescript';

const source = readFileSync(resolve('supabase/functions/_shared/withLalaoAuth.ts'), 'utf8')
  .replace("import { createClient } from 'npm:@supabase/supabase-js@2.118.0';", 'const createClient = globalThis.__authTestCreateClient;')
  .replace("import { resolveCurrentUser, type CurrentUserRepository } from './currentUser.ts';", 'const resolveCurrentUser = globalThis.__authTestResolveCurrentUser;')
  .replace("import { verifyLalaoJwt, type VerifiedLalaoPrincipal } from './verifyLalaoJwt.ts';", 'const verifyLalaoJwt = globalThis.__authTestVerify;');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const middlewarePath = resolve('supabase/functions/_shared/withLalaoAuth.ts');
const module = new Module(middlewarePath);
let activePrincipal: Record<string, unknown> = {
  provider: 'firebase', issuer: 'https://securetoken.google.com/uselalaoapp', subject: 'subject-a',
  audience: 'uselalaoapp', issuedAt: 1, expiresAt: 2, email: null, emailVerified: false,
  name: null, picture: null, firebaseSignInProvider: null,
};
let adminCreates = 0;
let verifies = 0;
let resolveMode: 'mapped' | 'unmapped' | 'conflict' = 'mapped';
const globals = globalThis as typeof globalThis & Record<string, unknown>;
globals.Deno = { env: { get: (name: string) => name === 'SUPABASE_URL' ? 'http://127.0.0.1:54321' : name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'synthetic-test-only' : undefined } };
globals.__authTestCreateClient = () => { adminCreates++; return admin; };
globals.__authTestVerify = async (value: string) => {
  verifies++;
  if (value === 'bad.token.value') throw new Error('invalid token');
  return activePrincipal;
};
globals.__authTestResolveCurrentUser = async () => resolveMode === 'mapped'
  ? { status: 200, body: { _id: 'lalao-user-a' } }
  : resolveMode === 'conflict' ? { status: 409, body: { error: 'conflicting mapping' } } : { status: 200, body: null };
(module as unknown as { _compile(code: string, filename: string): void })._compile(compiled, middlewarePath);
const { withLalaoAuth } = module.exports as {
  withLalaoAuth(
    handler: (request: Request, context: any) => Promise<Response>,
    options?: { allowUnmappedProvisioning?: boolean },
  ): (request: Request) => Promise<Response>;
};
const admin = {};
let observedUserId: string | undefined;
let businessCalls = 0;
const handler = withLalaoAuth(async (_request, context) => {
  businessCalls++;
  observedUserId = context.currentUser?._id;
  return Response.json({ userId: observedUserId });
}, { allowUnmappedProvisioning: true });
const strictHandler = withLalaoAuth(async () => Response.json({ ok: true }));

function request(token?: string, body: unknown = { operation: 'read', payload: { userId: 'lalao-user-b' } }): Request {
  return new Request('http://local/functions/v1/app-wallet', {
    method: 'POST', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

try {
  const optionsResponse = await handler(new Request('http://local/functions/v1/app-wallet', { method: 'OPTIONS' }));
  assert.equal(optionsResponse.status, 204);
  assert.equal(adminCreates, 0);
  assert.equal(verifies, 0);

  assert.equal((await handler(request())).status, 401, 'missing authorization rejects');
  assert.equal(adminCreates, 0, 'missing auth cannot construct privileged client');
  assert.equal((await handler(request('bad.token.value'))).status, 401, 'invalid signature rejects');
  assert.equal(adminCreates, 0, 'invalid auth cannot construct privileged client');

  const validResponse = await handler(request('good.token.value'));
  assert.equal(validResponse.status, 200);
  assert.equal(observedUserId, 'lalao-user-a', 'request payload userId cannot replace resolved owner');
  assert.equal(adminCreates, 1);

  resolveMode = 'conflict';
  const beforeConflictCalls = businessCalls;
  assert.equal((await handler(request('good.token.value'))).status, 409);
  assert.equal(businessCalls, beforeConflictCalls, 'conflicting identity mapping prevents business operation');

  resolveMode = 'unmapped';
  const beforeUnmappedCalls = businessCalls;
  assert.equal((await handler(request('good.token.value'))).status, 404, 'unmapped ordinary operation rejects');
  assert.equal(businessCalls, beforeUnmappedCalls, 'unmapped identity cannot reach handler');
  const provision = await handler(request('good.token.value', { operation: 'createUserRecord' }));
  assert.equal(provision.status, 200, 'unmapped verified Firebase provisioning operation may reach handler');
  activePrincipal = {
    ...activePrincipal,
    provider: 'playsole',
    issuer: 'https://one.playsole.xyz',
    audience: 'lalao',
    email: 'playsole@example.test',
    emailVerified: false,
  };
  const beforePlaysoleProvisionCalls = businessCalls;
  assert.equal((await handler(request('good.token.value', { operation: 'createUserRecord' }))).status, 404, 'unverified Playsole email cannot provision an account');
  assert.equal(businessCalls, beforePlaysoleProvisionCalls);
  activePrincipal = { ...activePrincipal, emailVerified: true };
  assert.equal((await handler(request('good.token.value', { operation: 'read' }))).status, 404, 'unmapped Playsole identity cannot call ordinary operations');
  assert.equal(businessCalls, beforePlaysoleProvisionCalls);
  assert.equal((await handler(request('good.token.value', { operation: 'createUserRecord' }))).status, 200, 'verified Playsole provisioning operation may reach the server-side identity RPC');
  assert.equal(businessCalls, beforePlaysoleProvisionCalls + 1);
  assert.equal((await strictHandler(request('good.token.value', { operation: 'createUserRecord' }))).status, 404, 'unmapped provisioning remains disabled for other Edge Functions');
  console.log('Shared Lalao auth middleware tests passed (provider verification, unmapped identity provisioning gates, client creation order, conflict rejection and owner pinning).');
} finally {
  delete globals.__authTestCreateClient;
  delete globals.__authTestVerify;
  delete globals.__authTestResolveCurrentUser;
  delete globals.Deno;
}
