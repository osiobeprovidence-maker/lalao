BEGIN;
SELECT plan(45);

SELECT ok(
  to_regprocedure('public.update_lalao_user_profile(text,jsonb)') IS NOT NULL,
  'profile update RPC exists'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.update_lalao_user_profile(text,jsonb)', 'EXECUTE'),
  'anonymous clients cannot update profiles'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.update_lalao_user_profile(text,jsonb)', 'EXECUTE'),
  'authenticated clients cannot bypass the verified identity resolver'
);
SELECT ok(
  has_function_privilege('service_role', 'public.update_lalao_user_profile(text,jsonb)', 'EXECUTE'),
  'trusted server role can update profiles'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.lalao_avatar_cleanup_jobs', 'SELECT'),
  'anonymous clients cannot read avatar cleanup jobs'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.lalao_avatar_cleanup_jobs', 'SELECT'),
  'authenticated clients cannot read avatar cleanup jobs'
);
SELECT ok(
  has_table_privilege('service_role', 'public.lalao_avatar_cleanup_jobs', 'SELECT'),
  'trusted server role can process avatar cleanup jobs'
);

INSERT INTO public."users" (
  "_id", "tokenIdentifier", "name", "username", "avatarUrl", "bio", "locationName",
  "onboardingStep", "createdAt", "updatedAt", "role"
) VALUES
  ('profile-update-owner-a', 'synthetic|profile-update-a', 'Old Name', 'old_name', 'old-avatar', 'old bio', 'Old place', 'complete', 1, 1, 'user'),
  ('profile-update-owner-b', 'synthetic|profile-update-b', 'Other User', 'other_name', 'other-avatar', 'other bio', 'Other place', 'complete', 1, 1, 'user');

SELECT is(
  public.update_lalao_user_profile(
    'profile-update-owner-a',
    '{"name":"Updated Name","username":"Alice","bio":"Updated bio","locationName":"New place","avatarUrl":"https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-a/avatar-1.png","avatarCloudinaryPublicId":"avatars/profile-update-owner-a/avatar-1","publicIdentityType":"both","dateOfBirth":"2000-01-02","birthDateVisibility":"age_only"}'::jsonb
  ),
  'profile-update-owner-a',
  'full profile update returns the identity-resolved user ID'
);
SELECT is((SELECT "name" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Updated Name', 'name is updated');
SELECT is((SELECT "username" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Alice', 'username is updated');
SELECT is((SELECT "bio" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Updated bio', 'bio is updated');
SELECT is((SELECT "locationName" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'New place', 'location is updated');
SELECT is((SELECT "avatarUrl" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-a/avatar-1.png', 'avatar URL is updated');
SELECT is((SELECT "avatarCloudinaryPublicId" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'avatars/profile-update-owner-a/avatar-1', 'Cloudinary public ID is saved with the avatar');
SELECT is((SELECT "publicIdentityType" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'both', 'public identity type is updated');
SELECT is((SELECT "dateOfBirth" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), '2000-01-02', 'date of birth is updated');
SELECT is((SELECT "birthDateVisibility" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'age_only', 'birth date visibility is updated');
SELECT ok((SELECT "updatedAt" > 1 FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'updatedAt is refreshed');
SELECT is((SELECT "role" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'user', 'unlisted role remains unchanged');

SELECT is(
  public.update_lalao_user_profile('profile-update-owner-a', '{"bio":"Partial bio"}'::jsonb),
  'profile-update-owner-a',
  'partial profile update returns the user ID'
);
SELECT is((SELECT "bio" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Partial bio', 'partial update changes the supplied field');
SELECT is((SELECT "username" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Alice', 'partial update preserves username');
SELECT is((SELECT "avatarUrl" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-a/avatar-1.png', 'partial update preserves avatar');
SELECT is((SELECT "avatarCloudinaryPublicId" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'avatars/profile-update-owner-a/avatar-1', 'partial update preserves Cloudinary public ID');
SELECT is((SELECT "role" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'user', 'partial update preserves protected data');

SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"username":"other_name"}'::jsonb)$$,
  '23505',
  'Username already taken',
  'exact username conflicts are rejected'
);
SELECT is((SELECT "username" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Alice', 'duplicate username failure rolls back the update');
SELECT is(
  public.update_lalao_user_profile('profile-update-owner-a', '{"username":"OTHER_NAME"}'::jsonb),
  'profile-update-owner-a',
  'username comparison remains case-sensitive like Convex'
);

SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"bio":null}'::jsonb)$$,
  '22023',
  'Invalid profile fields',
  'null is rejected for optional string fields rather than clearing them'
);
SELECT is((SELECT "bio" FROM public."users" WHERE "_id" = 'profile-update-owner-a'), 'Partial bio', 'invalid field failure preserves existing profile data');
SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"role":"admin"}'::jsonb)$$,
  '22023',
  'Unsupported profile field',
  'unlisted fields cannot be changed'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"birthDateVisibility":"secret"}'::jsonb)$$,
  '22023',
  'Invalid profile fields',
  'invalid enum values are rejected'
);

UPDATE public."users" SET "avatarStorageId" = 'synthetic-convex-storage-id', "avatarUrl" = 'legacy-avatar'
 WHERE "_id" = 'profile-update-owner-b';
SELECT is(
  public.update_lalao_user_profile(
    'profile-update-owner-b',
    '{"avatarUrl":"https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-b/new-avatar.png","avatarCloudinaryPublicId":"avatars/profile-update-owner-b/new-avatar"}'::jsonb
  ),
  'profile-update-owner-b',
  'new Cloudinary avatar can replace a legacy avatar reference'
);
SELECT is((SELECT "avatarStorageId" FROM public."users" WHERE "_id" = 'profile-update-owner-b'), 'synthetic-convex-storage-id', 'legacy storage metadata remains available for separate cleanup');
SELECT is((SELECT "avatarCloudinaryPublicId" FROM public."users" WHERE "_id" = 'profile-update-owner-b'), 'avatars/profile-update-owner-b/new-avatar', 'legacy storage metadata is preserved alongside the new avatar');
SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"avatarStorageId":"synthetic-other-user-storage-id"}'::jsonb)$$,
  '22023',
  'Unsupported profile field',
  'Convex storage IDs cannot be supplied by clients'
);
SELECT is((SELECT "avatarUrl" FROM public."users" WHERE "_id" = 'profile-update-owner-b'), 'https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-b/new-avatar.png', 'another user avatar remains unchanged');

SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"avatarUrl":"https://images.example.invalid/fake.png","avatarCloudinaryPublicId":"avatars/profile-update-owner-b/forbidden"}'::jsonb)$$,
  '22023',
  'Invalid profile fields',
  'a profile cannot claim another user avatar folder'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"avatarCloudinaryPublicId":"avatars/profile-update-owner-a/orphan"}'::jsonb)$$,
  '22023',
  'Invalid profile fields',
  'Cloudinary public IDs must be paired with an avatar URL'
);
SELECT is(
  public.update_lalao_user_profile(
    'profile-update-owner-a',
    '{"avatarUrl":"https://res.cloudinary.com/synthetic-cloud/image/upload/v1/avatars/profile-update-owner-a/avatar-2.png","avatarCloudinaryPublicId":"avatars/profile-update-owner-a/avatar-2"}'::jsonb
  ),
  'profile-update-owner-a',
  'replacement avatar update succeeds'
);
SELECT is(
  (SELECT "cloudinary_public_id" FROM public.lalao_avatar_cleanup_jobs WHERE user_id = 'profile-update-owner-a'),
  'avatars/profile-update-owner-a/avatar-1',
  'the previous tracked Cloudinary asset is queued for cleanup'
);
SELECT is(
  (SELECT "avatarCloudinaryPublicId" FROM public."users" WHERE "_id" = 'profile-update-owner-a'),
  'avatars/profile-update-owner-a/avatar-2',
  'new avatar metadata replaces the old Cloudinary public ID'
);

SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-missing', '{"bio":"must fail"}'::jsonb)$$,
  'P0002',
  'Lalao profile not found',
  'missing profile IDs are rejected'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_profile('profile-update-owner-a', '{"userId":"profile-update-owner-b"}'::jsonb)$$,
  '22023',
  'Unsupported profile field',
  'client-supplied identity fields cannot target another user'
);
SELECT is((SELECT "name" FROM public."users" WHERE "_id" = 'profile-update-owner-b'), 'Other User', 'cross-user update leaves other profile unchanged');

ROLLBACK;
