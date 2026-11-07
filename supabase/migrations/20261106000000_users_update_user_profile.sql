BEGIN;

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
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile update' USING ERRCODE = '22023';
  END IF;

  IF p_payload - ARRAY[
    'name', 'username', 'bio', 'locationName', 'avatarUrl',
    'publicIdentityType', 'dateOfBirth', 'birthDateVisibility'
  ]::text[] <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Unsupported profile field' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.jsonb_each(p_payload) AS field(key, value)
     WHERE field.key IN ('name', 'username', 'bio', 'locationName', 'avatarUrl', 'dateOfBirth')
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

  IF p_payload ? 'avatarUrl'
     AND v_user."avatarStorageId" IS NOT NULL
     AND v_user."avatarUrl" IS DISTINCT FROM p_payload->>'avatarUrl' THEN
    RAISE EXCEPTION 'Legacy avatar storage cannot be replaced through Supabase' USING ERRCODE = '55000';
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
  'Applies a whitelisted profile update to the identity-resolved user. Exact-case usernames are serialized with a transaction advisory lock; Convex Storage IDs are intentionally not accepted.';

COMMIT;
