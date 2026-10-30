begin;
select plan(26);

select is(
  (select count(*)::integer from information_schema.columns where table_schema = 'public' and column_name = '_creationTime'),
  102,
  'all Convex tables exist in the local public schema'
);
select has_table('public', 'recentSearches', 'recent searches pilot table exists');
select has_column('public', 'recentSearches', 'userId', 'recent searches retains its owner column');
select has_index('public', 'recentSearches', 'idx_recentSearches_by_user_time', 'recent searches time index exists');
select ok(
  exists (select 1 from pg_constraint where conname = 'fk_recentSearches_userId_users' and contype = 'f'),
  'recent searches owner relationship is enforced by a foreign key'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'ck_recentSearches_type_enum' and contype = 'c'),
  'recent search type validator is represented as a check constraint'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'recentSearches'),
  'RLS is enabled for recent searches'
);
select ok(not has_table_privilege('anon', 'public."recentSearches"', 'SELECT'), 'anon cannot read recent searches');
select ok(not has_table_privilege('authenticated', 'public."recentSearches"', 'SELECT'), 'authenticated clients cannot bypass the server authorization layer');
select ok(has_table_privilege('service_role', 'public."recentSearches"', 'SELECT'), 'trusted server role can access the table');
select has_index('public', 'bachsWebhookEvents', 'uq_bachsWebhookEvents_eventId', 'Bachs event delivery is uniquely keyed for idempotency');

select has_table('public', 'recentSearchShadowState', 'shadow ordering state table exists');
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'recentSearchShadowState'),
  'shadow ordering state has RLS enabled'
);
select ok(not has_table_privilege('anon', 'public."recentSearchShadowState"', 'SELECT'), 'anon cannot read shadow ordering state');
select ok(
  not has_function_privilege('authenticated', 'public.apply_recent_search_shadow(text,text,bigint,boolean,jsonb)', 'EXECUTE'),
  'authenticated clients cannot invoke the server-only shadow RPC'
);
select ok(
  has_function_privilege('service_role', 'public.apply_recent_search_shadow(text,text,bigint,boolean,jsonb)', 'EXECUTE'),
  'trusted server role can invoke the shadow RPC'
);

-- Synthetic fixtures only. This test is wrapped in a transaction and rolled back.
insert into public."users" ("_id", "tokenIdentifier", "onboardingStep", "createdAt", "updatedAt")
values
  ('shadow_user_one', 'synthetic|shadow-one', 'complete', 1, 1),
  ('shadow_user_two', 'synthetic|shadow-two', 'complete', 1, 1);

select is(
  public.apply_recent_search_shadow(
    'shadow_search_one', 'shadow_user_one', 100, false,
    '{"_id":"shadow_search_one","_creationTime":1,"userId":"shadow_user_one","query":"synthetic alpha","type":"keyword","timestamp":100}'::jsonb
  ),
  'mirrored',
  'first sync is applied'
);
select is((select count(*)::integer from public."recentSearches" where "_id" = 'shadow_search_one'), 1, 'first sync creates exactly one shadow row');
select is(
  public.apply_recent_search_shadow(
    'shadow_search_one', 'shadow_user_one', 100, false,
    '{"_id":"shadow_search_one","_creationTime":1,"userId":"shadow_user_one","query":"synthetic alpha","type":"keyword","timestamp":100}'::jsonb
  ),
  'duplicate',
  'retrying an already-applied sync is idempotent'
);
select is(
  public.apply_recent_search_shadow('shadow_search_one', 'shadow_user_one', 101, true, null),
  'deleted',
  'newer delete advances the tombstone and deletes the shadow row'
);
select is((select count(*)::integer from public."recentSearches" where "_id" = 'shadow_search_one'), 0, 'delete removes the shadow row');
select is(
  public.apply_recent_search_shadow(
    'shadow_search_one', 'shadow_user_one', 100, false,
    '{"_id":"shadow_search_one","_creationTime":1,"userId":"shadow_user_one","query":"synthetic alpha","type":"keyword","timestamp":100}'::jsonb
  ),
  'stale',
  'delayed pre-delete sync is rejected by the tombstone revision'
);
select is((select count(*)::integer from public."recentSearches" where "_id" = 'shadow_search_one'), 0, 'delayed sync cannot recreate a deleted shadow row');
select is(
  public.apply_recent_search_shadow('shadow_search_one', 'shadow_user_one', 101, true, null),
  'duplicate',
  'retrying an already-applied delete is idempotent'
);
select throws_ok(
  $$select public.apply_recent_search_shadow('shadow_search_one', 'shadow_user_two', 102, true, null)$$,
  'P0001',
  'Recent search owner does not match shadow state',
  'a different owner cannot overwrite the established shadow state'
);
select is(
  (select revision from public."recentSearchShadowState" where search_id = 'shadow_search_one'),
  101::bigint,
  'stale and cross-owner attempts do not advance the tombstone revision'
);

select * from finish();
rollback;
