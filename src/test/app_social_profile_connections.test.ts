import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__socialConnectionsTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__socialConnectionsTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __socialConnectionsTestAuth?: (handler: unknown) => unknown;
  __socialConnectionsTestTopicMatch?: () => boolean;
};
globals.__socialConnectionsTestAuth = (handler) => handler;
globals.__socialConnectionsTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__socialConnectionsTestAuth;
  delete globals.__socialConnectionsTestTopicMatch;
}

const appSocial = (mod.exports.default ?? mod.exports) as {
  fetch(request: Request, context: unknown): Promise<Response>;
};
const viewerId = 'synthetic-connection-viewer';
const followerId = 'synthetic-connection-follower';
const suspendedId = 'synthetic-connection-suspended';
const followedId = 'synthetic-connection-followed';
const pageId = 'synthetic-connection-page';
const users = [
  {
    _id: viewerId,
    name: 'Viewer',
    username: 'viewer',
    email: 'private@example.invalid',
    phoneNumber: '+2348000000000',
    role: 'admin',
    tokenIdentifier: 'private-token',
  },
  {
    _id: followerId,
    name: 'Follower',
    username: 'follower',
    avatarUrl: 'https://images.example.invalid/follower.png',
    bio: 'A public bio',
    locationName: 'Warri (Detected)',
    followersCount: 8,
    followingCount: 3,
    verificationTier: 'verified',
    verificationStatus: 'active',
    verificationExpiresAt: Date.now() + 60_000,
    email: 'secret@example.invalid',
    phone: '+2348000000000',
    role: 'admin',
    tokenIdentifier: 'secret-token',
    suspended: false,
  },
  {
    _id: suspendedId,
    name: 'Suspended',
    username: 'suspended',
    suspended: true,
  },
  {
    _id: followedId,
    name: 'Followed',
    username: 'followed',
    suspended: false,
  },
];
const follows = [
  { followerId, followingId: viewerId, createdAt: 10 },
  { followerId: viewerId, followingId: followerId, createdAt: 11 },
  { followerId: suspendedId, followingId: viewerId, createdAt: 12 },
  { followerId: viewerId, followingId: suspendedId, createdAt: 13 },
  { followerId: viewerId, followingId: followedId, createdAt: 14 },
];
const pageFollowers = [{ userId: viewerId, pageId, createdAt: 15 }];
const pages = [{
  _id: pageId,
  name: 'Public Page',
  username: 'public-page',
  avatar: 'https://images.example.invalid/page.png',
  description: 'Page description',
  location: 'Warri',
  followersCount: 21,
  type: 'business',
  badge: 'BIZ',
  aboutInfo: { phone: '+2348000000000', email: 'private@example.invalid' },
}];
const selectedColumns: Array<{ table: string; columns: string }> = [];
let failTable: string | null = null;
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
let rpcResult: unknown = { following: true, notificationId: 'synthetic-follow-notification' };
let rpcError: { code: string; message: string } | null = null;

const admin = {
  async rpc(name: string, args: Record<string, unknown>) {
    rpcCalls.push({ name, args });
    return { data: rpcResult, error: rpcError };
  },
  from(table: string) {
    const filters = new Map<string, unknown>();
    let columns = '';
    const query: any = {
      select(value: string) {
        columns = value;
        selectedColumns.push({ table, columns });
        return query;
      },
      eq(column: string, value: unknown) {
        filters.set(column, value);
        return query;
      },
      in(column: string, value: unknown[]) {
        filters.set(column, value);
        return query;
      },
      order() { return query; },
      async maybeSingle() { return { data: null, error: null }; },
      then(resolveResult: (result: { data: unknown[]; error: { message: string } | null }) => unknown) {
        if (table === failTable) {
          return Promise.resolve(resolveResult({ data: [], error: { message: 'synthetic query failure' } }));
        }
        const rows: Record<string, any>[] = table === 'users' ? users
          : table === 'follows' ? follows
            : table === 'pageFollowers' ? pageFollowers
              : table === 'pages' ? pages
                : [];
        const data = rows.filter((row) => [...filters.entries()].every(([column, value]) => {
          if (Array.isArray(value)) return value.includes(row[column]);
          return row[column] === value;
        }));
        return Promise.resolve(resolveResult({ data, error: null }));
      },
    };
    return query;
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

const friendsResponse = await post('getRelationship', { targetUserId: followerId });
assert.equal(friendsResponse.status, 200);
assert.deepEqual(await friendsResponse.json(), {
  isFollowing: true,
  followsMe: true,
  isFriend: true,
  relationship: 'friends',
});

const missingRelationship = await post('getRelationship', { targetUserId: 'missing-user' });
assert.deepEqual(await missingRelationship.json(), {
  isFollowing: false,
  followsMe: false,
  isFriend: false,
  relationship: 'none',
});

const followersResponse = await post('getMyFollowers');
assert.equal(followersResponse.status, 200);
const followerProfiles = await followersResponse.json() as Array<Record<string, unknown>>;
assert.equal(followerProfiles.length, 1, 'suspended users are omitted');
assert.equal(followerProfiles[0].id, followerId);
assert.equal(followerProfiles[0].isFollowing, true, 'viewer relationship uses the authenticated viewer identity');
assert.equal(followerProfiles[0].followedAt, 10);
assert.equal(followerProfiles[0].location, 'Warri');
assert.equal(followerProfiles[0].isVerified, true);
for (const sensitiveField of ['email', 'phone', 'phoneNumber', 'role', 'tokenIdentifier', 'suspended']) {
  assert.equal(sensitiveField in followerProfiles[0], false, `${sensitiveField} is excluded from connection profiles`);
}
assert.ok(
  selectedColumns.some(({ table, columns }) => table === 'users' && !columns.includes('email') && !columns.includes('phone')),
  'user fields are selected using an explicit public projection',
);

const followingResponse = await post('getMyFollowing');
assert.equal(followingResponse.status, 200);
const following = await followingResponse.json() as {
  people: Array<Record<string, unknown>>;
  pages: Array<Record<string, unknown>>;
  peopleCt: number;
  pagesCt: number;
};
assert.equal(following.people.length, 2, 'suspended followed accounts are omitted');
assert.ok(following.people.some((person) => person.id === followedId));
assert.ok(following.people.every((person) => person.isFollowing === true));
assert.ok(!following.people.some((person) => person.id === suspendedId));
assert.equal(following.pages.length, 1);
assert.equal(following.pages[0].id, pageId);
assert.equal(following.peopleCt, 2);
assert.equal(following.pagesCt, 1);
assert.equal('aboutInfo' in following.pages[0], false, 'private page contact details are excluded');

const followResponse = await post('toggleFollowUser', { targetUserId: followedId });
assert.equal(followResponse.status, 200);
assert.deepEqual(await followResponse.json(), { following: true });
assert.deepEqual(rpcCalls.at(-1), {
  name: 'toggle_lalao_user_follow',
  args: { p_follower_id: viewerId, p_target_user_id: followedId },
}, 'follow writes are transactionally delegated with server-resolved actor identity');
assert.equal((await post('toggleFollowUser', {
  targetUserId: followedId,
  followerId: 'attacker-user',
})).status, 400, 'client-supplied actor identity is rejected');
assert.equal((await post('toggleFollowUser', { targetUserId: viewerId })).status, 400, 'self-follow is rejected');
rpcError = { code: 'P0002', message: 'User not found' };
assert.equal((await post('toggleFollowUser', { targetUserId: 'missing-user' })).status, 404);
rpcError = { code: '22023', message: 'Cannot follow yourself' };
assert.equal((await post('toggleFollowUser', { targetUserId: followedId })).status, 400);
rpcError = { code: '23505', message: 'duplicate relationship' };
assert.equal((await post('toggleFollowUser', { targetUserId: followedId })).status, 409);
rpcError = { code: 'XX000', message: 'synthetic database failure' };
assert.equal((await post('toggleFollowUser', { targetUserId: followedId })).status, 500);
rpcError = null;
rpcResult = { following: false };
assert.deepEqual(await (await post('toggleFollowUser', { targetUserId: followedId })).json(), { following: false });

assert.equal((await post('getRelationship', {}, null)).status, 404, 'unmapped callers cannot read relationships');
assert.equal((await post('getMyFollowers', { userId: 12 })).status, 400, 'invalid list arguments are rejected');
failTable = 'follows';
assert.equal((await post('getRelationship', { targetUserId: followerId })).status, 500, 'database errors are explicit');

console.log('app-social profile connection tests passed (identity-bound relationship, follower/following projections, suspension filtering, validation and errors).');
