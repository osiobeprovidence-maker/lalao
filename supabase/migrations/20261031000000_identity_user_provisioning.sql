BEGIN;

-- Create or resolve one Lalao profile from a JWT already verified by the
-- authenticated `app-user` Edge Function. This routine is not executable by
-- browser roles; it contains no provider secret and accepts only identity data
-- extracted from the signed Firebase claims by that function.
CREATE OR REPLACE FUNCTION public.ensure_lalao_user_for_identity(
  p_issuer text,
  p_subject text,
  p_email text,
  p_email_verified boolean,
  p_name text,
  p_avatar_url text,
  p_method text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_provider text;
  v_token_identifier text;
  v_normalized_email text;
  v_user_id text;
  v_username_base text;
  v_username text;
  v_suffix text;
  v_now double precision;
  v_role text := 'user';
  v_attempt integer := 0;
  v_existing_user_id text;
  v_matching_user_count integer;
BEGIN
  IF p_issuer = 'https://securetoken.google.com/uselalaoapp' THEN
    v_provider := 'firebase';
  ELSIF p_issuer = 'https://one.playsole.xyz' THEN
    v_provider := 'playsole';
  ELSE
    RAISE EXCEPTION 'Unsupported Lalao identity provider' USING ERRCODE = '22023';
  END IF;
  IF p_subject IS NULL OR btrim(p_subject) = '' OR p_email_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid Lalao identity claims' USING ERRCODE = '22023';
  END IF;

  v_token_identifier := p_issuer || '|' || p_subject;
  v_normalized_email := CASE WHEN p_email_verified AND p_email IS NOT NULL AND btrim(p_email) <> ''
    THEN lower(btrim(p_email)) ELSE NULL END;

  -- Serialize provisioning and email ownership checks for this identity.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity:' || p_issuer || ':' || p_subject, 0));
  IF v_normalized_email IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('email:' || v_normalized_email, 0));
  END IF;

  SELECT auth_identity."userId" INTO v_user_id
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer AND auth_identity."subject" = p_subject;

  IF v_user_id IS NULL THEN
    SELECT count(*)::integer INTO v_matching_user_count
      FROM public."users" AS users
     WHERE users."tokenIdentifier" = v_token_identifier;
    IF v_matching_user_count > 1 THEN
      RAISE EXCEPTION 'Legacy authentication identity conflict. Contact support for account recovery.' USING ERRCODE = '23505';
    END IF;
    SELECT users."_id" INTO v_user_id
      FROM public."users" AS users
     WHERE users."tokenIdentifier" = v_token_identifier
     ORDER BY users."_creationTime"
     LIMIT 1;
  END IF;

  IF v_user_id IS NULL AND v_normalized_email IS NOT NULL THEN
    SELECT users."_id" INTO v_existing_user_id
      FROM public."users" AS users
     WHERE lower(COALESCE(users."emailNormalized", users."email", '')) = v_normalized_email
     ORDER BY users."_creationTime"
     LIMIT 1;
    IF v_existing_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  v_now := extract(epoch FROM clock_timestamp()) * 1000;
  IF v_user_id IS NULL THEN
    v_username_base := left(regexp_replace(lower(COALESCE(NULLIF(p_email, ''), p_subject)), '[^a-z0-9]+', '', 'g'), 20);
    IF v_username_base = '' THEN
      v_username_base := 'user' || left(md5(v_token_identifier), 12);
    END IF;
    v_suffix := left(md5(v_token_identifier), 6);
    v_username := v_username_base;
    LOOP
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('username:' || v_username, 0));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public."users" WHERE "username" = v_username);
      v_attempt := v_attempt + 1;
      v_username := left(v_username_base, greatest(1, 20 - length(v_suffix) - length(v_attempt::text))) || v_suffix || v_attempt::text;
    END LOOP;

    IF v_normalized_email IN ('riderezzy@gmail.com', 'osiobeprovidence@gmail.com') THEN
      v_role := 'super_admin';
    END IF;
    v_user_id := 'usr_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public."users" (
      "_id", "tokenIdentifier", "email", "emailNormalized", "name", "username", "avatarUrl",
      "onboardingStep", "followersCount", "followingCount", "role", "phoneSetupCompleted",
      "phoneVerified", "createdAt", "updatedAt", "lastSignInProvider", "lastSignInMethod"
    ) VALUES (
      v_user_id, v_token_identifier, NULLIF(p_email, ''), v_normalized_email,
      COALESCE(NULLIF(p_name, ''), CASE WHEN p_email IS NOT NULL THEN split_part(p_email, '@', 1) ELSE 'New user' END),
      v_username, NULLIF(p_avatar_url, ''), 'pending', 0, 0, v_role, false, false,
      v_now, v_now, v_provider, COALESCE(NULLIF(p_method, ''), v_provider)
    );
  ELSE
    UPDATE public."users"
       SET "lastSignInProvider" = v_provider,
           "lastSignInMethod" = COALESCE(NULLIF(p_method, ''), v_provider),
           "avatarUrl" = CASE WHEN COALESCE("avatarUrl", '') = '' AND NULLIF(p_avatar_url, '') IS NOT NULL THEN p_avatar_url ELSE "avatarUrl" END,
           "emailNormalized" = CASE WHEN "emailNormalized" IS NULL THEN v_normalized_email ELSE "emailNormalized" END,
           "name" = CASE WHEN "name" IS NULL OR "name" = 'New user' THEN COALESCE(NULLIF(p_name, ''), "name") ELSE "name" END,
           "role" = CASE WHEN v_normalized_email IN ('riderezzy@gmail.com', 'osiobeprovidence@gmail.com') THEN 'super_admin' ELSE "role" END,
           "updatedAt" = v_now
     WHERE "_id" = v_user_id;
  END IF;

  INSERT INTO public."authIdentities" (
    "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier", "method",
    "emailNormalized", "emailVerified", "linkedAt"
  ) VALUES (
    'auth_' || replace(gen_random_uuid()::text, '-', ''), v_user_id, v_provider, p_issuer, p_subject,
    v_token_identifier, COALESCE(NULLIF(p_method, ''), v_provider), v_normalized_email, p_email_verified, v_now
  ) ON CONFLICT ("issuer", "subject") DO NOTHING;

  SELECT auth_identity."userId" INTO v_existing_user_id
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer AND auth_identity."subject" = p_subject;
  IF v_existing_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'This sign-in method is already associated with another Lalao account.' USING ERRCODE = '23505';
  END IF;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) TO service_role;
COMMENT ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) IS
  'Idempotently resolves or provisions one Lalao user for an identity after issuer, audience, role, and JWT verification in the app-user Edge Function. Service-role only.';

CREATE OR REPLACE FUNCTION public.update_lalao_user_onboarding(
  p_user_id text,
  p_operation text,
  p_payload jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_username text;
  v_country_code text;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile update request' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_user_id) THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_operation = 'updateName' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'name') IS DISTINCT FROM 'string' OR pg_catalog.jsonb_typeof(p_payload->'username') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Name and username are required' USING ERRCODE = '22023';
    END IF;
    v_username := p_payload->>'username';
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('username:' || v_username, 0));
    IF EXISTS (SELECT 1 FROM public."users" WHERE "username" = v_username AND "_id" <> p_user_id) THEN
      RAISE EXCEPTION 'Username already taken' USING ERRCODE = '23505';
    END IF;
    UPDATE public."users" SET "name" = p_payload->>'name', "username" = v_username,
      "onboardingStep" = 'name', "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'updateProfile' THEN
    IF (p_payload ? 'bio' AND p_payload->'bio' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'bio') <> 'string')
       OR (p_payload ? 'avatarUrl' AND p_payload->'avatarUrl' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'avatarUrl') <> 'string') THEN
      RAISE EXCEPTION 'Invalid profile fields' USING ERRCODE = '22023';
    END IF;
    UPDATE public."users" SET
      "bio" = CASE WHEN p_payload ? 'bio' THEN NULLIF(p_payload->>'bio', '') ELSE "bio" END,
      "avatarUrl" = CASE WHEN p_payload ? 'avatarUrl' THEN NULLIF(p_payload->>'avatarUrl', '') ELSE "avatarUrl" END,
      "onboardingStep" = 'profile', "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'updatePronouns' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'pronouns') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Pronouns are required' USING ERRCODE = '22023';
    END IF;
    UPDATE public."users" SET "pronouns" = p_payload->>'pronouns', "onboardingStep" = 'pronouns',
      "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'updateLocation' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'locationName') IS DISTINCT FROM 'string'
       OR (p_payload ? 'locationSub' AND p_payload->'locationSub' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'locationSub') <> 'string')
       OR (p_payload ? 'latitude' AND p_payload->'latitude' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'latitude') <> 'number')
       OR (p_payload ? 'longitude' AND p_payload->'longitude' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'longitude') <> 'number')
       OR (p_payload ? 'radiusKm' AND p_payload->'radiusKm' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_payload->'radiusKm') <> 'number') THEN
      RAISE EXCEPTION 'Invalid location fields' USING ERRCODE = '22023';
    END IF;
    UPDATE public."users" SET
      "locationName" = p_payload->>'locationName',
      "locationSub" = CASE WHEN p_payload ? 'locationSub' THEN p_payload->>'locationSub' ELSE "locationSub" END,
      "latitude" = CASE WHEN NOT (p_payload ? 'latitude') THEN "latitude" WHEN pg_catalog.jsonb_typeof(p_payload->'latitude') = 'number' THEN (p_payload->>'latitude')::double precision ELSE NULL END,
      "longitude" = CASE WHEN NOT (p_payload ? 'longitude') THEN "longitude" WHEN pg_catalog.jsonb_typeof(p_payload->'longitude') = 'number' THEN (p_payload->>'longitude')::double precision ELSE NULL END,
      "radiusKm" = CASE WHEN NOT (p_payload ? 'radiusKm') THEN "radiusKm" WHEN pg_catalog.jsonb_typeof(p_payload->'radiusKm') = 'number' THEN (p_payload->>'radiusKm')::double precision ELSE NULL END,
      "onboardingStep" = 'location', "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'updateInterests' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'interests') IS DISTINCT FROM 'array'
       OR EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(p_payload->'interests') AS interest(value) WHERE pg_catalog.jsonb_typeof(interest.value) <> 'string') THEN
      RAISE EXCEPTION 'Interests must be an array of strings' USING ERRCODE = '22023';
    END IF;
    UPDATE public."users" SET "interests" = p_payload->'interests', "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'completeOnboardingStep' THEN
    UPDATE public."users" SET "onboardingStep" = 'complete', "updatedAt" = v_now WHERE "_id" = p_user_id;
  ELSIF p_operation = 'updatePhoneSetup' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'phoneNumber') IS DISTINCT FROM 'string'
       OR pg_catalog.jsonb_typeof(p_payload->'countryCode') IS DISTINCT FROM 'string'
       OR pg_catalog.jsonb_typeof(p_payload->'countryName') IS DISTINCT FROM 'string'
       OR pg_catalog.jsonb_typeof(p_payload->'phoneCountryCode') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Phone and country details are required' USING ERRCODE = '22023';
    END IF;
    v_country_code := p_payload->>'countryCode';
    UPDATE public."users" SET
      "phoneNumber" = p_payload->>'phoneNumber', "countryCode" = v_country_code,
      "countryName" = p_payload->>'countryName', "phoneCountryCode" = p_payload->>'phoneCountryCode',
      "phoneSetupCompleted" = true, "phoneVerified" = false,
      "accessStatus" = CASE WHEN v_country_code = 'NG' THEN 'available' ELSE 'country_restricted' END,
      "updatedAt" = v_now WHERE "_id" = p_user_id;
    RETURN CASE WHEN v_country_code = 'NG' THEN 'available' ELSE 'country_restricted' END;
  ELSE
    RAISE EXCEPTION 'Unsupported profile update operation' USING ERRCODE = '22023';
  END IF;

  RETURN p_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_lalao_user_onboarding(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lalao_user_onboarding(text, text, jsonb) TO service_role;
COMMENT ON FUNCTION public.update_lalao_user_onboarding(text, text, jsonb) IS
  'Applies a whitelisted onboarding update to a user ID resolved from verified provider claims by the app-user Edge Function. Service-role only.';

COMMIT;
