BEGIN;
SELECT plan(30);

SELECT ok(
  to_regprocedure('public.update_lalao_user_notification_preferences(text,jsonb)') IS NOT NULL,
  'notification preference RPC exists'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.update_lalao_user_notification_preferences(text,jsonb)', 'EXECUTE'),
  'anonymous clients cannot update notification preferences'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.update_lalao_user_notification_preferences(text,jsonb)', 'EXECUTE'),
  'authenticated clients cannot bypass the verified identity resolver'
);
SELECT ok(
  has_function_privilege('service_role', 'public.update_lalao_user_notification_preferences(text,jsonb)', 'EXECUTE'),
  'trusted server role can update notification preferences'
);
SELECT ok(
  to_regprocedure('public.join_lalao_user_waitlist(text)') IS NOT NULL,
  'waitlist RPC exists'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.join_lalao_user_waitlist(text)', 'EXECUTE'),
  'anonymous clients cannot join the waitlist'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.join_lalao_user_waitlist(text)', 'EXECUTE'),
  'authenticated clients cannot bypass the verified identity resolver'
);
SELECT ok(
  has_function_privilege('service_role', 'public.join_lalao_user_waitlist(text)', 'EXECUTE'),
  'trusted server role can join the waitlist'
);

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "email", "name", "username", "phoneNumber", "countryCode",
  "countryName", "accessStatus", "notificationPrefs", "onboardingStep", "createdAt",
  "updatedAt", "role"
) VALUES
  ('profile-pref-owner-a', 'synthetic|profile-pref-a', 'a@example.invalid', 'A', 'profile_pref_a', '+234800000001', 'NG', 'Nigeria', 'country_restricted', '{"messages":true,"legacySetting":"preserve"}', 'complete', 1, 7, 'user'),
  ('profile-pref-owner-b', 'synthetic|profile-pref-b', 'b@example.invalid', 'B', 'profile_pref_b', '+234800000002', 'NG', 'Nigeria', 'available', '{"messages":true}', 'complete', 1, 9, 'user'),
  ('profile-pref-owner-c', 'synthetic|profile-pref-c', 'c@example.invalid', 'C', 'profile_pref_c', NULL, 'GH', 'Ghana', 'country_restricted', NULL, 'complete', 1, 11, 'user');

SELECT public.update_lalao_user_notification_preferences(
  'profile-pref-owner-a',
  '{"messages":false,"likes":true}'::jsonb
);
SELECT is(
  (SELECT "notificationPrefs"->>'messages' FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  'false',
  'notification setting is updated'
);
SELECT is(
  (SELECT "notificationPrefs"->>'likes' FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  'true',
  'another supported notification setting is updated'
);
SELECT is(
  (SELECT "notificationPrefs"->>'legacySetting' FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  'preserve',
  'unsubmitted existing preference data is preserved'
);
SELECT is(
  (SELECT "updatedAt" FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  7::double precision,
  'notification preference update does not modify updatedAt'
);
SELECT is(
  (SELECT "notificationPrefs"->>'messages' FROM public."users" WHERE "_id" = 'profile-pref-owner-b'),
  'true',
  'another user preferences remain unchanged'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_notification_preferences('profile-pref-owner-a', '{"role":true}'::jsonb)$$,
  '22023',
  'Invalid notification preferences',
  'unsupported notification preference fields are rejected'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_notification_preferences('profile-pref-owner-a', '{"messages":"false"}'::jsonb)$$,
  '22023',
  'Invalid notification preferences',
  'non-boolean notification preferences are rejected'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_notification_preferences('profile-pref-owner-a', '{"desktop":null}'::jsonb)$$,
  '22023',
  'Invalid notification preferences',
  'null notification preferences are rejected'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_notification_preferences('missing-profile', '{"messages":false}'::jsonb)$$,
  'P0002',
  'Lalao profile not found',
  'missing profile updates are rejected'
);

CREATE TEMP TABLE profile_waitlist_result AS
SELECT public.join_lalao_user_waitlist('profile-pref-owner-a') AS waitlist_id;
SELECT ok(
  (SELECT waitlist_id ~ '^wait_[a-f0-9]{32}$' FROM profile_waitlist_result),
  'waitlist RPC returns a generated waitlist ID'
);
SELECT is(
  (SELECT "accessStatus" FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  'waitlisted',
  'joining the waitlist updates access status'
);
SELECT is(
  (SELECT "userId" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  'profile-pref-owner-a',
  'waitlist entry is bound to the identity-resolved user'
);
SELECT is(
  (SELECT "email" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  'a@example.invalid',
  'waitlist entry copies the user email'
);
SELECT is(
  (SELECT "phoneNumber" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  '+234800000001',
  'waitlist entry copies the user phone number'
);
SELECT is(
  (SELECT "countryCode" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  'NG',
  'waitlist entry copies the user country code'
);
SELECT is(
  (SELECT "countryName" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  'Nigeria',
  'waitlist entry copies the user country'
);
SELECT is(
  (SELECT "status" FROM public."waitlist" WHERE "_id" = (SELECT waitlist_id FROM profile_waitlist_result)),
  'active',
  'new waitlist entries are active'
);
SELECT ok(
  (SELECT "updatedAt" > 7 FROM public."users" WHERE "_id" = 'profile-pref-owner-a'),
  'joining the waitlist updates the profile timestamp'
);
SELECT throws_ok(
  $$SELECT public.join_lalao_user_waitlist('profile-pref-owner-b')$$,
  'P0001',
  'User is not country restricted',
  'users who are not country restricted cannot join'
);
SELECT throws_ok(
  $$SELECT public.join_lalao_user_waitlist('profile-pref-owner-c')$$,
  '22023',
  'Waitlist profile details are incomplete',
  'required waitlist details are validated before inserting'
);
SELECT is(
  (SELECT count(*)::integer FROM public."waitlist" WHERE "userId" = 'profile-pref-owner-c'),
  0,
  'incomplete profile does not create a waitlist entry'
);
SELECT is(
  (SELECT "accessStatus" FROM public."users" WHERE "_id" = 'profile-pref-owner-c'),
  'country_restricted',
  'failed waitlist insertion leaves access status unchanged'
);

SELECT * FROM finish();
ROLLBACK;
