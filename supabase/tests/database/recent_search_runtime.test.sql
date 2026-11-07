BEGIN;
SELECT plan(31);

SELECT ok(to_regprocedure('public.upsert_lalao_recent_search(text,jsonb)') IS NOT NULL, 'recent search upsert RPC exists');
SELECT ok(to_regprocedure('public.remove_lalao_recent_search(text,text)') IS NOT NULL, 'recent search delete RPC exists');
SELECT ok(to_regprocedure('public.clear_lalao_recent_searches(text)') IS NOT NULL, 'recent search clear RPC exists');
SELECT ok(NOT has_function_privilege('anon', 'public.upsert_lalao_recent_search(text,jsonb)', 'EXECUTE'), 'anon cannot upsert recent searches');
SELECT ok(NOT has_function_privilege('authenticated', 'public.upsert_lalao_recent_search(text,jsonb)', 'EXECUTE'), 'authenticated clients cannot bypass the Edge Function to upsert recent searches');
SELECT ok(has_function_privilege('service_role', 'public.upsert_lalao_recent_search(text,jsonb)', 'EXECUTE'), 'trusted server can upsert recent searches');
SELECT ok(NOT has_function_privilege('anon', 'public.remove_lalao_recent_search(text,text)', 'EXECUTE'), 'anon cannot remove recent searches');
SELECT ok(NOT has_function_privilege('authenticated', 'public.remove_lalao_recent_search(text,text)', 'EXECUTE'), 'authenticated clients cannot bypass the Edge Function to remove recent searches');
SELECT ok(has_function_privilege('service_role', 'public.remove_lalao_recent_search(text,text)', 'EXECUTE'), 'trusted server can remove recent searches');
SELECT ok(NOT has_function_privilege('anon', 'public.clear_lalao_recent_searches(text)', 'EXECUTE'), 'anon cannot clear recent searches');
SELECT ok(NOT has_function_privilege('authenticated', 'public.clear_lalao_recent_searches(text)', 'EXECUTE'), 'authenticated clients cannot bypass the Edge Function to clear recent searches');
SELECT ok(has_function_privilege('service_role', 'public.clear_lalao_recent_searches(text)', 'EXECUTE'), 'trusted server can clear recent searches');

INSERT INTO public."users" ("_id", "tokenIdentifier", "onboardingStep", "createdAt", "updatedAt") VALUES
  ('recent_runtime_user_one', 'synthetic|recent-one', 'complete', 1, 1),
  ('recent_runtime_user_two', 'synthetic|recent-two', 'complete', 1, 1);

SELECT set_config('test.recent_runtime_id', public.upsert_lalao_recent_search(
  'recent_runtime_user_one', '{"query":" synthetic query ","type":"keyword","title":"First title","userId":"recent_runtime_user_two","_id":"attacker-controlled"}'::jsonb
), true);
SELECT set_config('test.recent_runtime_timestamp', (SELECT "timestamp"::bigint::text FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), true);
SELECT is((SELECT count(*)::integer FROM public."recentSearches" WHERE "userId" = 'recent_runtime_user_one'), 1, 'first search creates one row for the server-resolved owner');
SELECT is((SELECT "query" FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), 'synthetic query', 'search query is trimmed');
SELECT is((SELECT "userId" FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), 'recent_runtime_user_one', 'caller payload cannot choose the owner');
SELECT is((SELECT "_id" FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), current_setting('test.recent_runtime_id'), 'caller payload cannot choose the row ID');
SELECT is(
  public.upsert_lalao_recent_search('recent_runtime_user_one', '{"query":"synthetic query","type":"keyword","title":"Updated title"}'::jsonb),
  current_setting('test.recent_runtime_id'),
  'matching query reuses its existing row'
);
SELECT is((SELECT "title" FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), 'Updated title', 'matching query refreshes the saved title');
SELECT ok((SELECT state.revision = search."timestamp"::bigint AND NOT state.deleted FROM public."recentSearchShadowState" AS state JOIN public."recentSearches" AS search ON search."_id" = state.search_id WHERE search."_id" = current_setting('test.recent_runtime_id')), 'Supabase writes advance shadow revision state');
SELECT throws_ok(
  format('SELECT public.remove_lalao_recent_search(%L, %L)', 'recent_runtime_user_two', current_setting('test.recent_runtime_id')),
  '42501', 'Unauthorized to remove this search item', 'one user cannot remove another user search'
);
SELECT is(public.remove_lalao_recent_search('recent_runtime_user_one', current_setting('test.recent_runtime_id')), true, 'owner can remove a recent search');
SELECT is((SELECT count(*)::integer FROM public."recentSearches" WHERE "_id" = current_setting('test.recent_runtime_id')), 0, 'removed search row is deleted');
SELECT ok((SELECT state.deleted AND state.revision > current_setting('test.recent_runtime_timestamp')::bigint FROM public."recentSearchShadowState" AS state WHERE state.search_id = current_setting('test.recent_runtime_id')), 'remove writes a tombstone newer than the search row');
SELECT is(
  public.apply_recent_search_shadow(
    current_setting('test.recent_runtime_id'), 'recent_runtime_user_one', current_setting('test.recent_runtime_timestamp')::bigint, false,
    jsonb_build_object('_id', current_setting('test.recent_runtime_id'), '_creationTime', 1, 'userId', 'recent_runtime_user_one',
      'query', 'synthetic query', 'type', 'keyword', 'timestamp', current_setting('test.recent_runtime_timestamp')::bigint)
  ),
  'stale',
  'delayed Convex mirror cannot resurrect a directly removed search'
);
SELECT is(public.remove_lalao_recent_search('recent_runtime_user_one', current_setting('test.recent_runtime_id')), true, 'repeated delete is idempotent');

SELECT public.upsert_lalao_recent_search('recent_runtime_user_one', '{"query":"clear-one","type":"keyword"}'::jsonb);
SELECT public.upsert_lalao_recent_search('recent_runtime_user_one', '{"query":"clear-two","type":"keyword"}'::jsonb);
SELECT is(public.clear_lalao_recent_searches('recent_runtime_user_one'), 2, 'clear reports the number of removed rows');
SELECT is((SELECT count(*)::integer FROM public."recentSearches" WHERE "userId" = 'recent_runtime_user_one'), 0, 'clear removes only the owner search rows');
SELECT is((SELECT count(*)::integer FROM public."recentSearchShadowState" WHERE user_id = 'recent_runtime_user_one' AND deleted), 3, 'clear retains tombstones for removed search IDs');
SELECT throws_ok(
  $$SELECT public.upsert_lalao_recent_search('recent_runtime_user_one', '{"query":"bad","type":"wallet"}'::jsonb)$$,
  '22023', 'Invalid recent search type', 'upsert rejects unknown search types'
);
SELECT count(*) FROM (
  SELECT public.upsert_lalao_recent_search('recent_runtime_user_two', jsonb_build_object('query', 'trim-' || series, 'type', 'keyword'))
    FROM generate_series(1, 51) AS series
) AS inserted_searches;
SELECT is((SELECT count(*)::integer FROM public."recentSearches" WHERE "userId" = 'recent_runtime_user_two'), 50, 'history is trimmed to fifty items');
SELECT is((SELECT count(*)::integer FROM public."recentSearchShadowState" WHERE user_id = 'recent_runtime_user_two' AND deleted), 1, 'automatic trimming creates an anti-resurrection tombstone');

SELECT * FROM finish();
ROLLBACK;
