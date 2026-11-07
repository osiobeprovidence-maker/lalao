BEGIN;

-- ============================================================================
-- Lalao User — Phone Update RPC
--
-- Adds a server-side RPC for updating a user's phone number. The caller
-- identity is resolved server-side from the authenticated JWT (never
-- client-supplied). Phone uniqueness is enforced across both the `phone`
-- and `phoneNumber` columns to match Convex behavior.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_lalao_user_phone(
  p_user_id text,
  p_phone_number text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conflict_count integer;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Invalid Lalao profile ID' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_user_id) THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_phone_number IS NULL OR p_phone_number = '' THEN
    RAISE EXCEPTION 'Phone number is required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('user-phone:' || p_phone_number, 0));

  -- Enforce phone uniqueness across both phone and phoneNumber columns,
  -- matching the Convex implementation which checks both fields.
  SELECT count(*) INTO v_conflict_count
  FROM public."users"
  WHERE "_id" <> p_user_id
    AND (
      "phone" = p_phone_number
      OR "phoneNumber" = p_phone_number
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'This phone number is already associated with another account.' USING ERRCODE = '23505';
  END IF;

  UPDATE public."users"
     SET "phone" = p_phone_number,
         "phoneNumber" = p_phone_number,
         "phoneVerified" = true,
         "updatedAt" = v_now
   WHERE "_id" = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_lalao_user_phone(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lalao_user_phone(text, text) TO service_role;

COMMENT ON FUNCTION public.update_lalao_user_phone(text, text) IS
  'Updates the identity-resolved user phone number with uniqueness enforcement. Service-role only.';

COMMIT;
