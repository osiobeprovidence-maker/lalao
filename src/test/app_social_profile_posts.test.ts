import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__profilePostsTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__profilePostsTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __profilePostsTestAuth?: (handler: unknown) => unknown;
  __profilePostsTestTopicMatch?: () => boolean;
};
globals.__profilePostsTestAuth = (handler) => handler;
globals.__profilePostsTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__profilePostsTestAuth;
  delete globals.__profilePostsTestTopicMatch;
}

const appSocial = (mod.exports.default ?? mod.exports) as {
  fetch(request: Request, context: unknown): Promise<Response>;
};
const viewerId = 'profile-posts-viewer';
const targetId = 'profile-posts-target';
const users = [
  { _id: viewerId, username: 'viewer', suspended: false, email: 'private@example.invalid' },
  { _id: targetId, username: 'target', suspended: false, walletPin: 'private-value' },
  { _id: 'profile-posts-suspended', username: 'suspended', suspended: true },
];
const posts = [
  { _id: 'owner-private-post', authorId: viewerId, createdAt: 400, audience: 'closeFriends', text: 'owner-only', moderationStatus: 'safe', privateInternalValue: 'must-not-return' },
  { _id: 'post-a', authorId: targetId, createdAt: 300, audience: 'everyone', text: 'latest', moderationStatus: 'safe' },
  { _id: 'post-b', authorId: targetId, createdAt: 200, audience: 'everyone', text: 'public tie', moderationStatus: 'safe' },
  { _id: 'post-c', authorId: targetId, createdAt: 200, audience: 'everyone', text: 'public tie id order', moderationStatus: 'safe' },
  { _id: 'post-private', authorId: targetId, createdAt: 150, audience: 'closeFriends', text: 'restricted', moderationStatus: 'safe' },
  { _id: 'post-legacy', authorId: targetId, createdAt: 100, text: 'legacy public', moderationStatus: 'safe' },
  { _id: 'post-removed', authorId: targetId, createdAt: 50, audience: 'everyone', text: 'removed', moderationStatus: 'removed' },
];
const selectedColumns: Array<{ table: string; columns: string }> = [];
let failTable: string | null = null;

const admin = {
  from(table: string) {
    let columns = '';
    const equals = new Map<string, unknown>();
    const ors: string[] = [];
    const notEquals = new Map<string, unknown>();
    const ordering: Array<{ column: string; ascending: boolean }> = [];
    let limit = Number.POSITIVE_INFINITY;
    const query: any = {
      select(value: string) {
        columns = value;
        selectedColumns.push({ table, columns });
        return query;
      },
      eq(column: string, value: unknown) {
        equals.set(column, value);
        return query;
      },
      neq(column: string, value: unknown) {
        notEquals.set(column, value);
        return query;
      },
      or(value: string) {
        ors.push(value);
        return query;
      },
      order(column: string, options: { ascending: boolean }) {
        ordering.push({ column, ascending: options.ascending });
        return query;
      },
      limit(value: number) {
        limit = value;
        return query;
      },
      async maybeSingle() {
        if (table === failTable) return { data: null, error: { message: 'synthetic query failure' } };
        const row = users.find((item) => [...equals.entries()].every(([key, value]) => item[key] === value));
        return { data: row ?? null, error: null };
      },
      then(resolveResult: (result: { data: Record<string, unknown>[]; error: { message: string } | null }) => unknown) {
        if (table === failTable) {
          return Promise.resolve(resolveResult({ data: [], error: { message: 'synthetic query failure' } }));
        }
        let rows: Record<string, any>[] = table === 'posts' ? (posts as Record<string, any>[]).filter((post) =>
          [...equals.entries()].every(([key, value]) => post[key] === value)
          && [...notEquals.entries()].every(([key, value]) => post[key] !== value),
        ) : [];
        for (const expression of ors) {
          if (expression.startsWith('audience.')) {
            rows = rows.filter((post) => post.audience === 'everyone' || post.audience === undefined);
          } else if (expression.startsWith('createdAt.lt.')) {
            const match = expression.match(/^createdAt\.lt\.([0-9.]+),and\(createdAt\.eq\.([0-9.]+),_id\.lt\.([A-Za-z0-9_-]+)\)$/);
            assert.ok(match, 'cursor filter has the stable timestamp/id form');
            const before = Number(match[1]);
            const equalAt = Number(match[2]);
            const beforeId = match[3];
            rows = rows.filter((post) =>
              post.createdAt < before || (post.createdAt === equalAt && post._id < beforeId),
            );
          }
        }
        rows = [...rows].sort((a, b) => {
          for (const order of ordering) {
            const left = a[order.column];
            const right = b[order.column];
            const comparison = typeof left === 'number' && typeof right === 'number'
              ? left - right
              : String(left).localeCompare(String(right));
            if (comparison !== 0) return order.ascending ? comparison : -comparison;
          }
          return 0;
        }).slice(0, limit);
        if (table === 'posts') {
          rows = rows.map((row) => Object.fromEntries(
            columns.split(',').map((column) => [column, row[column]]),
          ));
        }
        return Promise.resolve(resolveResult({ data: rows, error: null }));
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

const publicPage = await post('listUserPosts', { userId: targetId, username: '@target', limit: 2 });
assert.equal(publicPage.status, 200);
const firstPage = await publicPage.json() as { posts: Array<Record<string, any>>; nextCursor: { createdAt: number; id: string } | null };
assert.deepEqual(firstPage.posts.map((item) => item._id), ['post-a', 'post-c']);
assert.deepEqual(firstPage.nextCursor, { createdAt: 200, id: 'post-c' });
assert.ok(!firstPage.posts.some((item) => item._id === 'post-private'));
assert.ok(!firstPage.posts.some((item) => item._id === 'post-removed'));
assert.ok(
  selectedColumns.some(({ table, columns }) => table === 'posts'
    && columns.includes('_id') && columns.includes('authorId')
    && !columns.includes('*') && !columns.toLowerCase().includes('wallet')),
  'post reads use an explicit projection',
);

const secondPageResponse = await post('listUserPosts', {
  userId: targetId,
  username: 'target',
  limit: 2,
  cursor: firstPage.nextCursor,
});
const secondPage = await secondPageResponse.json() as { posts: Array<Record<string, any>>; nextCursor: unknown };
assert.deepEqual(secondPage.posts.map((item) => item._id), ['post-b', 'post-legacy']);
assert.equal(secondPage.nextCursor, null);
assert.equal(new Set([...firstPage.posts, ...secondPage.posts].map((item) => item._id)).size, 4);

const ownerPageResponse = await post('listUserPosts', { userId: viewerId, limit: 20 });
const ownerPage = await ownerPageResponse.json() as { posts: Array<Record<string, any>> };
assert.deepEqual(ownerPage.posts.map((item) => item._id), ['owner-private-post']);
assert.equal('privateInternalValue' in ownerPage.posts[0], false);

const inaccessibleProfile = await post('listUserPosts', {
  userId: 'profile-posts-suspended',
  username: 'suspended',
});
assert.deepEqual(await inaccessibleProfile.json(), { posts: [], nextCursor: null });

const mismatchedUsername = await post('listUserPosts', { userId: targetId, username: 'someone-else' });
assert.deepEqual(await mismatchedUsername.json(), { posts: [], nextCursor: null });

const badCursor = await post('listUserPosts', {
  userId: targetId,
  cursor: { createdAt: 100, id: 'unsafe),or(_id.eq.secret' },
});
assert.equal(badCursor.status, 400);

const malformedArgs = await post('listUserPosts', { userId: targetId, offset: 1 });
assert.equal(malformedArgs.status, 400);

const anonymous = await post('listUserPosts', { userId: targetId }, null);
assert.equal(anonymous.status, 404);

failTable = 'posts';
const readFailure = await post('listUserPosts', { userId: targetId });
assert.equal(readFailure.status, 500);
failTable = null;

console.log('app-social profile post tests passed (identity mapping, public/private visibility, explicit projection, stable pagination, missing/suspended profiles, validation and errors; Supabase data mocked).');
