import assert from 'node:assert/strict';
import { createLalaoSupabaseClient } from '../lib/supabase';

const originalFetch = globalThis.fetch;
const observed: { url?: string; headers?: Headers; body?: string } = {};

try {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    observed.url = String(input);
    observed.headers = new Headers(init?.headers);
    observed.body = typeof init?.body === 'string' ? init.body : undefined;
    return Response.json({ _id: 'user_synthetic', username: 'synthetic' });
  }) as typeof fetch;

  const client = createLalaoSupabaseClient(
    { url: 'https://project.supabase.co', publishableKey: 'sb_publishable_public' },
    async () => 'provider-signed-jwt',
  );
  const { data, error } = await client.functions.invoke('app-user', {
    body: { operation: 'getCurrentUser' },
  });

  assert.equal(error, null);
  assert.equal(data?._id, 'user_synthetic');
  assert.equal(observed.url, 'https://project.supabase.co/functions/v1/app-user');
  assert.equal(observed.headers?.get('apikey'), 'sb_publishable_public');
  assert.equal(observed.headers?.get('authorization'), 'Bearer provider-signed-jwt');
  assert.equal(observed.body, JSON.stringify({ operation: 'getCurrentUser' }));
  assert.ok(!observed.headers?.has('x-service-role-key'), 'browser requests never send a service-role key');

  assert.throws(() => createLalaoSupabaseClient(
    { url: 'http://remote.supabase.test', publishableKey: 'public' }, async () => null,
  ), /HTTPS/);
  assert.throws(() => createLalaoSupabaseClient(
    { url: 'https://project.supabase.co', publishableKey: '' }, async () => null,
  ), /publishable key/);

  console.log('Supabase function transport tests passed (provider JWT, publishable key, HTTPS, no browser service role).');
} finally {
  globalThis.fetch = originalFetch;
}
