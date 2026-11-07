BEGIN;
SELECT plan(22);

SELECT ok(
  to_regprocedure('public.upsert_lalao_web_push_subscription(text,text,text,text,text)') IS NOT NULL,
  'Web Push registration RPC exists'
);
SELECT ok(
  to_regprocedure('public.deactivate_lalao_web_push_subscription(text,text)') IS NOT NULL,
  'Web Push deactivation RPC exists'
);
SELECT ok(
  to_regprocedure('public.mark_lalao_user_notifications_read(text,text)') IS NOT NULL,
  'notification read RPC exists'
);
SELECT ok(
  to_regclass('public.idx_pushSubscriptions_endpoint_unique') IS NOT NULL,
  'a unique endpoint index prevents duplicate Web Push records'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.upsert_lalao_web_push_subscription(text,text,text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.upsert_lalao_web_push_subscription(text,text,text,text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.upsert_lalao_web_push_subscription(text,text,text,text,text)', 'EXECUTE'),
  'only trusted server code can register Web Push subscriptions'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.deactivate_lalao_web_push_subscription(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.deactivate_lalao_web_push_subscription(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.deactivate_lalao_web_push_subscription(text,text)', 'EXECUTE'),
  'only trusted server code can deactivate Web Push subscriptions'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.mark_lalao_user_notifications_read(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.mark_lalao_user_notifications_read(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.mark_lalao_user_notifications_read(text,text)', 'EXECUTE'),
  'only trusted server code can mutate notification read state'
);

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "name", "username", "onboardingStep",
  "followersCount", "followingCount", "createdAt", "updatedAt"
) VALUES
  ('notification-owner-a', 'synthetic|notification-a', 'Owner A', 'notification_a', 'complete', 0, 0, 1, 1),
  ('notification-owner-b', 'synthetic|notification-b', 'Owner B', 'notification_b', 'complete', 0, 0, 1, 1);

CREATE TEMP TABLE registered_subscription AS
SELECT public.upsert_lalao_web_push_subscription(
  'notification-owner-a',
  'https://push.example.invalid/subscription-a',
  'synthetic-p256dh-key-123456',
  'synthetic-auth-key-123456',
  'Synthetic browser'
) AS id;
SELECT ok((SELECT id IS NOT NULL FROM registered_subscription), 'Web Push subscription is stored');
SELECT is(
  (SELECT count(*)::integer FROM public."pushSubscriptions" WHERE "endpoint" = 'https://push.example.invalid/subscription-a'),
  1,
  'registration creates one endpoint record'
);
SELECT is(
  public.upsert_lalao_web_push_subscription(
    'notification-owner-a',
    'https://push.example.invalid/subscription-a',
    'synthetic-p256dh-key-updated',
    'synthetic-auth-key-updated',
    NULL
  ),
  (SELECT id FROM registered_subscription),
  'repeat registration updates the existing endpoint'
);
SELECT is(
  (SELECT "userAgent" FROM public."pushSubscriptions" WHERE "endpoint" = 'https://push.example.invalid/subscription-a'),
  'Synthetic browser',
  'an omitted user agent preserves the existing device label'
);
SELECT ok(
  NOT public.deactivate_lalao_web_push_subscription('notification-owner-b', 'https://push.example.invalid/subscription-a'),
  'another user cannot deactivate the endpoint'
);
SELECT ok(
  public.deactivate_lalao_web_push_subscription('notification-owner-a', 'https://push.example.invalid/subscription-a'),
  'the owner can deactivate the endpoint'
);
SELECT is(
  (SELECT "isActive" FROM public."pushSubscriptions" WHERE "endpoint" = 'https://push.example.invalid/subscription-a'),
  false,
  'deactivation retains the subscription record as inactive'
);
SELECT throws_ok(
  $$SELECT public.upsert_lalao_web_push_subscription('notification-owner-a', 'http://push.example.invalid/subscription', 'synthetic-p256dh-key-123456', 'synthetic-auth-key-123456', NULL)$$,
  '22023',
  'Invalid Web Push subscription',
  'non-HTTPS push endpoints are rejected'
);

INSERT INTO public."notifications" (
  "_id", "recipientId", "actorId", "type", "isRead", "createdAt"
) VALUES
  ('notification-owned-a', 'notification-owner-a', 'notification-owner-b', 'follow', false, 1),
  ('notification-owned-b', 'notification-owner-b', 'notification-owner-a', 'follow', false, 2);
SELECT is(
  public.mark_lalao_user_notifications_read('notification-owner-a', 'notification-owned-a'),
  1,
  'the owner can mark their notification as read'
);
SELECT is(
  (SELECT "isRead" FROM public."notifications" WHERE "_id" = 'notification-owned-a'),
  true,
  'the owner notification becomes read'
);
SELECT throws_ok(
  $$SELECT public.mark_lalao_user_notifications_read('notification-owner-a', 'notification-owned-b')$$,
  '42501',
  'Unauthorized notification access',
  'a user cannot mark another user notification as read'
);
SELECT throws_ok(
  $$SELECT public.mark_lalao_user_notifications_read('notification-owner-a', 'missing-notification')$$,
  'P0002',
  'Notification not found',
  'missing notifications return a not-found error'
);

INSERT INTO public."notifications" (
  "_id", "recipientId", "actorId", "type", "isRead", "createdAt"
)
SELECT
  'notification-batch-' || n,
  'notification-owner-a',
  'notification-owner-b',
  CASE WHEN n = 1 THEN 'message' ELSE 'like' END,
  false,
  n + 10
FROM generate_series(1, 260) AS n;
SELECT is(
  public.mark_lalao_user_notifications_read('notification-owner-a', NULL),
  250,
  'mark-all preserves the source operation limit of 250 records'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications" WHERE "recipientId" = 'notification-owner-a' AND "isRead" = false),
  10,
  'the remaining unread notifications are preserved for a later bounded call'
);
SELECT ok(
  (SELECT "isRead" FROM public."notifications" WHERE "_id" = 'notification-batch-1'),
  'mark-all preserves Convex behavior by including message notifications'
);

SELECT * FROM finish();
ROLLBACK;
