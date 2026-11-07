BEGIN;
SELECT plan(35);

SELECT ok(
  to_regprocedure('public.toggle_lalao_post_like(text,text)') IS NOT NULL,
  'post-like RPC exists'
);
SELECT ok(
  to_regprocedure('public.toggle_lalao_comment_like(text,text)') IS NOT NULL,
  'comment-like RPC exists'
);
SELECT ok(
  to_regprocedure('public.enqueue_lalao_social_notification(text,text,text,text,text,text,text,text,text,text,text)') IS NOT NULL,
  'shared social notification outbox writer exists'
);
SELECT ok(
  to_regclass('public.idx_likes_by_user_target_unique') IS NOT NULL,
  'like owner and target are unique'
);
SELECT has_table('public', 'notificationOutbox', 'notification delivery outbox exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."notificationOutbox"'::regclass),
  'notification outbox has RLS enabled'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public."notificationOutbox"', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public."notificationOutbox"', 'SELECT')
  AND has_table_privilege('service_role', 'public."notificationOutbox"', 'SELECT'),
  'outbox records are server-only'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.toggle_lalao_post_like(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.toggle_lalao_post_like(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.toggle_lalao_post_like(text,text)', 'EXECUTE'),
  'only trusted server code can toggle post likes'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.toggle_lalao_comment_like(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.toggle_lalao_comment_like(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.toggle_lalao_comment_like(text,text)', 'EXECUTE'),
  'only trusted server code can toggle comment likes'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.enqueue_lalao_social_notification(text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.enqueue_lalao_social_notification(text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('service_role', 'public.enqueue_lalao_social_notification(text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE'),
  'the shared outbox writer cannot be invoked directly'
);

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "name", "username", "onboardingStep",
  "followersCount", "followingCount", "createdAt", "updatedAt", "notificationPrefs"
) VALUES
  ('social-like-owner', 'synthetic|social-like-owner', 'Post Owner', 'social_like_owner', 'complete', 0, 0, 1, 1, NULL),
  ('social-like-actor', 'synthetic|social-like-actor', 'Like Actor', 'social_like_actor', 'complete', 0, 0, 1, 1, NULL),
  ('social-like-self', 'synthetic|social-like-self', 'Self Actor', 'social_like_self', 'complete', 0, 0, 1, 1, NULL),
  ('social-like-muted', 'synthetic|social-like-muted', 'Muted Owner', 'social_like_muted', 'complete', 0, 0, 1, 1, '{"likes":false}'::jsonb);

INSERT INTO public."posts" (
  "_id", "authorId", "text", "location", "createdAt", "likesCount", "commentsCount", "repostsCount"
) VALUES
  ('social-like-post', 'social-like-owner', 'A public post excerpt for a like notification', '', 1, 0, 0, 0),
  ('social-self-like-post', 'social-like-self', 'Self post', '', 1, 0, 0, 0),
  ('social-muted-like-post', 'social-like-muted', 'Muted post', '', 1, 0, 0, 0);

INSERT INTO public."comments" (
  "_id", "postId", "authorId", "parentCommentId", "text", "createdAt", "likesCount"
) VALUES
  ('social-like-comment', 'social-like-post', 'social-like-owner', NULL, 'Comment text', 1, 0),
  ('social-like-reply', 'social-like-post', 'social-like-owner', 'social-like-comment', 'Reply text', 2, 0);

SELECT is(
  public.toggle_lalao_post_like('social-like-actor', 'social-like-post'),
  '{"liked":true,"likesCount":1}'::jsonb,
  'post like is inserted and increments the count atomically'
);
SELECT is(
  (SELECT count(*)::integer FROM public."likes"
   WHERE "userId" = 'social-like-actor' AND "targetType" = 'post' AND "targetId" = 'social-like-post'),
  1,
  'one post-like row exists'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications"
   WHERE "recipientId" = 'social-like-owner' AND "actorId" = 'social-like-actor' AND "type" = 'like'),
  1,
  'a non-self post like creates one in-app notification'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM public."notificationOutbox"
    WHERE "recipientId" = 'social-like-owner'
      AND "category" = 'likes'
      AND "status" = 'pending'
      AND "attemptCount" = 0
      AND "payload" ->> 'url' = '/app?tab=home&post=social-like-post'
      AND "payload" ->> 'title' = 'Like Actor liked your post'
  ),
  'eligible push delivery is durably queued with the source deep link'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM public."notificationOutbox" o
    WHERE o."recipientId" = 'social-like-owner'
      AND EXISTS (
        SELECT 1 FROM jsonb_object_keys(o."payload") AS key
        WHERE key NOT IN ('title', 'body', 'url', 'tag')
      )
  ),
  'outbox payload contains only presentation fields'
);
SELECT is(
  public.toggle_lalao_post_like('social-like-actor', 'social-like-post'),
  '{"liked":false,"likesCount":0}'::jsonb,
  'a repeated toggle removes the like and decrements without going negative'
);
SELECT is(
  (SELECT count(*)::integer FROM public."likes"
   WHERE "userId" = 'social-like-actor' AND "targetType" = 'post' AND "targetId" = 'social-like-post'),
  0,
  'unlike leaves no duplicate or stale like row'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications"
   WHERE "recipientId" = 'social-like-owner' AND "actorId" = 'social-like-actor' AND "type" = 'like'),
  1,
  'unlike does not remove the historical notification'
);
SELECT is(
  public.toggle_lalao_post_like('social-like-self', 'social-self-like-post'),
  '{"liked":true,"likesCount":1}'::jsonb,
  'self-like updates the relationship and counter'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications" WHERE "recipientId" = 'social-like-self'),
  0,
  'self-likes do not create notifications'
);
SELECT is(
  public.toggle_lalao_post_like('social-like-actor', 'social-muted-like-post'),
  '{"liked":true,"likesCount":1}'::jsonb,
  'muted push preference does not block the in-app like'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications"
   WHERE "recipientId" = 'social-like-muted' AND "type" = 'like'),
  1,
  'muted push preference preserves in-app notification creation'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notificationOutbox"
   WHERE "recipientId" = 'social-like-muted' AND "category" = 'likes' AND "status" = 'suppressed'),
  1,
  'disabled like preference suppresses push queueing'
);
SELECT is(
  public.toggle_lalao_comment_like('social-like-actor', 'social-like-comment'),
  '{"liked":true,"likesCount":1}'::jsonb,
  'comment like updates the comment count'
);
SELECT is(
  (SELECT "type" FROM public."notifications"
   WHERE "recipientId" = 'social-like-owner' AND "commentId" = 'social-like-comment'),
  'comment_like',
  'comment likes preserve the notification category'
);
SELECT is(
  public.toggle_lalao_comment_like('social-like-actor', 'social-like-reply'),
  '{"liked":true,"likesCount":1}'::jsonb,
  'reply-like updates the reply count'
);
SELECT is(
  (SELECT "type" FROM public."notifications"
   WHERE "recipientId" = 'social-like-owner' AND "commentId" = 'social-like-reply'),
  'reply_like',
  'reply likes preserve the reply notification category'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notificationOutbox"
   WHERE "recipientId" = 'social-like-owner' AND "category" = 'comments' AND "status" = 'pending'),
  2,
  'comment and reply push events are independently queued'
);
SELECT throws_ok(
  $$SELECT public.toggle_lalao_post_like('missing-user', 'social-like-post')$$,
  'P0002',
  'User not found',
  'unmapped user identifiers cannot write likes'
);
SELECT throws_ok(
  $$SELECT public.toggle_lalao_post_like('social-like-actor', 'missing-post')$$,
  'P0002',
  'Post not found',
  'missing posts are rejected'
);
SELECT throws_ok(
  $$SELECT public.toggle_lalao_comment_like('social-like-actor', 'missing-comment')$$,
  'P0002',
  'Comment not found',
  'missing comments are rejected'
);
SELECT throws_ok(
  $$SELECT public.toggle_lalao_post_like('', 'social-like-post')$$,
  '22023',
  'Invalid like request',
  'malformed like requests are rejected'
);
SELECT ok(
  (SELECT "likesCount" >= 0 FROM public."posts" WHERE "_id" = 'social-like-post')
  AND (SELECT "likesCount" >= 0 FROM public."comments" WHERE "_id" = 'social-like-comment'),
  'post and comment counters remain nonnegative'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."notificationOutbox"'::regclass
      AND conname = 'notificationOutbox_notificationId_key'
      AND contype = 'u'
  ),
  'outbox records are unique per persisted in-app notification'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM public."notificationOutbox"
    WHERE "recipientId" = 'social-like-owner'
      AND "category" = 'comments'
      AND "payload" ->> 'url' = '/app?tab=home&post=social-like-post'
  ),
  'comment and reply deliveries preserve the source post destination'
);

SELECT * FROM finish();
ROLLBACK;
