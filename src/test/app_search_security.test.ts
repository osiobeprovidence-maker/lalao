import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const functionPath = resolve('supabase/functions/app-search/index.ts');
const source = readFileSync(functionPath, 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__testWithLalaoAuth;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const module = { exports: {} as Record<string, unknown> };
const testWithLalaoAuth = (handler: (request: Request, context: unknown) => Promise<Response>) => handler;
const globals = globalThis as typeof globalThis & { __testWithLalaoAuth?: typeof testWithLalaoAuth };
globals.__testWithLalaoAuth = testWithLalaoAuth;
try {
  const execute = new Function('module', 'exports', 'require', compiled.code);
  execute(module, module.exports, require);
} finally {
  delete globals.__testWithLalaoAuth;
}
const appSearch = (module.exports.default ?? module.exports) as { fetch(request: Request, context: unknown): Promise<Response> };

type Search = Record<string, unknown>;
type User = Record<string, unknown>;
type Page = Record<string, unknown>;

function harness(options: { users?: User[]; pages?: Page[]; searches?: Search[] } = {}) {
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const users = options.users ?? [];
  const pages = options.pages ?? [];
  const searches = options.searches ?? [];
  const admin = {
    from(table: string) {
      let filters: Record<string, unknown> = {};
      return {
        select() { return this; },
        eq(column: string, value: unknown) { filters[column] = value; return this; },
        in(column: string, values: unknown[]) { filters[column] = values; return this; },
        limit() { return this; },
        order() { return this; },
        async maybeSingle() { return { data: { _id: 'owner' }, error: null }; },
        then(resolveResult: (value: { data: unknown[]; error: null }) => unknown) {
          const rows = table === 'authIdentities' ? [{ userId: 'owner' }]
            : table === 'users' ? users.filter((user) => (filters._id as string[] | undefined)?.includes(String(user._id)))
              : table === 'pages' ? pages.filter((page) => (filters._id as string[] | undefined)?.includes(String(page._id)))
                : searches;
          return Promise.resolve(resolveResult({ data: rows, error: null }));
        },
      };
    },
    async rpc(name: string, args: Record<string, unknown>) { rpcCalls.push({ name, args }); return { data: 'search-id', error: null }; },
  };
  const context = { supabaseAdmin: admin, currentUser: { _id: 'owner' }, principal: {} };
  const request = (operation: string, payload: unknown) => new Request('https://local.test/functions/v1/app-search', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, payload }),
  });
  return { rpcCalls, context, request };
}

{
  const test = harness();
  const response = await appSearch.fetch(test.request('recordRecentSearch', {
    userId: 'attacker-user', query: 'Ada', type: 'person', entityId: 'person-1', title: 'Ada Lovelace', subtitle: '@ada', avatarUrl: 'avatar.png',
    isVerified: true, verificationTier: 'premium',
  }), test.context);
  assert.equal(response.status, 200);
  const sent = test.rpcCalls[0].args.p_search as Record<string, unknown>;
  assert.deepEqual(sent, { userId: 'attacker-user', query: 'Ada', type: 'person', entityId: 'person-1', title: 'Ada Lovelace', subtitle: '@ada', avatarUrl: 'avatar.png' });
  assert.equal(test.rpcCalls[0].args.p_user_id, 'owner', 'recent-search owner is resolved server-side even when payload userId is different');
  assert.equal('isVerified' in sent, false);
  assert.equal('verificationTier' in sent, false);
}

{
  const test = harness({
    searches: [
      { _id: 'person-ok', type: 'person', entityId: 'person-1', query: 'Ada', isVerified: false, verificationTier: 'none' },
      { _id: 'person-missing', type: 'person', entityId: 'deleted', query: 'Deleted', isVerified: true, verificationTier: 'premium' },
      { _id: 'person-no-id', type: 'person', query: 'No ID', isVerified: true, verificationTier: 'premium' },
      { _id: 'page', type: 'page', entityId: 'page-1', query: 'Lalao', isVerified: true, verificationTier: 'gold' },
      { _id: 'shop', type: 'shop', entityId: 'shop-1', query: 'Store' },
      { _id: 'keyword', type: 'keyword', query: 'music', isVerified: true, verificationTier: 'premium' },
      { _id: 'event', type: 'event', query: 'Festival' },
    ],
    users: [{ _id: 'person-1', name: 'Ada Trusted', username: 'trusted', avatarUrl: 'trusted.png', verificationTier: 'gold', verificationStatus: 'active' }],
    pages: [{ _id: 'page-1', name: 'Trusted Page', category: 'Community', avatar: 'page.png' }, { _id: 'shop-1', name: 'Trusted Shop', category: 'Retail', avatar: 'shop.png' }],
  });
  const response = await appSearch.fetch(test.request('getRecentSearches', {}), test.context);
  assert.equal(response.status, 200);
  const result = await response.json() as Search[];
  assert.deepEqual(result[0], {
    _id: 'person-ok', type: 'person', entityId: 'person-1', query: 'Ada', isVerified: true,
    verificationTier: 'gold', title: 'Ada Trusted', subtitle: '@trusted', avatarUrl: 'trusted.png',
  });
  assert.deepEqual({ isVerified: result[1].isVerified, verificationTier: result[1].verificationTier }, { isVerified: false, verificationTier: 'none' });
  assert.deepEqual({ isVerified: result[2].isVerified, verificationTier: result[2].verificationTier }, { isVerified: false, verificationTier: 'none' });
  assert.deepEqual({ title: result[3].title, subtitle: result[3].subtitle, avatarUrl: result[3].avatarUrl }, { title: 'Trusted Page', subtitle: 'Community', avatarUrl: 'page.png' });
  assert.deepEqual({ title: result[4].title, subtitle: result[4].subtitle, avatarUrl: result[4].avatarUrl }, { title: 'Trusted Shop', subtitle: 'Retail', avatarUrl: 'shop.png' });
  assert.equal(result[5].query, 'music');
  assert.equal(result[5].isVerified, true, 'non-person search types retain their existing metadata');
  assert.equal(result[6].query, 'Festival');
}

console.log('App search security tests passed (sanitize record payload, trusted person verification, fail-closed person fallbacks, and other search types).');
