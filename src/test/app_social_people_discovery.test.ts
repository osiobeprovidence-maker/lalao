import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__peopleDiscoveryTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__peopleDiscoveryTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __peopleDiscoveryTestAuth?: (handler: unknown) => unknown;
  __peopleDiscoveryTestTopicMatch?: () => boolean;
};
globals.__peopleDiscoveryTestAuth = (handler) => handler;
globals.__peopleDiscoveryTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__peopleDiscoveryTestAuth;
  delete globals.__peopleDiscoveryTestTopicMatch;
}

const appSocial = (mod.exports.default ?? mod.exports) as {
  fetch(request: Request, context: unknown): Promise<Response>;
};
const viewerId = 'people-discovery-viewer';
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
let rpcResult: unknown = [
  {
    id: 'ranked-candidate',
    name: 'Candidate',
    username: 'candidate',
    avatar: '',
    userType: 'person',
    bio: '',
    location: '',
    followersCount: 6,
    followingCount: 2,
    isFollowing: false,
    relationship: 'follower',
    isVerified: false,
    verificationTier: 'none',
  },
];
let rpcError: { message: string; code?: string } | null = null;
const admin = {
  async rpc(name: string, args: Record<string, unknown>) {
    rpcCalls.push({ name, args });
    return { data: rpcResult, error: rpcError };
  },
};

async function post(operation: string, payload: unknown = {}, currentUserId: string | null = viewerId) {
  return appSocial.fetch(new Request('http://local/functions/v1/app-social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation, payload }),
  }), {
    supabaseAdmin: admin,
    currentUser: currentUserId ? { _id: currentUserId } : null,
  });
}

const peopleResponse = await post('getDiscoverablePeople', { limit: 50, userId: 'attacker-chosen-id' });
assert.equal(peopleResponse.status, 400, 'client-supplied identity is rejected');

const validPeopleResponse = await post('getDiscoverablePeople', { limit: 50 });
assert.equal(validPeopleResponse.status, 200);
assert.deepEqual(await validPeopleResponse.json(), rpcResult);
assert.deepEqual(rpcCalls.at(-1), {
  name: 'get_lalao_discoverable_people',
  args: { p_viewer_id: viewerId, p_limit: 50 },
});

const defaultLimitResponse = await post('getDiscoverablePeople');
assert.equal(defaultLimitResponse.status, 200);
assert.equal(rpcCalls.at(-1)?.args.p_limit, 25);

for (const limit of [-1, 101, 2.5, '50']) {
  const invalid = await post('getDiscoverablePeople', { limit });
  assert.equal(invalid.status, 400, `invalid limit ${String(limit)} is rejected`);
}

rpcResult = 17;
const countResponse = await post('getDiscoverablePeopleCount');
assert.equal(countResponse.status, 200);
assert.equal(await countResponse.json(), 17);
assert.deepEqual(rpcCalls.at(-1), {
  name: 'get_lalao_discoverable_people_count',
  args: { p_viewer_id: viewerId },
});

const countWithClientId = await post('getDiscoverablePeopleCount', { userId: 'attacker-chosen-id' });
assert.equal(countWithClientId.status, 400);

const unauthenticated = await post('getDiscoverablePeople', {}, null);
assert.equal(unauthenticated.status, 404);

rpcError = { message: 'synthetic RPC failure' };
const failedRead = await post('getDiscoverablePeople');
assert.equal(failedRead.status, 500);
rpcError = null;

rpcResult = null;
const incompleteRead = await post('getDiscoverablePeople');
assert.equal(incompleteRead.status, 500, 'unexpected RPC response is not converted into success-shaped empty data');

rpcResult = '17';
const invalidCount = await post('getDiscoverablePeopleCount');
assert.equal(invalidCount.status, 500, 'count must be a validated integer');

console.log('app-social people discovery tests passed (identity, bounded limits, RPC routing, unauthenticated access, malformed data and failures; database mocked).');
