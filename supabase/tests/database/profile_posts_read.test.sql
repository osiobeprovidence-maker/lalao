BEGIN;
SELECT plan(4);

SELECT ok(
  to_regclass('public.idx_posts_profile_author_order') IS NOT NULL,
  'profile post author ordering index exists'
);
SELECT ok(
  pg_get_indexdef('public.idx_posts_profile_author_order'::regclass)
    LIKE '%("authorId", "createdAt" DESC, _id DESC)%',
  'profile post index supports deterministic cursor ordering'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public."posts"', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public."posts"', 'SELECT'),
  'profile post data is not directly readable by browser roles'
);
SELECT ok(
  has_table_privilege('service_role', 'public."posts"', 'SELECT'),
  'trusted Edge Function role can execute the profile read'
);

SELECT * FROM finish();
ROLLBACK;
