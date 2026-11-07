BEGIN;
SELECT plan(6);

SELECT ok(
  to_regclass('public.idx_posts_feed_created_id') IS NOT NULL,
  'feed timestamp and id ordering index exists'
);
SELECT ok(
  pg_get_indexdef('public.idx_posts_feed_created_id'::regclass)
    LIKE '%("createdAt" DESC, _id DESC)%',
  'feed index supports deterministic descending key ordering'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."posts"'::regclass),
  'posts retain row-level security'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public."posts"', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public."posts"', 'SELECT'),
  'feed data is not directly readable by browser roles'
);
SELECT ok(
  has_table_privilege('service_role', 'public."posts"', 'SELECT'),
  'trusted Edge Function role can execute the feed read path'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND roles @> ARRAY['anon']::name[]
  ),
  'no anonymous policy bypasses the authenticated feed handler'
);

SELECT * FROM finish();
ROLLBACK;
