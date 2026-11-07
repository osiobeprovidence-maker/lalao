begin;
select plan(70);

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
select ok(
  to_regprocedure('public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)') IS NOT NULL,
  'authenticated profile provisioning RPC exists'
);
select ok(
  NOT has_function_privilege('anon', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'anonymous clients cannot provision profiles'
);
select ok(
  NOT has_function_privilege('authenticated', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'authenticated clients cannot bypass the verified Edge Function to provision profiles'
);
select ok(
  has_function_privilege('service_role', 'public.ensure_lalao_user_for_identity(text,text,text,boolean,text,text,text)', 'EXECUTE'),
  'trusted server role can provision profiles'
);
select isnt(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'synthetic-user-subject',
    'migration-test@example.invalid', true, 'Synthetic User', null, 'password'
  ),
  NULL::text,
  'verified synthetic identity creates a profile'
);
select is(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp', 'synthetic-user-subject',
    'migration-test@example.invalid', true, 'Synthetic User', null, 'password'
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'repeated profile provisioning resolves to the same user'
);
select is(
  (select count(*)::integer from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  1,
  'repeated profile provisioning creates only one identity mapping'
);
select throws_ok(
  $$select public.ensure_lalao_user_for_identity('https://attacker.invalid', 'synthetic', null, false, null, null, null)$$,
  '22023',
  'Unsupported Lalao identity provider',
  'profile provisioning rejects an untrusted issuer'
);
select ok(
  to_regprocedure('public.update_lalao_user_onboarding(text,text,jsonb)') IS NOT NULL,
  'whitelisted onboarding update RPC exists'
);
select ok(
  NOT has_function_privilege('anon', 'public.update_lalao_user_onboarding(text,text,jsonb)', 'EXECUTE'),
  'anonymous clients cannot update profiles through the onboarding RPC'
);
select ok(
  NOT has_function_privilege('authenticated', 'public.update_lalao_user_onboarding(text,text,jsonb)', 'EXECUTE'),
  'authenticated clients cannot bypass verified identity resolution to update profiles'
);
select ok(
  has_function_privilege('service_role', 'public.update_lalao_user_onboarding(text,text,jsonb)', 'EXECUTE'),
  'trusted server role can update profiles through the onboarding RPC'
);
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updateName', '{"name":"Updated User","username":"synthetic_user","role":"super_admin"}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'name update is scoped to the resolved user'
);
select is((select "name" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'Updated User', 'name update applies the requested profile field');
select is((select "role" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'user', 'unlisted profile fields cannot elevate account privileges');
select is((select "onboardingStep" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'name', 'name update advances the onboarding step');
update public."users" set "avatarUrl" = 'synthetic-avatar-preserve' where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject';
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updateProfile', '{"bio":"synthetic profile bio"}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'profile update is scoped to the resolved user'
);
select is((select "bio" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'synthetic profile bio', 'profile update stores allowed profile data');
select is((select "avatarUrl" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'synthetic-avatar-preserve', 'omitted avatar URL is preserved during a bio-only update');
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updatePronouns', '{"pronouns":"they"}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'pronoun update is scoped to the resolved user'
);
select is((select "pronouns" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'they', 'pronouns are stored');
update public."users"
set "locationSub" = 'Synthetic District', "radiusKm" = 25
where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject';
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updateLocation', '{"locationName":"Synthetic City","latitude":5.6,"longitude":-1.2}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'location update is scoped to the resolved user'
);
select is((select "latitude" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 5.6::double precision, 'location coordinates are stored as validated numbers');
select is((select "locationSub" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'Synthetic District', 'omitted location sub-area is preserved');
select is((select "radiusKm" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 25::double precision, 'omitted location radius is preserved');
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updateInterests', '{"interests":["synthetic-a","synthetic-b"]}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'interest update is scoped to the resolved user'
);
select is((select jsonb_array_length("interests") from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 2, 'interests are stored as an array');
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'completeOnboardingStep', '{}'::jsonb
  ),
  (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
  'onboarding completion is scoped to the resolved user'
);
select is((select "onboardingStep" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), 'complete', 'onboarding completion updates the expected state');
select is(
  public.update_lalao_user_onboarding(
    (select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'),
    'updatePhoneSetup', '{"phoneNumber":"+12025550123","countryCode":"US","countryName":"US","phoneCountryCode":"1"}'::jsonb
  ),
  'country_restricted',
  'phone setup preserves the restricted-country result'
);
select is((select "phoneSetupCompleted" from public."users" where "tokenIdentifier" = 'https://securetoken.google.com/uselalaoapp|synthetic-user-subject'), true, 'phone setup records completion');
select throws_ok(
  $$select public.update_lalao_user_onboarding((select "userId" from public."authIdentities" where "issuer" = 'https://securetoken.google.com/uselalaoapp' and "subject" = 'synthetic-user-subject'), 'setRole', '{"role":"super_admin"}'::jsonb)$$,
  '22023',
  'Unsupported profile update operation',
  'the onboarding RPC rejects operations outside its whitelist'
);

-- Verified email claims never authorize super-admin provisioning.
select isnt(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp',
    'synthetic-admin-one',
    ' RIDEREZZY@GMAIL.COM ',
    true,
    'Synthetic Admin One',
    null,
    'password'
  ),
  NULL::text,
  'first authorized verified email creates a profile'
);
select is(
  (select "role" from public."users" where "_id" = (
    select "userId" from public."authIdentities"
    where "issuer" = 'https://securetoken.google.com/uselalaoapp'
      and "subject" = 'synthetic-admin-one'
  )),
  'user',
  'first verified email does not receive super_admin'
);

select isnt(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp',
    'synthetic-admin-two',
    'OSIOBEPROVIDENCE@GMAIL.COM',
    true,
    'Synthetic Admin Two',
    null,
    'password'
  ),
  NULL::text,
  'second authorized verified email creates a profile'
);
select is(
  (select "role" from public."users" where "_id" = (
    select "userId" from public."authIdentities"
    where "issuer" = 'https://securetoken.google.com/uselalaoapp'
      and "subject" = 'synthetic-admin-two'
  )),
  'user',
  'second verified email does not receive super_admin'
);

select isnt(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp',
    'synthetic-unverified-admin',
    'riderezzy@gmail.com',
    false,
    'Synthetic Unverified',
    null,
    'password'
  ),
  NULL::text,
  'unverified authorized email can create an ordinary profile'
);
select is(
  (select "role" from public."users" where "_id" = (
    select "userId" from public."authIdentities"
    where "issuer" = 'https://securetoken.google.com/uselalaoapp'
      and "subject" = 'synthetic-unverified-admin'
  )),
  'user',
  'unverified authorized email does not receive super_admin'
);
select is(
  (select "emailNormalized" from public."users" where "_id" = (
    select "userId" from public."authIdentities"
    where "issuer" = 'https://securetoken.google.com/uselalaoapp'
      and "subject" = 'synthetic-unverified-admin'
  )),
  NULL::text,
  'unverified email is not stored as a verified normalized email'
);

select isnt(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp',
    'synthetic-unrelated-user',
    'ordinary-user@example.invalid',
    true,
    'Synthetic Ordinary User',
    null,
    'password'
  ),
  NULL::text,
  'unrelated verified email creates a profile'
);
select is(
  (select "role" from public."users" where "_id" = (
    select "userId" from public."authIdentities"
    where "issuer" = 'https://securetoken.google.com/uselalaoapp'
      and "subject" = 'synthetic-unrelated-user'
  )),
  'user',
  'unrelated verified email remains a normal user'
);

insert into public."users" (
  "_id", "tokenIdentifier", "email", "onboardingStep",
  "createdAt", "updatedAt", "role"
) values (
  'synthetic_existing_admin',
  'https://securetoken.google.com/uselalaoapp|synthetic-existing-admin',
  'legacy-existing@example.invalid',
  'complete',
  1,
  1,
  'user'
);

select is(
  public.ensure_lalao_user_for_identity(
    'https://securetoken.google.com/uselalaoapp',
    'synthetic-existing-admin',
    '  RIDEREZZY@GMAIL.COM  ',
    true,
    'Synthetic Existing Admin',
    null,
    'password'
  ),
  'synthetic_existing_admin',
  'verified authorized identity resolves to the existing legacy account'
);
select is(
  (select "role" from public."users" where "_id" = 'synthetic_existing_admin'),
  'user',
  'existing account role is not elevated from the verified normalized email'
);
select is(
  (select "emailNormalized" from public."users" where "_id" = 'synthetic_existing_admin'),
  'riderezzy@gmail.com',
  'existing account stores the normalized verified email'
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
