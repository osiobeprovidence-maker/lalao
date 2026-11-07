BEGIN;

CREATE OR REPLACE FUNCTION public.update_lalao_user_notification_preferences(
  p_user_id text,
  p_prefs jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_prefs IS NULL OR pg_catalog.jsonb_typeof(p_prefs) <> 'object' THEN
    RAISE EXCEPTION 'Invalid notification preferences' USING ERRCODE = '22023';
  END IF;

  IF p_prefs - ARRAY[
    'messages', 'cycles', 'likes', 'comments', 'follows', 'mentions', 'desktop'
  ]::text[] <> '{}'::jsonb
  OR EXISTS (
    SELECT 1
      FROM pg_catalog.jsonb_each(p_prefs) AS preference(key, value)
     WHERE pg_catalog.jsonb_typeof(preference.value) <> 'boolean'
  ) THEN
    RAISE EXCEPTION 'Invalid notification preferences' USING ERRCODE = '22023';
  END IF;

  UPDATE public."users"
     SET "notificationPrefs" = COALESCE("notificationPrefs", '{}'::jsonb) || p_prefs
   WHERE "_id" = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_lalao_user_notification_preferences(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lalao_user_notification_preferences(text, jsonb) TO service_role;
COMMENT ON FUNCTION public.update_lalao_user_notification_preferences(text, jsonb) IS
  'Merges only the supported boolean notification settings into the identity-resolved user. Service-role only.';

CREATE OR REPLACE FUNCTION public.join_lalao_user_waitlist(p_user_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user public."users"%ROWTYPE;
  v_waitlist_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Invalid Lalao profile ID' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
    FROM public."users"
   WHERE "_id" = p_user_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_user."accessStatus" IS DISTINCT FROM 'country_restricted' THEN
    RAISE EXCEPTION 'User is not country restricted' USING ERRCODE = 'P0001';
  END IF;

  SELECT "_id" INTO v_waitlist_id
    FROM public."waitlist"
   WHERE "userId" = p_user_id
   ORDER BY "createdAt"
   LIMIT 1;
  IF v_waitlist_id IS NOT NULL THEN
    RETURN v_waitlist_id;
  END IF;

  IF v_user."phoneNumber" IS NULL OR v_user."countryCode" IS NULL OR v_user."countryName" IS NULL THEN
    RAISE EXCEPTION 'Waitlist profile details are incomplete' USING ERRCODE = '22023';
  END IF;

  v_waitlist_id := 'wait_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public."waitlist" (
    "_id", "userId", "email", "phoneNumber", "countryCode", "countryName", "status", "createdAt"
  ) VALUES (
    v_waitlist_id, p_user_id, v_user."email", v_user."phoneNumber",
    v_user."countryCode", v_user."countryName", 'active', v_now
  );

  UPDATE public."users"
     SET "accessStatus" = 'waitlisted', "updatedAt" = v_now
   WHERE "_id" = p_user_id;

  RETURN v_waitlist_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.join_lalao_user_waitlist(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_lalao_user_waitlist(text) TO service_role;
COMMENT ON FUNCTION public.join_lalao_user_waitlist(text) IS
  'Adds the identity-resolved country-restricted user to the waitlist and updates access status. Service-role only.';

COMMIT;
