import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

const verifierPath = resolve('supabase/functions/_shared/verifyLalaoJwt.ts');
const source = readFileSync(verifierPath, 'utf8').replaceAll('npm:jose@6.2.14', 'jose');
const testVerifierPath = resolve('supabase/functions/_shared', `.verifyLalaoJwt.test-${randomUUID()}.ts`);
writeFileSync(testVerifierPath, source, 'utf8');
const verifier = await import(`${pathToFileURL(testVerifierPath).href}?test=${randomUUID()}`) as {
  verifyLalaoJwt(token: string): Promise<{ provider: string; subject: string; issuer: string; audience: string }>;
};

const firebase = { issuer: 'https://securetoken.google.com/uselalaoapp', audience: 'uselalaoapp' };
const playsole = { issuer: 'https://one.playsole.xyz', audience: 'lalao' };
const now = Math.floor(Date.now() / 1000);
const [firebaseKeys, playsoleKeys, wrongKeys] = await Promise.all([
  generateKeyPair('RS256'), generateKeyPair('RS256'), generateKeyPair('RS256'),
]);
const [firebaseJwk, playsoleJwk] = await Promise.all([exportJWK(firebaseKeys.publicKey), exportJWK(playsoleKeys.publicKey)]);
Object.assign(firebaseJwk, { kid: 'fb-synthetic-1', alg: 'RS256', use: 'sig' });
Object.assign(playsoleJwk, { kid: 'ps-synthetic-1', alg: 'RS256', use: 'sig' });

const oldFetch = globalThis.fetch;
let failingUrl: string | null = null;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url === failingUrl) throw new Error('synthetic JWKS connection failure');
  if (url === 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com') return Response.json({ keys: [firebaseJwk] });
  if (url === 'https://one.playsole.xyz/.well-known/jwks.json') return Response.json({ keys: [playsoleJwk] });
  throw new Error('unexpected key URL');
}) as typeof fetch;

async function token(options: {
  issuer?: string; audience?: string; subject?: string | null; expires?: number; issuedAt?: number;
  provider?: 'firebase' | 'playsole'; key?: CryptoKey; kid?: string; algorithm?: 'RS256' | 'HS256'; jku?: string;
  firebaseClaims?: Record<string, unknown>;
} = {}): Promise<string> {
  const provider = options.provider ?? 'firebase';
  const config = provider === 'firebase' ? firebase : playsole;
  const signer = options.algorithm === 'HS256' ? new TextEncoder().encode('synthetic-test-signing-secret')
    : options.key ?? (provider === 'firebase' ? firebaseKeys.privateKey : playsoleKeys.privateKey);
  const jwt = new SignJWT(provider === 'firebase'
    ? options.firebaseClaims ?? { auth_time: now - 30, firebase: { sign_in_provider: 'password' } } : {});
  jwt.setProtectedHeader({ alg: options.algorithm ?? 'RS256', kid: options.kid ?? (provider === 'firebase' ? 'fb-synthetic-1' : 'ps-synthetic-1'), ...(options.jku ? { jku: options.jku } : {}) });
  jwt.setIssuer(options.issuer ?? config.issuer).setAudience(options.audience ?? config.audience);
  if (options.subject !== null) jwt.setSubject(options.subject ?? 'synthetic-user');
  jwt.setIssuedAt(options.issuedAt ?? now).setExpirationTime(options.expires ?? now + 3600);
  return jwt.sign(signer);
}

try {
  const validFirebase = await verifier.verifyLalaoJwt(await token());
  assert.equal(validFirebase.provider, 'firebase');
  assert.equal(validFirebase.subject, 'synthetic-user');
  assert.equal(validFirebase.issuer, firebase.issuer);
  assert.equal(validFirebase.audience, firebase.audience);

  // Exercise an initial provider key-discovery failure, then retry with the trusted endpoint available.
  failingUrl = 'https://one.playsole.xyz/.well-known/jwks.json';
  await assert.rejects(verifier.verifyLalaoJwt(await token({ provider: 'playsole' })), /Unauthorized/);
  failingUrl = null;
  const validPlaysole = await verifier.verifyLalaoJwt(await token({ provider: 'playsole' }));
  assert.equal(validPlaysole.provider, 'playsole');
  assert.equal(validPlaysole.issuer, playsole.issuer);

  await assert.rejects(verifier.verifyLalaoJwt(await token({ key: wrongKeys.privateKey })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ issuer: 'https://wrong-issuer.invalid' })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ audience: 'wrong-audience' })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ expires: now - 10 })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ subject: null })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ firebaseClaims: { firebase: { sign_in_provider: 'password' } } })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ algorithm: 'HS256' })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ kid: 'unknown-synthetic-kid' })), /Unauthorized/);
  await assert.rejects(verifier.verifyLalaoJwt(await token({ jku: 'https://attacker.invalid/jwks.json' })), /Unauthorized/);

  console.log('JWT verifier tests passed (synthetic Firebase/Playsole signatures, issuer/audience/expiry/sub/alg/kid checks, fixed JWKS and fetch failure).');
} finally {
  globalThis.fetch = oldFetch;
  rmSync(testVerifierPath, { force: true });
}
