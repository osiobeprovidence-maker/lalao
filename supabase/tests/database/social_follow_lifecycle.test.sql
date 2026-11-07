BEGIN;
SELECT plan(23);

SELECT ok(
  to_regprocedure('public.toggle_lalao_user_follow(text,text)') IS NOT NULL,
  'follow lifecycle RPC exists'
);
SELECT ok(
  to_regclass('public.idx_follows_unique_follower_following') IS NOT NULL,
  'a unique relationship index prevents duplicate follow edges'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.toggle_lalao_user_follow(text,text)', 'EXECUTE'),
  'anonymous clients cannot toggle follows'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.toggle_lalao_user_follow(text,text)', 'EXECUTE'),
  'authenticated clients cannot bypass the verified identity resolver'
);
SELECT ok(
  has_function_privilege('service_role', 'public.toggle_lalao_user_follow(text,text)', 'EXECUTE'),
  'trusted server role can toggle follows'
);

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "name", "username", "notificationPrefs",
  "onboardingStep", "followersCount", "followingCount", "createdAt", "updatedAt"
) VALUES
  ('follow-owner-a', 'synthetic|follow-a', 'Follower', 'follow_a', '{"follows":true,"desktop":true}', 'complete', 0, 0, 1, 1),
  ('follow-owner-b', 'synthetic|follow-b', 'Target', 'follow_b', '{"follows":true,"desktop":true}', 'complete', 0, 0, 1, 1);

CREATE TEMP TABLE follow_result AS
SELECT public.toggle_lalao_user_follow('follow-owner-a', 'follow-owner-b') AS result;
SELECT is((SELECT result->>'following' FROM follow_result), 'true', 'the first toggle follows the target');
SELECT ok((SELECT result ? 'notificationId' FROM follow_result), 'the follow response references its notification');
SELECT is(
  (SELECT count(*)::integer FROM public."follows" WHERE "followerId" = 'follow-owner-a' AND "followingId" = 'follow-owner-b'),
  1,
  'one relationship row is created'
);
SELECT is(
  (SELECT "followingCount" FROM public."users" WHERE "_id" = 'follow-owner-a'),
  1::double precision,
  'follower followingCount increments atomically'
);
SELECT is(
  (SELECT "followersCount" FROM public."users" WHERE "_id" = 'follow-owner-b'),
  1::double precision,
  'target followersCount increments atomically'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications" WHERE "recipientId" = 'follow-owner-b' AND "actorId" = 'follow-owner-a' AND "type" = 'follow'),
  1,
  'one in-app follow notification is created'
);
SELECT is(
  (SELECT "isRead" FROM public."notifications" WHERE "_id" = (SELECT result->>'notificationId' FROM follow_result)),
  false,
  'follow notification starts unread'
);

SELECT is(
  public.toggle_lalao_user_follow('follow-owner-a', 'follow-owner-b')->>'following',
  'false',
  'a repeated toggle unfollows'
);
SELECT is(
  (SELECT count(*)::integer FROM public."follows" WHERE "followerId" = 'follow-owner-a' AND "followingId" = 'follow-owner-b'),
  0,
  'unfollow removes the relationship'
);
SELECT is(
  (SELECT "followingCount" FROM public."users" WHERE "_id" = 'follow-owner-a'),
  0::double precision,
  'unfollow decrements followingCount'
);
SELECT is(
  (SELECT "followersCount" FROM public."users" WHERE "_id" = 'follow-owner-b'),
  0::double precision,
  'unfollow decrements followersCount'
);
SELECT is(
  (SELECT count(*)::integer FROM public."notifications" WHERE "recipientId" = 'follow-owner-b' AND "type" = 'follow'),
  1,
  'unfollow does not create a notification'
);

SELECT public.toggle_lalao_user_follow('follow-owner-a', 'follow-owner-b');
UPDATE public."users" SET "followingCount" = 0 WHERE "_id" = 'follow-owner-a';
UPDATE public."users" SET "followersCount" = 0 WHERE "_id" = 'follow-owner-b';
SELECT is(
  public.toggle_lalao_user_follow('follow-owner-a', 'follow-owner-b')->>'following',
  'false',
  'following can be toggled off after a retry'
);
SELECT is(
  (SELECT "followingCount" FROM public."users" WHERE "_id" = 'follow-owner-a'),
  0::double precision,
  'followingCount cannot become negative'
);
SELECT is(
  (SELECT "followersCount" FROM public."users" WHERE "_id" = 'follow-owner-b'),
  0::double precision,
  'followersCount cannot become negative'
);

SELECT throws_ok(
  $$SELECT public.toggle_lalao_user_follow('follow-owner-a', 'follow-owner-a')$$,
  '22023',
  'Cannot follow yourself',
  'self-follow is rejected'
);
SELECT throws_ok(
  $$SELECT public.toggle_lalao_user_follow('follow-owner-a', 'missing-follow-user')$$,
  'P0002',
  'User not found',
  'a nonexistent target is rejected'
);
INSERT INTO public."follows" (
  "_id", "followerId", "followingId", "createdAt"
) VALUES (
  'follow-unique-seed', 'follow-owner-a', 'follow-owner-b', 2
);
SELECT throws_ok(
  $$INSERT INTO public."follows" ("_id", "followerId", "followingId", "createdAt")
    VALUES ('duplicate-follow', 'follow-owner-a', 'follow-owner-b', 2)$$,
  '23505',
  NULL,
  'the unique index rejects duplicate relationship rows'
);

SELECT * FROM finish();
ROLLBACK;
