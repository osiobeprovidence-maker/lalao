BEGIN;
SELECT plan(13);

CREATE TEMP TABLE people_discovery_baseline AS
SELECT count(*)::bigint AS eligible_count
FROM public."users"
WHERE COALESCE("suspended", false) = false
  AND COALESCE("accessStatus", 'available') NOT IN ('country_restricted', 'waitlisted');

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "name", "username", "interests",
  "followersCount", "followingCount", "createdAt", "updatedAt",
  "onboardingStep", "accessStatus", "suspended", "verificationTier"
) VALUES
  ('people-discovery-viewer-test', 'people-discovery-viewer-token', 'Viewer', 'pd-viewer', '["pd-interest-a","pd-interest-b"]'::jsonb, 0, 0, 1, 1, 'complete', 'available', false, 'none'),
  ('people-discovery-shared-test', 'people-discovery-shared-token', 'Shared interests', 'pd-shared', '["pd-interest-a","pd-interest-b"]'::jsonb, 2, 0, 2, 2, 'complete', 'available', false, 'verified'),
  ('people-discovery-popular-test', 'people-discovery-popular-token', 'Popular', 'pd-popular', '["pd-interest-a"]'::jsonb, 99, 0, 3, 3, 'complete', 'available', false, 'none'),
  ('people-discovery-followed-test', 'people-discovery-followed-token', 'Followed', 'pd-followed', '["pd-interest-a","pd-interest-b"]'::jsonb, 100, 0, 4, 4, 'complete', 'available', false, 'none'),
  ('people-discovery-suspended-test', 'people-discovery-suspended-token', 'Suspended', 'pd-suspended', '["pd-interest-a","pd-interest-b"]'::jsonb, 100, 0, 5, 5, 'complete', 'available', true, 'none'),
  ('people-discovery-restricted-test', 'people-discovery-restricted-token', 'Restricted', 'pd-restricted', '["pd-interest-a","pd-interest-b"]'::jsonb, 100, 0, 6, 6, 'complete', 'country_restricted', false, 'none'),
  ('people-discovery-waitlisted-test', 'people-discovery-waitlisted-token', 'Waitlisted', 'pd-waitlisted', '["pd-interest-a","pd-interest-b"]'::jsonb, 100, 0, 7, 7, 'complete', 'waitlisted', false, 'none'),
  ('people-discovery-follower-test', 'people-discovery-follower-token', 'Follower', 'pd-follower', '["pd-interest-a","pd-interest-b"]'::jsonb, 0, 1, 8, 8, 'complete', 'available', false, 'none');

INSERT INTO public."follows" ("_id", "followerId", "followingId", "createdAt")
VALUES
  ('people-discovery-follow-row-test', 'people-discovery-viewer-test', 'people-discovery-followed-test', 1),
  ('people-discovery-inbound-row-test', 'people-discovery-follower-test', 'people-discovery-viewer-test', 2);

SELECT is(
  public.get_lalao_discoverable_people_count('people-discovery-viewer-test'),
  (SELECT eligible_count + 3 FROM people_discovery_baseline),
  'count excludes the viewer, followed, suspended, country-restricted and waitlisted accounts'
);

SELECT is(
  public.get_lalao_discoverable_people('people-discovery-viewer-test', 1)->0->>'id',
  'people-discovery-shared-test',
  'ranking prioritizes shared interests over a higher follower count'
);

SELECT is(
  public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->1->>'id',
  'people-discovery-follower-test',
  'eligible candidate order follows source tie-break ranking and excludes ineligible accounts'
);

SELECT is(
  public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->1->>'relationship',
  'follower',
  'candidate relationship reflects an inbound follow'
);

SELECT is(
  public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->0->>'verificationTier',
  'verified',
  'active non-expired verification is projected'
);

SELECT ok(
  NOT (public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->0 ? 'email')
  AND NOT (public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->0 ? 'phone')
  AND NOT (public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->0 ? 'tokenIdentifier')
  AND NOT (public.get_lalao_discoverable_people('people-discovery-viewer-test', 2)->0 ? 'role'),
  'result projection excludes private account and authentication fields'
);

SELECT is(
  jsonb_array_length(public.get_lalao_discoverable_people('people-discovery-viewer-test', 0)),
  0,
  'zero limit returns no results'
);

SELECT throws_ok(
  $$SELECT public.get_lalao_discoverable_people('people-discovery-viewer-test', 101)$$,
  '22023',
  'Invalid discoverable people limit',
  'limit above the server bound is rejected'
);

SELECT throws_ok(
  $$SELECT public.get_lalao_discoverable_people('missing-people-discovery-viewer', 10)$$,
  '42501',
  'Mapped viewer profile not found',
  'unknown mapped viewer is rejected'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_lalao_discoverable_people(text,integer)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.get_lalao_discoverable_people(text,integer)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.get_lalao_discoverable_people_count(text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.get_lalao_discoverable_people_count(text)', 'EXECUTE'),
  'browser roles cannot directly execute discovery RPCs'
);

SELECT ok(
  has_function_privilege('service_role', 'public.get_lalao_discoverable_people(text,integer)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.get_lalao_discoverable_people_count(text)', 'EXECUTE'),
  'trusted Edge Function role can execute discovery RPCs'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public."users"', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public."users"', 'SELECT')
  AND NOT has_table_privilege('anon', 'public."follows"', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public."follows"', 'SELECT'),
  'browser roles cannot directly read discovery source tables'
);

SELECT is(
  public.get_lalao_discoverable_people_count('people-discovery-viewer-test'),
  (SELECT eligible_count + 3 FROM people_discovery_baseline),
  'duplicate discovery requests do not alter counts or create recommendation records'
);

SELECT * FROM finish();
ROLLBACK;
