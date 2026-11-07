import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__socialTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__socialTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const functionPath = resolve('supabase/functions/app-social/index.ts');
const currentUserId = 'synthetic-feed-user-a';
let queriedFollowOwner: string | undefined;
const users = [
  { _id: currentUserId, name: 'Owner', username: 'owner', userType: 'person', email: 'private@example.invalid', role: 'admin' },
  { _id: 'synthetic-author-b', name: 'Public Author', username: 'public', userType: 'person', email: 'private@example.invalid', role: 'admin' },
];
const now = Date.now();
let posts = [
  { _id: 'public-post', authorId: 'synthetic-author-b', text: 'Public post', audience: 'everyone', createdAt: now - 1000 },
  { _id: 'tie-public-post', authorId: 'synthetic-author-b', text: 'Same-time public post', audience: 'everyone', createdAt: now - 1000 },
  { _id: 'other-close-post', authorId: 'synthetic-author-b', text: 'Private post', audience: 'closeFriends', createdAt: now - 2000 },
  { _id: 'restricted-group-post', authorId: 'synthetic-author-b', text: 'Restricted post', audience: 'group', createdAt: now - 2500 },
  { _id: 'owner-close-post', authorId: currentUserId, text: 'Owner close friends post', audience: 'closeFriends', createdAt: now - 3000 },
  { _id: 'removed-post', authorId: 'synthetic-author-b', text: 'Removed', audience: 'everyone', moderationStatus: 'removed', createdAt: now - 4000 },
];
let queryErrorTable: string | null = null;
const selectedColumns: Array<{ table: string; columns: string }> = [];
const postLimits: number[] = [];

const admin = {
  from(table: string) {
    const filters: Record<string, unknown> = {};
    const orders: Array<{ column: string; ascending: boolean }> = [];
    let limit: number | null = null;
    const query = {
      select(columns: string) {
        selectedColumns.push({ table, columns });
        return this;
      },
      eq(column: string, value: unknown) {
        filters[column] = value;
        if (table === 'follows' && column === 'followerId') queriedFollowOwner = String(value);
        return this;
      },
      in(column: string, value: unknown[]) { filters[column] = value; return this; },
      lt(column: string, value: number) { filters[`lt:${column}`] = value; return this; },
      order(column: string, options?: { ascending?: boolean }) {
        orders.push({ column, ascending: options?.ascending !== false });
        return this;
      },
      limit(value: number) {
        limit = value;
        if (table === 'posts') postLimits.push(value);
        return this;
      },
      maybeSingle: async () => ({ data: null, error: null }),
      then(resolveResult: (result: { data: unknown[]; error: null }) => unknown) {
        if (table === queryErrorTable) {
          return Promise.resolve(resolveResult({ data: [], error: { message: 'synthetic failure' } as any }));
        }
        const all: Record<string, unknown>[] = table === 'posts' ? posts
          : table === 'users' ? users
            : [];
        let data = all.filter((row) => Object.entries(filters).every(([key, value]) => {
          if (key.startsWith('lt:')) return Number(row[key.slice(3)]) < Number(value);
          if (Array.isArray(value)) return value.includes(row[key]);
          return row[key] === value;
        }));
        for (const order of [...orders].reverse()) {
          data = data.sort((a, b) => {
            const comparison = String(a[order.column] ?? '').localeCompare(String(b[order.column] ?? ''), undefined, { numeric: true });
            return comparison * (order.ascending ? 1 : -1);
          });
        }
        if (limit !== null) data = data.slice(0, limit);
        return Promise.resolve(resolveResult({ data, error: null }));
      },
    };
    return query;
  },
};

const globals = globalThis as typeof globalThis & { __socialTestAuth?: (handler: unknown) => unknown; __socialTestTopicMatch?: () => boolean };
globals.__socialTestAuth = (handler) => handler;
globals.__socialTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__socialTestAuth;
  delete globals.__socialTestTopicMatch;
}
const appSocial = (mod.exports.default ?? mod.exports) as { fetch(request: Request, context: unknown): Promise<Response> };
async function request(payload: unknown, userId: string | null = currentUserId) {
  return appSocial.fetch(new Request('http://local/functions/v1/app-social', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation: 'listFeedPosts', payload }),
  }), { supabaseAdmin: admin, currentUser: userId ? { _id: userId } : null });
}

assert.equal((await request({ feedType: 'for_you' }, null)).status, 401, 'feed reads require a mapped authenticated user');
assert.equal((await request({ feedType: 'following' })).status, 400, 'unsupported tabs remain on the Convex fallback');
assert.equal((await request({ feedType: 'for_you', userId: 'synthetic-feed-user-b' })).status, 400, 'client-supplied identity is rejected');
const response = await request({ feedType: 'for_you', limit: 40 });
assert.equal(response.status, 200);
const feed = await response.json() as Array<{ id: string; author: { id: string; email?: string; role?: string } | null }>;
assert.ok(feed.some((post) => post.id === 'public-post'), 'public feed post remains visible');
assert.ok(feed.some((post) => post.id === 'owner-close-post'), 'owner can see their close-friends post');
assert.ok(!feed.some((post) => post.id === 'other-close-post'), 'another user’s close-friends post stays private');
assert.ok(!feed.some((post) => post.id === 'restricted-group-post'), 'restricted audiences without a verified membership model are omitted');
assert.ok(!feed.some((post) => post.id === 'removed-post'), 'removed posts remain excluded');
assert.equal(feed.find((post) => post.id === 'public-post')?.author?.id, 'synthetic-author-b');
assert.equal(feed.find((post) => post.id === 'public-post')?.author?.email, undefined, 'author email is never selected or returned');
assert.equal(feed.find((post) => post.id === 'public-post')?.author?.role, undefined, 'author role is never selected or returned');
assert.ok(postLimits.every((limit) => limit <= 300), 'feed candidate reads are bounded');
assert.ok(
  selectedColumns.some(({ table, columns }) => table === 'posts' && !columns.includes('moderationNote') && !columns.includes('removedBy')),
  'feed post reads use an explicit projection',
);

const pageTwoResponse = await request({ feedType: 'for_you', cursor: now - 1500 });
const pageTwo = await pageTwoResponse.json() as Array<{ id: string }>;
assert.deepEqual(pageTwo.map((post) => post.id), ['owner-close-post'], 'cursor filters newer posts before returning the next older candidate');
assert.equal((await request({ feedType: 'for_you', limit: 0 })).status, 400, 'invalid page limits are rejected');
queryErrorTable = 'posts';
assert.equal((await request({ feedType: 'nearby', latitude: 0, longitude: 0 })).status, 500, 'database failures return an explicit error');
queryErrorTable = null;
posts = [];
assert.deepEqual(await (await request({ feedType: 'for_you' })).json(), [], 'empty feeds return an empty result');
console.log('app-social feed tests passed (authenticated access, safe audience and field projection, bounded reads, cursor filtering and error handling; Supabase data mocked).');
