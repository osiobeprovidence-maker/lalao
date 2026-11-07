BEGIN;

ALTER TABLE public."users"
  ADD COLUMN "avatarCloudinaryPublicId" text;

CREATE TABLE public.lalao_avatar_cleanup_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  cloudinary_public_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  completed_at timestamptz,
  UNIQUE (user_id, cloudinary_public_id)
);

CREATE INDEX lalao_avatar_cleanup_jobs_pending_idx
  ON public.lalao_avatar_cleanup_jobs (user_id, created_at)
  WHERE completed_at IS NULL;

ALTER TABLE public.lalao_avatar_cleanup_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lalao_avatar_cleanup_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.lalao_avatar_cleanup_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.update_lalao_user_profile(
  p_user_id text,
  p_payload jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user public."users"%ROWTYPE;
  v_username text;
  v_new_cloudinary_public_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile update' USING ERRCODE = '22023';
  END IF;

  IF p_payload - ARRAY[
    'name', 'username', 'bio', 'locationName', 'avatarUrl',
    'avatarCloudinaryPublicId', 'publicIdentityType', 'dateOfBirth', 'birthDateVisibility'
  ]::text[] <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Unsupported profile field' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.jsonb_each(p_payload) AS field(key, value)
     WHERE field.key IN ('name', 'username', 'bio', 'locationName', 'avatarUrl', 'dateOfBirth', 'avatarCloudinaryPublicId')
       AND pg_catalog.jsonb_typeof(field.value) IS DISTINCT FROM 'string'
  ) OR (
    p_payload ? 'publicIdentityType'
    AND (
      p_payload->>'publicIdentityType' IS DISTINCT FROM 'display_name'
      AND p_payload->>'publicIdentityType' IS DISTINCT FROM 'username'
      AND p_payload->>'publicIdentityType' IS DISTINCT FROM 'both'
    )
  ) OR (
    p_payload ? 'birthDateVisibility'
    AND (
      p_payload->>'birthDateVisibility' IS DISTINCT FROM 'public'
      AND p_payload->>'birthDateVisibility' IS DISTINCT FROM 'age_only'
      AND p_payload->>'birthDateVisibility' IS DISTINCT FROM 'private'
    )
  ) OR (
    p_payload ? 'avatarCloudinaryPublicId'
    AND (
      NOT (p_payload ? 'avatarUrl')
      OR NOT pg_catalog.starts_with(
        p_payload->>'avatarCloudinaryPublicId',
        'avatars/' || p_user_id || '/'
      )
      OR pg_catalog.length(p_payload->>'avatarCloudinaryPublicId') <=
        pg_catalog.length('avatars/' || p_user_id || '/')
    )
  ) THEN
    RAISE EXCEPTION 'Invalid profile fields' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
    FROM public."users"
   WHERE "_id" = p_user_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_payload ? 'avatarUrl' AND v_user."avatarCloudinaryPublicId" IS NOT NULL THEN
    IF p_payload ? 'avatarCloudinaryPublicId' THEN
      v_new_cloudinary_public_id := p_payload->>'avatarCloudinaryPublicId';
    ELSIF v_user."avatarUrl" IS DISTINCT FROM p_payload->>'avatarUrl' THEN
      v_new_cloudinary_public_id := NULL;
    ELSE
      v_new_cloudinary_public_id := v_user."avatarCloudinaryPublicId";
    END IF;

    IF v_user."avatarCloudinaryPublicId" IS DISTINCT FROM v_new_cloudinary_public_id THEN
      INSERT INTO public.lalao_avatar_cleanup_jobs (user_id, cloudinary_public_id)
      VALUES (p_user_id, v_user."avatarCloudinaryPublicId")
      ON CONFLICT (user_id, cloudinary_public_id) DO NOTHING;
    END IF;
  END IF;

  IF p_payload ? 'username' THEN
    v_username := p_payload->>'username';
    IF v_username <> '' THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended('username:' || v_username, 0)
      );
      IF EXISTS (
        SELECT 1 FROM public."users"
         WHERE "username" = v_username AND "_id" <> p_user_id
      ) THEN
        RAISE EXCEPTION 'Username already taken' USING ERRCODE = '23505';
      END IF;
    END IF;
  END IF;

  UPDATE public."users"
     SET "name" = CASE WHEN p_payload ? 'name' THEN p_payload->>'name' ELSE "name" END,
         "username" = CASE WHEN p_payload ? 'username' THEN p_payload->>'username' ELSE "username" END,
         "bio" = CASE WHEN p_payload ? 'bio' THEN p_payload->>'bio' ELSE "bio" END,
         "locationName" = CASE WHEN p_payload ? 'locationName' THEN p_payload->>'locationName' ELSE "locationName" END,
         "avatarUrl" = CASE WHEN p_payload ? 'avatarUrl' THEN p_payload->>'avatarUrl' ELSE "avatarUrl" END,
         "avatarCloudinaryPublicId" = CASE
           WHEN p_payload ? 'avatarCloudinaryPublicId' THEN p_payload->>'avatarCloudinaryPublicId'
           WHEN p_payload ? 'avatarUrl' AND v_user."avatarUrl" IS DISTINCT FROM p_payload->>'avatarUrl' THEN NULL
           ELSE "avatarCloudinaryPublicId"
         END,
         "publicIdentityType" = CASE WHEN p_payload ? 'publicIdentityType' THEN p_payload->>'publicIdentityType' ELSE "publicIdentityType" END,
         "dateOfBirth" = CASE WHEN p_payload ? 'dateOfBirth' THEN p_payload->>'dateOfBirth' ELSE "dateOfBirth" END,
         "birthDateVisibility" = CASE WHEN p_payload ? 'birthDateVisibility' THEN p_payload->>'birthDateVisibility' ELSE "birthDateVisibility" END,
         "updatedAt" = v_now
   WHERE "_id" = p_user_id;

  RETURN p_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_lalao_user_profile(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lalao_user_profile(text, jsonb) TO service_role;
COMMENT ON FUNCTION public.update_lalao_user_profile(text, jsonb) IS
  'Applies a whitelisted profile update to the identity-resolved user. Exact-case usernames are serialized with a transaction advisory lock. Cloudinary public IDs are restricted to the caller-owned avatar folder; previous tracked assets are queued for cleanup. Legacy storage assets are preserved.';

COMMIT;
