BEGIN;
SELECT plan(23);

-- ============================================================================
-- Playsole identity provisioning through ensure_lalao_user_for_identity
-- ============================================================================

-- 1. New Playsole identity provisions a new user
SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-new-user-001',
    'ps-new@example.invalid', true, 'Playsole New User', NULL, 'playsole'
  ) IS NOT NULL,
  true,
  'a new verified Playsole identity is provisioned'
);

SELECT is(
  (SELECT "role" FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-new-user-001'),
  'user',
  'new Playsole identity is assigned the ordinary user role'
);

SELECT is(
  (SELECT "lastSignInProvider" FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-new-user-001'),
  'playsole',
  'new Playsole identity records playsole as last sign-in provider'
);

-- 2. Idempotent re-provisioning: same Playsole identity returns the same user_id
SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-new-user-001',
    'ps-new@example.invalid', true, 'Playsole New User', NULL, 'playsole'
  ),
  (SELECT "_id" FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-new-user-001'),
  're-provisioning the same Playsole identity returns the same user_id'
);

SELECT is(
  (SELECT count(*)::integer FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-new-user-001'),
  1,
  're-provisioning does not create duplicate user profiles'
);

-- 3. Firebase and Playsole with different emails create separate users
SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'fb-diff-email-001',
    'fb-diff@example.invalid', true, 'Firebase Diff User', NULL, 'password'
  ) IS NOT NULL,
  true,
  'Firebase with a distinct email provisions a new user'
);

SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-diff-email-001',
    'ps-diff@example.invalid', true, 'Playsole Diff User', NULL, 'playsole'
  ) IS NOT NULL,
  true,
  'Playsole with a distinct email provisions a new user'
);

SELECT isnt(
  (SELECT "_id" FROM public."users" WHERE "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|fb-diff-email-001'),
  (SELECT "_id" FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-diff-email-001'),
  'Firebase and Playsole with different emails create separate user accounts'
);

-- 4. Unverified Playsole email does not link to an existing verified-email account
INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
) VALUES (
  'ps_unverified_target', 7000000000000001,
  'https://one.playsole.xyz|ps-unverified-target',
  'unverified-target@example.invalid', 'unverified-target@example.invalid',
  'Unverified Target', 'ps_unverified_target', 'complete', 1001, 1002, 'user'
);

SELECT isnt(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-unverified-new',
    'unverified-target@example.invalid', false, 'Unverified New User', NULL, 'playsole'
  ),
  'ps_unverified_target',
  'unverified Playsole email does not link to an existing account by email'
);

SELECT is(
  (SELECT "emailNormalized" FROM public."users" WHERE "tokenIdentifier" = 'https://one.playsole.xyz|ps-unverified-new'),
  NULL::text,
  'unverified Playsole email is not stored as verified normalized identity'
);

-- 5. Verified Playsole email collision with existing Firebase user
INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
) VALUES (
  'ps_verified_target', 7000000000000002,
  'https://securetoken.google.com/uselalaoapp|ps-verified-target',
  'verified-collision@example.invalid', 'verified-collision@example.invalid',
  'Verified Collision Target', 'ps_verified_target', 'complete', 1003, 1004, 'user'
);

SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-verified-collision',
    'verified-collision@example.invalid', true, 'Verified Collision User', NULL, 'playsole'
  )$$,
  '23505',
  'A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.',
  'verified Playsole email collision with existing Firebase user retains sign-in-then-link behavior'
);

-- 6. Playsole issuer validation is restrictive: unsupported issuers rejected
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity(
    'https://untrusted.example.invalid', 'bad-issuer',
    'bad@example.invalid', true, 'Bad Issuer User', NULL, 'password'
  )$$,
  '22023',
  'Unsupported Lalao identity provider',
  'unsupported issuer is rejected'
);

-- 7. Null subject rejected
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', NULL,
    'null-subject@example.invalid', true, 'Null Subject', NULL, 'playsole'
  )$$,
  '22023',
  'Invalid Lalao identity claims',
  'null subject is rejected'
);

-- 8. Empty subject rejected
SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', '   ',
    'empty-subject@example.invalid', true, 'Empty Subject', NULL, 'playsole'
  )$$,
  '22023',
  'Invalid Lalao identity claims',
  'whitespace-only subject is rejected'
);

-- 9. Existing roles are preserved through Playsole provisioning
INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
) VALUES (
  'ps_super_admin', 7000000000000003,
  'https://one.playsole.xyz|ps-super-admin',
  'ps-admin@example.invalid', 'ps-admin@example.invalid',
  'PS Super Admin', 'ps_super_admin', 'complete', 1005, 1006, 'super_admin'
);

SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-super-admin',
    'ps-admin-updated@example.invalid', true, 'PS Super Admin Updated', NULL, 'playsole'
  ),
  'ps_super_admin',
  'existing Playsole super_admin resolves to original user'
);

SELECT is(
  (SELECT "role" FROM public."users" WHERE "_id" = 'ps_super_admin'),
  'super_admin',
  'Playsole sign-in preserves existing super_admin role without promotion or demotion'
);

-- 10. Service-role-only execution: anon and authenticated cannot invoke directly
SELECT ok(
  NOT has_function_privilege('anon', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'anon cannot invoke Playsole identity provisioning'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'authenticated users cannot invoke Playsole identity provisioning directly'
);

SELECT ok(
  has_function_privilege('service_role', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'service_role can invoke Playsole identity provisioning'
);

-- 11. Existing authIdentities mapping resolves correctly for Playsole
INSERT INTO public."users" (
  "_id", "_creationTime", "tokenIdentifier", "email", "emailNormalized", "name", "username",
  "onboardingStep", "createdAt", "updatedAt", "role"
) VALUES (
  'ps_explicit_user', 7000000000000004,
  'https://one.playsole.xyz|ps-explicit-subject',
  'ps-explicit@example.invalid', 'ps-explicit@example.invalid',
  'PS Explicit User', 'ps_explicit_user', 'complete', 1007, 1008, 'user'
);

INSERT INTO public."authIdentities" (
  "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier",
  "emailNormalized", "emailVerified", "linkedAt"
) VALUES (
  'ps_explicit_identity', 'ps_explicit_user', 'playsole',
  'https://one.playsole.xyz', 'ps-explicit-subject',
  'https://one.playsole.xyz|ps-explicit-subject',
  'ps-explicit@example.invalid', true, 1007
);

SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-explicit-subject',
    'ps-explicit@example.invalid', true, 'PS Explicit User', NULL, 'playsole'
  ),
  'ps_explicit_user',
  'existing Playsole authIdentities mapping resolves to the correct user'
);

-- 12. Advisory lock is present in the function source (concurrent provisioning safety)
SELECT ok(
  position('pg_advisory_xact_lock' IN pg_get_functiondef('public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)'::regprocedure)) > 0,
  'identity provisioning uses advisory locks for concurrent safety'
);

-- 13. Two new identities with the same verified email: first creates, second collides
SELECT is(
  public.ensure_lalao_user_for_identity(
    'https://one.playsole.xyz', 'ps-email-collision-first',
    'ps-collision-shared@example.invalid', true, 'Collision First', NULL, 'playsole'
  ) IS NOT NULL,
  true,
  'first Playsole identity with shared email provisions a user'
);

SELECT throws_ok(
  $$SELECT public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'fb-email-collision-second',
    'ps-collision-shared@example.invalid', true, 'Collision Second', NULL, 'password'
  )$$,
  '23505',
  'A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.',
  'Firebase identity with same verified email as existing Playsole user collides'
);

SELECT * FROM finish();
ROLLBACK;
