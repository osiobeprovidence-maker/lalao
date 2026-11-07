import assert from 'node:assert/strict';
import { verifyBachsWebhookSignature } from '../../supabase/functions/_shared/bachsWebhookSignature';

async function sign(secret: string, signedPayload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const secret = 'synthetic-batch-webhook-secret';
const rawBody = '{"id":"evt_synthetic","type":"checkout.completed"}';
const timestamp = '1793376000';
const signature = await sign(secret, `${timestamp}.${rawBody}`);

assert.equal(await verifyBachsWebhookSignature({
  rawBody, secret, nowMs: Number(timestamp) * 1000,
  signatureV2: `t=${timestamp},v1=${'0'.repeat(64)},v1=${signature}`,
}), true, 'accepts a valid V2 signature and rotation signature list');
assert.equal(await verifyBachsWebhookSignature({
  rawBody, secret, nowMs: Number(timestamp) * 1000,
  legacyTimestamp: timestamp, legacySignature: signature,
}), true, 'accepts the configured legacy signed-header format');
assert.equal(await verifyBachsWebhookSignature({
  rawBody: `${rawBody} `, secret, nowMs: Number(timestamp) * 1000,
  signatureV2: `t=${timestamp},v1=${signature}`,
}), false, 'rejects a modified raw request body');
assert.equal(await verifyBachsWebhookSignature({
  rawBody, secret, nowMs: Number(timestamp) * 1000 + 301_000,
  signatureV2: `t=${timestamp},v1=${signature}`,
}), false, 'rejects replayed signatures outside the five-minute window');
assert.equal(await verifyBachsWebhookSignature({ rawBody, secret: '', signatureV2: `t=${timestamp},v1=${signature}` }), false, 'fails closed without the webhook secret');

console.log('Supabase Batch webhook signature tests passed (V2, legacy, rotation, body tamper, replay, missing secret).');
