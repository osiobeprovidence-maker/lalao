import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__socialNotificationsTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__socialNotificationsTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const globals = globalThis as typeof globalThis & {
  __socialNotificationsTestAuth?: (handler: unknown) => unknown;
  __socialNotificationsTestTopicMatch?: () => boolean;
};
globals.__socialNotificationsTestAuth = (handler) => handler;
globals.__socialNotificationsTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__socialNotificationsTestAuth;
  delete globals.__socialNotificationsTestTopicMatch;
}

const appSocial = (mod.exports.default ?? mod.exports) as {
  fetch(request: Request, context: unknown): Promise<Response>;
};
const viewerId = 'synthetic-notification-viewer';
const actorId = 'synthetic-notification-actor';
const otherId = 'synthetic-notification-other';
const users = [
  {
    _id: actorId,
    name: 'Actor',
    username: 'actor',
    avatarUrl: 'https://images.example.invalid/actor.png',
    avatar: 'legacy-avatar',
    userType: 'person',
    followersCount: 7,
    followingCount: 4,
    verificationTier: 'verified',
    verificationStatus: 'active',
    verificationExpiresAt: Date.now() + 60_000,
    email: 'private@example.invalid',
    phoneNumber: '+2348000000000',
    role: 'admin',
    tokenIdentifier: 'private-token',
  },
];
let notifications: Array<Record<string, any>> = [
  {
    _id: 'notification-like',
    recipientId: viewerId,
    actorId,
    type: 'like',
    postId: 'post-a',
    targetExcerpt: 'A post',
    isRead: false,
    createdAt: Date.now() - 60_000,
  },
  {
    _id: 'notification-message',
    recipientId: viewerId,
    actorId,
    type: 'message',
    isRead: false,
    createdAt: Date.now(),
  },
  {
    _id: 'notification-comment-like',
    recipientId: viewerId,
    actorId,
    type: 'comment_like',
    postId: 'post-a',
    isRead: false,
    createdAt: Date.now() - 30_000,
  },
  {
    _id: 'notification-reply-like',
    recipientId: viewerId,
    actorId,
    type: 'reply_like',
    postId: 'post-a',
    isRead: false,
    createdAt: Date.now() - 20_000,
  },
  {
    _id: 'notification-system',
    recipientId: viewerId,
    actorId: viewerId,
    type: 'system_alert',
    targetExcerpt: 'Maintenance',
    isRead: true,
    createdAt: Date.now() - 120_000,
  },
  {
    _id: 'notification-other-owner',
    recipientId: otherId,
    actorId,
    type: 'follow',
    isRead: false,
    createdAt: Date.now(),
  },
];
const follows = [{ followerId: viewerId, followingId: actorId }];
let subscriptions: Array<Record<string, any>> = [];
let fcmTokens: Array<Record<string, any>> = [];
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
const selectedColumns: Array<{ table: string; columns: string }> = [];
let queryErrorTable: string | null = null;
let rpcError: { code: string; message: string } | null = null;
let rpcResult: unknown = true;

const admin = {
  async rpc(name: string, args: Record<string, unknown>) {
    rpcCalls.push({ name, args });
    if (rpcError) return { data: null, error: rpcError };
    if (name === 'mark_lalao_user_notifications_read') {
      const ownerId = args.p_user_id;
      const notificationId = args.p_notification_id;
      if (typeof notificationId === 'string') {
        const row = notifications.find((item) => item._id === notificationId);
        if (!row) return { data: null, error: { code: 'P0002', message: 'not found' } };
        if (row.recipientId !== ownerId) return { data: null, error: { code: '42501', message: 'forbidden' } };
        row.isRead = true;
        return { data: 1, error: null };
      }
      const unread = notifications
        .filter((item) => item.recipientId === ownerId && !item.isRead)
        .slice(0, 250);
      unread.forEach((item) => { item.isRead = true; });
      return { data: unread.length, error: null };
    }
    if (name === 'upsert_lalao_web_push_subscription') {
      const current = subscriptions.find((item) => item.endpoint === args.p_endpoint);
      if (current) Object.assign(current, {
        userId: args.p_user_id,
        p256dh: args.p_p256dh,
        auth: args.p_auth,
        userAgent: args.p_user_agent ?? current.userAgent,
        isActive: true,
      });
      else subscriptions.push({
        _id: 'synthetic-subscription',
        userId: args.p_user_id,
        endpoint: args.p_endpoint,
        p256dh: args.p_p256dh,
        auth: args.p_auth,
        userAgent: args.p_user_agent,
        isActive: true,
      });
      return { data: 'synthetic-subscription', error: null };
    }
    if (name === 'deactivate_lalao_web_push_subscription') {
      const row = subscriptions.find((item) =>
        item.userId === args.p_user_id && item.endpoint === args.p_endpoint && item.isActive,
      );
      if (row) row.isActive = false;
      return { data: Boolean(row), error: null };
    }
    if (name === 'toggle_lalao_post_like' || name === 'toggle_lalao_comment_like') {
      return { data: rpcResult, error: null };
    }
    return { data: rpcResult, error: null };
  },
  from(table: string) {
    const filters = new Map<string, unknown>();
    let columns = '';
    let limit: number | null = null;
    let head = false;
    const query: any = {
      select(value: string, options?: { head?: boolean }) {
        columns = value;
        head = Boolean(options?.head);
        selectedColumns.push({ table, columns });
        return query;
      },
      eq(column: string, value: unknown) {
        filters.set(column, value);
        return query;
      },
      neq(column: string, value: unknown) {
        filters.set(`neq:${column}`, value);
        return query;
      },
      in(column: string, value: unknown[]) {
        filters.set(column, value);
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        query.orderColumn = column;
        query.ascending = options?.ascending !== false;
        return query;
      },
      limit(value: number) {
        limit = value;
        return query;
      },
      async maybeSingle() {
        return { data: null, error: null };
      },
      then(resolveResult: (result: { data: unknown[] | null; count?: number; error: { message: string } | null }) => unknown) {
        if (table === queryErrorTable) {
          return Promise.resolve(resolveResult({ data: [], count: 0, error: { message: 'synthetic query failure' } }));
        }
        let rows: Record<string, any>[] = table === 'notifications' ? notifications
          : table === 'users' ? users
            : table === 'follows' ? follows
              : table === 'pushSubscriptions' ? subscriptions
                : table === 'fcmTokens' ? fcmTokens
                  : [];
        rows = rows.filter((row) => [...filters.entries()].every(([column, value]) => {
          if (column.startsWith('neq:')) return row[column.slice(4)] !== value;
          if (Array.isArray(value)) return value.includes(row[column]);
          return row[column] === value;
        }));
        const count = rows.length;
        if (query.orderColumn) {
          const factor = query.ascending ? 1 : -1;
          rows = [...rows].sort((a, b) => (a[query.orderColumn] - b[query.orderColumn]) * factor);
        }
        if (limit !== null) rows = rows.slice(0, limit);
        return Promise.resolve(resolveResult({ data: head ? null : rows, count, error: null }));
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

const listResponse = await post('listNotifications');
assert.equal(listResponse.status, 200);
const listed = await listResponse.json() as Array<Record<string, any>>;
assert.equal(listed.length, 4, 'chat messages are excluded from the notification feed');
const like = listed.find((item) => item.id === 'notification-like');
assert.equal(like?.text, 'liked your post');
assert.equal(like?.targetId, 'post-a');
assert.equal(like?.actor?.id, actorId);
assert.equal(like?.actor?.isFollowing, true, 'actor relationship is resolved from the authenticated viewer');
assert.equal(like?.actor?.isVerified, true);
assert.equal(listed.find((item) => item.id === 'notification-comment-like')?.text, 'liked your comment');
assert.equal(listed.find((item) => item.id === 'notification-reply-like')?.text, 'liked your reply');
for (const sensitiveField of ['email', 'phoneNumber', 'role', 'tokenIdentifier', 'suspended']) {
  assert.equal(sensitiveField in (like?.actor ?? {}), false, `${sensitiveField} is excluded from notification actor data`);
}
assert.ok(
  selectedColumns.some(({ table, columns }) => table === 'users' && !columns.includes('email') && !columns.includes('phone')),
  'notification actors use an explicit public-field projection',
);
assert.equal(listed.find((item) => item.id === 'notification-system')?.actor, null);

notifications = Array.from({ length: 110 }, (_, index) => ({
  _id: `unread-${index}`,
  recipientId: viewerId,
  actorId,
  type: index < 10 ? 'message' : 'like',
  isRead: false,
  createdAt: index,
}));
const unreadResponse = await post('getUnreadNotificationCount');
assert.equal(await unreadResponse.json(), 100, 'unread count excludes messages and preserves the 100 cap');
assert.equal((await post('getUnreadNotificationCount', { userId: otherId })).status, 400, 'count query rejects caller-controlled identity');

notifications = [
  { _id: 'owned-notification', recipientId: viewerId, actorId, type: 'follow', isRead: false, createdAt: 1 },
  { _id: 'other-owned-notification', recipientId: otherId, actorId, type: 'follow', isRead: false, createdAt: 2 },
];
const markOneResponse = await post('markNotificationRead', { id: 'owned-notification' });
assert.equal(markOneResponse.status, 200);
assert.equal(rpcCalls.at(-1)?.args.p_user_id, viewerId, 'notification owner comes from authenticated middleware');
assert.equal(notifications[0].isRead, true);
rpcError = { code: '42501', message: 'forbidden' };
assert.equal((await post('markNotificationRead', { id: 'other-owned-notification' })).status, 403);
rpcError = { code: 'P0002', message: 'missing' };
assert.equal((await post('markNotificationRead', { id: 'missing-notification' })).status, 404);
rpcError = null;
notifications = Array.from({ length: 260 }, (_, index) => ({
  _id: `batch-${index}`,
  recipientId: viewerId,
  actorId,
  type: index === 0 ? 'message' : 'like',
  isRead: false,
  createdAt: index,
}));
const markAllResponse = await post('markAllNotificationsRead');
assert.deepEqual(await markAllResponse.json(), { count: 250 });
assert.equal(notifications.filter((item) => item.isRead).length, 250);
assert.equal(notifications[0].isRead, true, 'mark-all includes messages like Convex');
assert.equal((await post('markAllNotificationsRead', { recipientId: otherId })).status, 400);
assert.equal((await post('markNotificationRead', { id: '' })).status, 400);

subscriptions = [{
  _id: 'active-subscription',
  userId: viewerId,
  endpoint: 'https://push.example.invalid/subscription',
  isActive: true,
}];
assert.equal(await (await post('hasActivePushToken')).json(), true);
subscriptions[0].isActive = false;
fcmTokens = [];
assert.equal(await (await post('hasActivePushToken')).json(), false);
fcmTokens = [{ userId: viewerId, token: 'legacy-token' }];
assert.equal(await (await post('hasActivePushToken')).json(), true, 'legacy active FCM tokens retain source behavior');

subscriptions = [];
const register = await post('upsertWebPushSubscription', {
  endpoint: 'https://push.example.invalid/new',
  p256dh: 'synthetic-p256dh-key-123456',
  auth: 'synthetic-auth-key-123456',
  userAgent: 'Synthetic browser',
});
assert.equal(register.status, 200);
assert.equal(rpcCalls.at(-1)?.args.p_user_id, viewerId, 'subscription identity is server resolved');
assert.equal(subscriptions[0].userId, viewerId);
assert.equal((await post('upsertWebPushSubscription', {
  endpoint: 'http://push.example.invalid/insecure',
  p256dh: 'synthetic-p256dh-key-123456',
  auth: 'synthetic-auth-key-123456',
})).status, 400);
const deactivate = await post('deactivateWebPushSubscription', {
  endpoint: 'https://push.example.invalid/new',
});
assert.equal(deactivate.status, 200);
assert.equal(subscriptions[0].isActive, false);
assert.equal(rpcCalls.at(-1)?.args.p_user_id, viewerId, 'deactivation is scoped to the authenticated user');
assert.equal((await post('upsertWebPushSubscription', {}, null)).status, 404);

rpcResult = { liked: true, likesCount: 1 };
const postLike = await post('toggleLikePost', { postId: 'post-a' });
assert.deepEqual(await postLike.json(), { liked: true, likesCount: 1 });
assert.equal(rpcCalls.at(-1)?.name, 'toggle_lalao_post_like');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, viewerId, 'post like actor comes from authenticated middleware');
assert.equal((await post('toggleLikePost', { postId: 'post-a', userId: otherId })).status, 400);
assert.equal((await post('toggleLikePost', {}, null)).status, 404);
assert.equal((await post('toggleLikeComment', { commentId: 'comment-a' })).status, 200);
assert.equal(rpcCalls.at(-1)?.name, 'toggle_lalao_comment_like');
assert.equal(rpcCalls.at(-1)?.args.p_user_id, viewerId, 'comment like actor comes from authenticated middleware');
rpcError = { code: 'P0002', message: 'not found' };
assert.equal((await post('toggleLikePost', { postId: 'missing-post' })).status, 404);
rpcError = { code: '22023', message: 'invalid' };
assert.equal((await post('toggleLikeComment', { commentId: 'invalid' })).status, 400);
rpcError = null;
rpcResult = { unexpected: true };
assert.equal((await post('toggleLikePost', { postId: 'post-a' })).status, 500, 'malformed RPC responses are not returned as success');
rpcResult = { liked: true, likesCount: 1 };

queryErrorTable = 'notifications';
assert.equal((await post('listNotifications')).status, 500, 'database read errors are not returned as success-shaped data');
queryErrorTable = null;

console.log('app-social notification tests passed (notification reads, push subscriptions, like RPC routing, identity and error handling; Supabase data mocked).');
