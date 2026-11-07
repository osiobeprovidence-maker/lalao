BEGIN;
SELECT plan(47);

CREATE TEMP TABLE auth_migration_test_results (
  name text PRIMARY KEY,
  result jsonb NOT NULL
) ON COMMIT DROP;

SELECT has_function('public', 'backfill_lalao_auth_identities', ARRAY['jsonb'], 'explicit backfill function exists');
SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE oid = 'public.backfill_lalao_auth_identities(jsonb)'::regprocedure),
  'backfill function runs as SECURITY DEFINER'
);
SELECT ok(
  (SELECT proconfig @> ARRAY['search_path=pg_catalog, public'] FROM pg_proc WHERE oid = 'public.backfill_lalao_auth_identities(jsonb)'::regprocedure),
  'backfill function fixes its search_path'
);
SELECT ok(NOT has_function_privilege('anon', 'public.backfill_lalao_auth_identities(jsonb)', 'EXECUTE'), 'anon cannot invoke backfill');
SELECT ok(NOT has_function_privilege('authenticated', 'public.backfill_lalao_auth_identities(jsonb)', 'EXECUTE'), 'authenticated users cannot invoke backfill');
SELECT ok(has_function_privilege('service_role', 'public.backfill_lalao_auth_identities(jsonb)', 'EXECUTE'), 'service_role can invoke backfill');
SELECT ok(
  position('super_admin' IN pg_get_functiondef('public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)'::regprocedure)) = 0,
  'identity provisioning contains no email-based administrator promotion'
);

INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
)
VALUES (
  'authmig_existing_admin', 6000000000000001,
  'https://securetoken.google.com/uselalaoapp|authmig-existing-admin',
  'existing-admin@example.invalid', 'existing-admin@example.invalid', 'Synthetic Existing Admin',
  'authmig_existing_admin', 'complete', 1001, 1002, 'super_admin'
);

SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'authmig-new-provisioned',
    'synthetic-admin-like@example.invalid', true, 'Synthetic New User', NULL, 'password'
  ) IS NOT NULL,
  true,
  'a new verified identity is provisioned'
);
SELECT is(
  (SELECT "role" FROM public."users" WHERE "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|authmig-new-provisioned'),
  'user',
  'new identity is assigned the ordinary user role'
);
SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'authmig-existing-admin',
    'updated-synthetic@example.invalid', true, 'Synthetic Existing Admin', NULL, 'password'
  ),
  'authmig_existing_admin',
  'existing legacy identity resolves to its original user'
);
SELECT is(
  (SELECT "role" FROM public."users" WHERE "_id" = 'authmig_existing_admin'),
  'super_admin',
  'sign-in preserves an existing role without promotion or demotion'
);

INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
)
VALUES
  ('authmig_matching_user', 6000000000000010, 'https://securetoken.google.com/uselalaoapp|authmig-matching', 'matching@example.invalid', 'matching@example.invalid', 'Matching User', 'authmig_matching_user', 'complete', 1010, 1010, 'user'),
  ('authmig_legacy_owner', 6000000000000011, 'https://securetoken.google.com/uselalaoapp|authmig-disagreement', 'legacy-owner@example.invalid', 'legacy-owner@example.invalid', 'Legacy Owner', 'authmig_legacy_owner', 'complete', 1011, 1011, 'user'),
  ('authmig_explicit_owner', 6000000000000012, 'https://one.playsole.xyz|authmig-explicit-owner', 'explicit-owner@example.invalid', 'explicit-owner@example.invalid', 'Explicit Owner', 'authmig_explicit_owner', 'complete', 1012, 1012, 'user'),
  ('authmig_provider_owner', 6000000000000013, 'https://one.playsole.xyz|authmig-provider-owner', 'provider-owner@example.invalid', 'provider-owner@example.invalid', 'Provider Owner', 'authmig_provider_owner', 'complete', 1013, 1013, 'user'),
  ('authmig_token_owner', 6000000000000014, 'https://one.playsole.xyz|authmig-token-owner', 'token-owner@example.invalid', 'token-owner@example.invalid', 'Token Owner', 'authmig_token_owner', 'complete', 1014, 1014, 'user'),
  ('authmig_duplicate_legacy_1', 6000000000000015, 'https://securetoken.google.com/uselalaoapp|authmig-duplicate', 'duplicate-one@example.invalid', 'duplicate-one@example.invalid', 'Duplicate One', 'authmig_duplicate_legacy_1', 'complete', 1015, 1015, 'user'),
  ('authmig_duplicate_legacy_2', 6000000000000016, 'https://securetoken.google.com/uselalaoapp|authmig-duplicate', 'duplicate-two@example.invalid', 'duplicate-two@example.invalid', 'Duplicate Two', 'authmig_duplicate_legacy_2', 'complete', 1016, 1016, 'user'),
  ('authmig_ordinary_user', 6000000000000017, 'https://securetoken.google.com/uselalaoapp|authmig-ordinary', 'ordinary-old@example.invalid', 'ordinary-old@example.invalid', 'Ordinary User', 'authmig_ordinary_user', 'complete', 1017, 1017, 'user'),
  ('authmig_unverified_email_owner', 6000000000000018, 'https://one.playsole.xyz|authmig-email-owner', 'unverified-target@example.invalid', 'unverified-target@example.invalid', 'Email Owner', 'authmig_unverified_email_owner', 'complete', 1018, 1018, 'user'),
  ('authmig_verified_email_owner', 6000000000000019, 'https://one.playsole.xyz|authmig-verified-email-owner', 'verified-target@example.invalid', 'verified-target@example.invalid', 'Verified Email Owner', 'authmig_verified_email_owner', 'complete', 1019, 1019, 'user');

INSERT INTO public."authIdentities" (
  "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier", "emailVerified", "linkedAt"
)
VALUES
  ('authmig_matching_identity', 'authmig_matching_user', 'firebase', 'https://securetoken.google.com/uselalaoapp', 'authmig-matching', 'https://securetoken.google.com/uselalaoapp|authmig-matching', false, 1010),
  ('authmig_disagreement_identity', 'authmig_explicit_owner', 'firebase', 'https://securetoken.google.com/uselalaoapp', 'authmig-disagreement', 'https://securetoken.google.com/uselalaoapp|authmig-disagreement', false, 1012),
  ('authmig_provider_mismatch_identity', 'authmig_provider_owner', 'playsole', 'https://securetoken.google.com/uselalaoapp', 'authmig-provider-mismatch', 'https://securetoken.google.com/uselalaoapp|authmig-provider-mismatch', false, 1013),
  ('authmig_token_mismatch_identity', 'authmig_token_owner', 'firebase', 'https://securetoken.google.com/uselalaoapp', 'authmig-token-mismatch', 'https://one.playsole.xyz|authmig-other-token', false, 1014);

SELECT is(
  public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-matching', NULL, false, NULL, NULL, NULL),
  'authmig_matching_user',
  'matching explicit and legacy mappings resolve to the same user'
);
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-disagreement', NULL, false, NULL, NULL, NULL)$$,
  '23505', 'Explicit and legacy account mappings disagree. Contact support for account recovery.',
  'explicit and legacy mappings to different users are rejected'
);
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-provider-mismatch', NULL, false, NULL, NULL, NULL)$$,
  '23505', 'Provider identity mapping conflicts with the incoming identity. Contact support for account recovery.',
  'explicit mapping provider mismatch is rejected'
);
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-token-mismatch', NULL, false, NULL, NULL, NULL)$$,
  '23505', 'Provider identity mapping conflicts with the incoming identity. Contact support for account recovery.',
  'explicit mapping token identifier mismatch is rejected'
);
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-duplicate', NULL, false, NULL, NULL, NULL)$$,
  '23505', 'Legacy authentication identity conflict. Contact support for account recovery.',
  'duplicate legacy mappings are rejected'
);
SELECT is(
  public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-ordinary', 'ordinary-verified@example.invalid', true, 'Ordinary User', NULL, 'password'),
  'authmig_ordinary_user',
  'verified email does not replace a matching legacy identity owner'
);
SELECT is(
  (SELECT "role" FROM public."users" WHERE "_id" = 'authmig_ordinary_user'),
  'user',
  'verified email cannot promote an existing ordinary user'
);
SELECT isnt(
  public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-unverified-email', 'unverified-target@example.invalid', false, 'Unverified New User', NULL, 'password'),
  'authmig_unverified_email_owner',
  'unverified email does not automatically link an existing account'
);
SELECT is(
  (SELECT "emailNormalized" FROM public."users" WHERE "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|authmig-unverified-email'),
  NULL::text,
  'unverified email is not stored as a verified normalized identity claim'
);
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity('https://securetoken.google.com/uselalaoapp', 'authmig-verified-email-collision', 'verified-target@example.invalid', true, 'Verified Collision', NULL, 'password')$$,
  '23505', 'A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.',
  'verified email collision retains sign-in-then-link behavior'
);
SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE oid = 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)'::regprocedure),
  'identity provisioning remains SECURITY DEFINER'
);
SELECT ok(
  (SELECT proconfig @> ARRAY['search_path=pg_catalog, public'] FROM pg_proc WHERE oid = 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)'::regprocedure),
  'identity provisioning keeps its restricted search_path'
);
SELECT ok(NOT has_function_privilege('anon', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'), 'anon cannot invoke identity provisioning');
SELECT ok(NOT has_function_privilege('authenticated', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'), 'authenticated users cannot invoke identity provisioning directly');
SELECT ok(has_function_privilege('service_role', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'), 'service_role can invoke identity provisioning');

INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
)
SELECT 'authmig_batch_' || lpad(sequence::text, 3, '0'), 8000000000000000,
       'https://securetoken.google.com/uselalaoapp|authmig-batch-' || sequence,
       'batch-' || sequence || '@example.invalid', 'batch-' || sequence || '@example.invalid',
       'Synthetic batch user', 'authmig_batch_' || lpad(sequence::text, 3, '0'),
       'complete', 2000 + sequence, 3000 + sequence, 'user'
  FROM generate_series(1, 101) AS sequence;

CREATE TEMP TABLE auth_migration_batch_snapshot ON COMMIT DROP AS
SELECT "_id", to_jsonb(users) AS row_value
  FROM public."users" AS users
 WHERE "_id" LIKE 'authmig_batch_%';

INSERT INTO auth_migration_test_results(name, result)
VALUES ('batch1', public.backfill_lalao_auth_identities('{"creationTime":7000000000000000,"id":"authmig_cursor_start"}'::jsonb));

SELECT is((SELECT (result->>'processedCount')::integer FROM auth_migration_test_results WHERE name = 'batch1'), 100, 'first page processes exactly 100 synthetic users');
SELECT is((SELECT (result->>'insertedCount')::integer FROM auth_migration_test_results WHERE name = 'batch1'), 100, 'first page inserts 100 identity mappings');
SELECT is((SELECT result->>'done' FROM auth_migration_test_results WHERE name = 'batch1'), 'false', 'first page is not marked complete');
SELECT is((SELECT count(*)::integer FROM public."authIdentities" WHERE "subject" LIKE 'authmig-batch-%'), 100, 'first page mappings persist in the database');

INSERT INTO auth_migration_test_results(name, result)
SELECT 'batch2', public.backfill_lalao_auth_identities(result->'nextCursor')
  FROM auth_migration_test_results WHERE name = 'batch1';

SELECT is((SELECT (result->>'processedCount')::integer FROM auth_migration_test_results WHERE name = 'batch2'), 1, 'second page processes the final synthetic user');
SELECT is((SELECT (result->>'insertedCount')::integer FROM auth_migration_test_results WHERE name = 'batch2'), 1, 'second page inserts the final identity mapping');
SELECT is((SELECT result->>'done' FROM auth_migration_test_results WHERE name = 'batch2'), 'true', 'last page is marked complete');
SELECT is((SELECT count(*)::integer FROM public."authIdentities" WHERE "subject" LIKE 'authmig-batch-%'), 101, 'all 101 identity mappings persist');
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM auth_migration_batch_snapshot AS before
    JOIN public."users" AS after USING ("_id")
    WHERE before.row_value IS DISTINCT FROM to_jsonb(after)
  ),
  'backfill leaves historical user rows unchanged'
);
SELECT is(
  (SELECT count(*)::integer FROM public."authIdentities" AS identity
    JOIN auth_migration_batch_snapshot AS snapshot ON identity."userId" = snapshot."_id"
   WHERE identity."emailVerified" = false
     AND identity."linkedAt" = (snapshot.row_value->>'createdAt')::double precision),
  101,
  'backfilled mappings are unverified and preserve each user creation timestamp'
);

INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
)
VALUES
  ('authmig_bad_format', 9500000000000000, 'legacy-without-separator', 'bad-format@example.invalid', 'bad-format@example.invalid', 'Bad Format', 'authmig_bad_format', 'complete', 4001, 4001, 'user'),
  ('authmig_empty_subject', 9500000000000000, 'https://securetoken.google.com/uselalaoapp|   ', 'empty-subject@example.invalid', 'empty-subject@example.invalid', 'Empty Subject', 'authmig_empty_subject', 'complete', 4002, 4002, 'user'),
  ('authmig_unknown_issuer', 9500000000000000, 'https://untrusted.example.invalid|authmig-unknown', 'unknown-issuer@example.invalid', 'unknown-issuer@example.invalid', 'Unknown Issuer', 'authmig_unknown_issuer', 'complete', 4003, 4003, 'user'),
  ('authmig_consistent', 9500000000000000, 'https://securetoken.google.com/uselalaoapp|authmig-consistent', 'consistent@example.invalid', 'consistent@example.invalid', 'Consistent', 'authmig_consistent', 'complete', 4004, 4004, 'user'),
  ('authmig_playsole', 9500000000000000, 'https://one.playsole.xyz|authmig-playsole', 'playsole@example.invalid', 'playsole@example.invalid', 'Playsole', 'authmig_playsole', 'complete', 4005, 4005, 'user');

INSERT INTO public."authIdentities" (
  "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier", "emailVerified", "linkedAt"
)
VALUES (
  'authmig_linked_identity', 'authmig_consistent', 'firebase',
  'https://securetoken.google.com/uselalaoapp', 'authmig-consistent',
  'https://securetoken.google.com/uselalaoapp|authmig-consistent', false, 4004
);

INSERT INTO auth_migration_test_results(name, result)
VALUES ('classify', public.backfill_lalao_auth_identities('{"creationTime":9000000000000000,"id":"authmig_cursor_start"}'::jsonb));

SELECT is((SELECT (result->>'processedCount')::integer FROM auth_migration_test_results WHERE name = 'classify'), 5, 'classification page processes five synthetic identities');
SELECT is((SELECT (result->>'insertedCount')::integer FROM auth_migration_test_results WHERE name = 'classify'), 1, 'only the supported Playsole identity is newly inserted');
SELECT is((SELECT (result->>'skippedCount')::integer FROM auth_migration_test_results WHERE name = 'classify'), 4, 'malformed, empty, unsupported and already-linked identities are skipped');
SELECT is(
  (SELECT "provider" FROM public."authIdentities" WHERE "issuer" = 'https://one.playsole.xyz' AND "subject" = 'authmig-playsole'),
  'playsole',
  'Playsole issuer is mapped to the Playsole provider'
);

INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
)
VALUES
  ('authmig_conflict_owner', 10500000000000000, 'https://securetoken.google.com/uselalaoapp|authmig-other-subject', 'owner@example.invalid', 'owner@example.invalid', 'Conflict Owner', 'authmig_conflict_owner', 'complete', 5001, 5001, 'user'),
  ('authmig_conflict_target', 10500000000000000, 'https://securetoken.google.com/uselalaoapp|authmig-conflict-subject', 'target@example.invalid', 'target@example.invalid', 'Conflict Target', 'authmig_conflict_target', 'complete', 5002, 5002, 'user');

INSERT INTO public."authIdentities" (
  "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier", "emailVerified", "linkedAt"
)
VALUES (
  'authmig_conflict_identity', 'authmig_conflict_owner', 'firebase',
  'https://securetoken.google.com/uselalaoapp', 'authmig-conflict-subject',
  'https://securetoken.google.com/uselalaoapp|authmig-conflict-subject', false, 5001
);

CREATE TEMP TABLE auth_migration_state_before ON COMMIT DROP AS
SELECT "authIdentitiesBackfilledAt" AS completed_at
  FROM public."authMigrationState"
 WHERE "key" = 'authIdentityV1'
 ORDER BY "_creationTime" DESC
 LIMIT 1;

INSERT INTO auth_migration_test_results(name, result)
VALUES ('conflict1', public.backfill_lalao_auth_identities('{"creationTime":10000000000000000,"id":"authmig_cursor_start"}'::jsonb));
INSERT INTO auth_migration_test_results(name, result)
SELECT 'conflict2', public.backfill_lalao_auth_identities('{"creationTime":10000000000000000,"id":"authmig_cursor_start"}'::jsonb);

SELECT is((SELECT (result->>'conflictCount')::integer FROM auth_migration_test_results WHERE name = 'conflict1'), 1, 'identity already owned by another user is reported as a conflict');
SELECT is((SELECT (result->>'conflictCount')::integer FROM auth_migration_test_results WHERE name = 'conflict2'), 1, 'reprocessing reports the same conflict without changing ownership');
SELECT is((SELECT count(*)::integer FROM public."authIdentityBackfillConflicts" WHERE "userId" = 'authmig_conflict_target'), 1, 'a conflicting user is persisted once');
SELECT is(
  (SELECT "userId" FROM public."authIdentities" WHERE "issuer" = 'https://securetoken.google.com/uselalaoapp' AND "subject" = 'authmig-conflict-subject'),
  'authmig_conflict_owner',
  'backfill never reassigns an existing identity'
);
SELECT is(
  (SELECT "authIdentitiesBackfilledAt" FROM public."authMigrationState" WHERE "key" = 'authIdentityV1' ORDER BY "_creationTime" DESC LIMIT 1),
  (SELECT completed_at FROM auth_migration_state_before),
  'a conflict prevents changing the backfill completion marker'
);

INSERT INTO auth_migration_test_results(name, result)
VALUES ('empty_cursor', public.backfill_lalao_auth_identities('{"creationTime":9000000000000000000,"id":"zzzz"}'::jsonb));
SELECT is((SELECT (result->>'processedCount')::integer FROM auth_migration_test_results WHERE name = 'empty_cursor'), 0, 'an exhausted cursor processes no users');
SELECT is((SELECT result->>'done' FROM auth_migration_test_results WHERE name = 'empty_cursor'), 'true', 'an exhausted cursor is complete even when earlier users exist');

SELECT * FROM finish();
ROLLBACK;
