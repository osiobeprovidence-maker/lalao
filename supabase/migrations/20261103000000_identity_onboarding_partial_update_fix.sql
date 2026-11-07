BEGIN;

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
