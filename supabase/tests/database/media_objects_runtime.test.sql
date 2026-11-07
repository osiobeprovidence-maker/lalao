BEGIN;
SELECT plan(40);

SELECT has_table('public', 'mediaObjects', 'media object tracking table exists');
SELECT has_column('public', 'mediaObjects', '_id', 'media object has an ID');
SELECT has_column('public', 'mediaObjects', 'ownerId', 'media object has an owner');
SELECT has_column('public', 'mediaObjects', 'provider', 'media object identifies its provider');
SELECT has_column('public', 'mediaObjects', 'bucket', 'media object identifies its bucket');
SELECT has_column('public', 'mediaObjects', 'objectKey', 'media object has a generated object key');
SELECT has_column('public', 'mediaObjects', 'mediaType', 'media object has a media type');
SELECT has_column('public', 'mediaObjects', 'mimeType', 'media object has a MIME type');
SELECT has_column('public', 'mediaObjects', 'sizeBytes', 'media object can record verified size');
SELECT has_column('public', 'mediaObjects', 'visibility', 'media object has visibility');
SELECT has_column('public', 'mediaObjects', 'status', 'media object has lifecycle status');
SELECT has_column('public', 'mediaObjects', 'createdAt', 'media object has creation time');
SELECT has_column('public', 'mediaObjects', 'updatedAt', 'media object has update time');

SELECT ok(EXISTS (
  SELECT 1 FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'mediaObjects' AND c.contype = 'p'
), 'media object ID is the primary key');
SELECT ok(EXISTS (
  SELECT 1 FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'mediaObjects'
    AND c.conname = 'fk_mediaObjects_ownerId_users' AND c.contype = 'f'
), 'owner references public users');
SELECT ok(EXISTS (
  SELECT 1 FROM pg_constraint c
  WHERE c.conrelid = 'public."mediaObjects"'::regclass
    AND c.conname = 'fk_mediaObjects_ownerId_users'
    AND c.contype = 'f' AND c.confdeltype = 'a'
    AND c.condeferrable AND c.condeferred
), 'owner foreign key uses NO ACTION and is initially deferred');
SELECT ok(EXISTS (
  SELECT 1 FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'mediaObjects'
    AND c.conname = 'uq_mediaObjects_bucket_objectKey' AND c.contype = 'u'
), 'bucket and object key are unique');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_provider'), 'provider is constrained to Cloudflare R2');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_objectKey_generated_shape'), 'object key must use generated key format');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_mediaType_enum'), 'media type is constrained');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_mimeType_format'), 'MIME type format is constrained');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_sizeBytes_positive'), 'file size must be positive when present');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_visibility_enum'), 'visibility is constrained');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."mediaObjects"'::regclass AND conname = 'ck_mediaObjects_status_enum'), 'lifecycle status is constrained');
SELECT has_index('public', 'mediaObjects', 'idx_mediaObjects_owner_createdAt', 'owner history index exists');
SELECT has_index('public', 'mediaObjects', 'idx_mediaObjects_status_createdAt', 'active lifecycle index exists');

SELECT ok((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'mediaObjects'), 'RLS is enabled');
SELECT ok(NOT has_table_privilege('anon', 'public."mediaObjects"', 'SELECT'), 'anon cannot read media object metadata');
SELECT ok(NOT has_table_privilege('anon', 'public."mediaObjects"', 'INSERT'), 'anon cannot insert media object metadata');
SELECT ok(NOT has_table_privilege('authenticated', 'public."mediaObjects"', 'SELECT'), 'authenticated clients cannot read media object metadata directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public."mediaObjects"', 'INSERT'), 'authenticated clients cannot insert media object metadata directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public."mediaObjects"', 'UPDATE'), 'authenticated clients cannot update media object metadata directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public."mediaObjects"', 'DELETE'), 'authenticated clients cannot delete media object metadata directly');
SELECT ok(has_table_privilege('service_role', 'public."mediaObjects"', 'SELECT,INSERT,UPDATE,DELETE'), 'service role has only the required CRUD table privileges');

INSERT INTO public."mediaObjects" ("ownerId", "bucket", "mediaType", "mimeType")
VALUES ('missing-owner', 'lalao-private', 'image', 'image/png');
SELECT throws_ok(
  $$SET CONSTRAINTS "fk_mediaObjects_ownerId_users" IMMEDIATE$$,
  '23503', NULL,
  'deferred owner foreign key rejects an unknown owner when checked'
);
SET CONSTRAINTS "fk_mediaObjects_ownerId_users" DEFERRED;
INSERT INTO public."users" ("_id", "tokenIdentifier", "onboardingStep", "createdAt", "updatedAt") VALUES ('media-objects-test-owner', 'synthetic|media-objects', 'complete', 1, 1);
INSERT INTO public."mediaObjects" ("ownerId", "bucket", "objectKey", "mediaType", "mimeType")
VALUES ('media-objects-test-owner', 'lalao-private', 'objects/00000000000000000000000000000000', 'image', 'image/png')
RETURNING set_config('test.media_objects_id', "_id", true);
SELECT ok((SELECT "objectKey" <> 'objects/00000000000000000000000000000000' FROM public."mediaObjects" WHERE "_id" = current_setting('test.media_objects_id')), 'caller-supplied object key is replaced by a generated key');
SELECT throws_ok(
  format('UPDATE public."mediaObjects" SET "objectKey" = %L WHERE "_id" = %L', 'objects/11111111111111111111111111111111', current_setting('test.media_objects_id')),
  '22023', 'Media object keys cannot be changed', 'existing object key cannot be changed'
);
SELECT set_config('test.media_objects_updated_before', "updatedAt"::text, true)
FROM public."mediaObjects" WHERE "_id" = current_setting('test.media_objects_id');
UPDATE public."mediaObjects" SET "sizeBytes" = 10 WHERE "_id" = current_setting('test.media_objects_id');
SELECT ok(
  (SELECT "updatedAt" > current_setting('test.media_objects_updated_before')::timestamptz
   FROM public."mediaObjects" WHERE "_id" = current_setting('test.media_objects_id')),
  'metadata update advances updatedAt'
);
SELECT throws_ok($$INSERT INTO public."mediaObjects" ("ownerId", "bucket", "mediaType", "mimeType", "sizeBytes") VALUES ('media-objects-test-owner', 'lalao-private', 'image', 'image/png', 0)$$, '23514', NULL, 'zero file size is rejected');
SELECT throws_ok($$INSERT INTO public."mediaObjects" ("ownerId", "bucket", "mediaType", "mimeType", "visibility") VALUES ('media-objects-test-owner', 'lalao-private', 'image', 'image/png', 'world')$$, '23514', NULL, 'unknown visibility is rejected');

SELECT * FROM finish();
ROLLBACK;
