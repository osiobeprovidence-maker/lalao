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
    IF EXISTS (
      SELECT 1 FROM public."users" u
      WHERE u."_id" <> p_user_id
        AND (u."phone" = p_payload->>'phoneNumber' OR u."phoneNumber" = p_payload->>'phoneNumber')
    ) THEN
      RAISE EXCEPTION 'This phone number is already associated with another account.' USING ERRCODE = '23505';
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

CREATE OR REPLACE FUNCTION public.enforce_lalao_user_phone_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_phone text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW."phone" IS NOT DISTINCT FROM OLD."phone"
     AND NEW."phoneNumber" IS NOT DISTINCT FROM OLD."phoneNumber" THEN
    RETURN NEW;
  END IF;

  FOR v_phone IN
    SELECT DISTINCT phone_value
    FROM unnest(ARRAY[NEW."phone", NEW."phoneNumber"]::text[]) AS value(phone_value)
    WHERE phone_value IS NOT NULL
    ORDER BY phone_value
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('user-phone:' || v_phone, 0));
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public."users" u
    WHERE u."_id" <> NEW."_id"
      AND ((NEW."phone" IS NOT NULL AND (u."phone" = NEW."phone" OR u."phoneNumber" = NEW."phone"))
        OR (NEW."phoneNumber" IS NOT NULL AND (u."phone" = NEW."phoneNumber" OR u."phoneNumber" = NEW."phoneNumber")))
  ) THEN
    RAISE EXCEPTION 'This phone number is already associated with another account.' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lalao_user_phone(p_user_id text, p_phone_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conflict_count integer;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN RAISE EXCEPTION 'Invalid Lalao profile ID' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_user_id) THEN RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002'; END IF;
  IF p_phone_number IS NULL OR p_phone_number = '' THEN RAISE EXCEPTION 'Phone number is required' USING ERRCODE = '22023'; END IF;
  SELECT count(*) INTO v_conflict_count FROM public."users" WHERE "_id" <> p_user_id AND ("phone" = p_phone_number OR "phoneNumber" = p_phone_number);
  IF v_conflict_count > 0 THEN RAISE EXCEPTION 'This phone number is already associated with another account.' USING ERRCODE = '23505'; END IF;
  UPDATE public."users" SET "phone" = p_phone_number, "phoneNumber" = p_phone_number, "phoneVerified" = true, "updatedAt" = v_now WHERE "_id" = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lalao profile not found' USING ERRCODE = 'P0002'; END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.update_lalao_user_phone(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lalao_user_phone(text, text) TO service_role;
CREATE OR REPLACE FUNCTION public.mark_lalao_conversation_read(
  p_caller_id text,
  p_conversation_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conversation public.conversations%ROWTYPE;
  v_is_manager boolean := false;
  v_am_i_user_a boolean := false;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_conversation FROM public."conversations" WHERE "_id" = p_conversation_id;
  IF NOT FOUND THEN RETURN p_conversation_id; END IF;
  v_am_i_user_a := v_conversation."userA" = p_caller_id;
  IF v_conversation."groupChatId" IS NOT NULL THEN
    IF NOT (can_access_lalao_group_chat(p_caller_id, (SELECT "creatorId" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId"), (SELECT "memberIds" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId")) OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = v_conversation."groupChatId" AND gm."userId" = p_caller_id)) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
  ELSIF v_conversation."pageB" IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public."pages" WHERE "_id" = v_conversation."pageB" AND "ownerId" = p_caller_id) INTO v_is_manager;
    IF NOT (v_is_manager OR v_conversation."userA" = p_caller_id OR v_conversation."userB" = p_caller_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
  ELSIF v_conversation."userA" <> p_caller_id AND v_conversation."userB" <> p_caller_id THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public."messages" SET "isRead" = true, "readAt" = extract(epoch FROM clock_timestamp()) * 1000
   WHERE "conversationId" = p_conversation_id AND "isRead" = false
     AND CASE WHEN v_is_manager AND NOT v_am_i_user_a THEN "senderId" <> p_caller_id AND "pageSenderId" IS NULL ELSE "pageSenderId" IS NOT NULL OR "senderId" <> p_caller_id END;
  UPDATE public."notifications" SET "isRead" = true
   WHERE "recipientId" = p_caller_id AND "conversationId" = p_conversation_id AND "type" = 'message' AND "isRead" = false;
  RETURN p_conversation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.invite_lalao_to_group_chat(p_caller_id text, p_group_chat_id text, p_user_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_group_chat public."groupChats"%ROWTYPE;
  v_norm_user_id text;
  v_member_in_json boolean;
  v_member_in_relation boolean;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_group_chat_id IS NULL OR p_group_chat_id = '' THEN RAISE EXCEPTION 'Group chat ID is required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_group_chat FROM public."groupChats" WHERE "_id" = p_group_chat_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group chat not found' USING ERRCODE = 'P0002'; END IF;
  IF NOT (can_access_lalao_group_chat(p_caller_id, v_group_chat."creatorId", v_group_chat."memberIds") OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = p_group_chat_id AND gm."userId" = p_caller_id)) THEN RAISE EXCEPTION 'Not authorized to invite members' USING ERRCODE = '42501'; END IF;
  SELECT "_id" INTO v_norm_user_id FROM public."users" WHERE "_id" = p_user_id;
  IF NOT FOUND THEN RETURN p_group_chat_id; END IF;
  v_member_in_json := coalesce(v_group_chat."memberIds", '[]'::jsonb) @> jsonb_build_array(v_norm_user_id);
  SELECT EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = p_group_chat_id AND gm."userId" = v_norm_user_id) INTO v_member_in_relation;
  IF NOT v_member_in_json THEN
    UPDATE public."groupChats" SET "memberIds" = coalesce("memberIds", '[]'::jsonb) || jsonb_build_array(v_norm_user_id), "updatedAt" = extract(epoch FROM clock_timestamp()) * 1000 WHERE "_id" = p_group_chat_id;
  END IF;
  IF NOT v_member_in_relation THEN
    INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt") VALUES ('gm_' || gen_random_uuid()::text, p_group_chat_id, v_norm_user_id, 'member', extract(epoch FROM clock_timestamp()) * 1000);
  END IF;
  RETURN p_group_chat_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_lalao_conversation_read(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_lalao_conversation_read(text, text) TO service_role;
REVOKE ALL ON FUNCTION public.invite_lalao_to_group_chat(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invite_lalao_to_group_chat(text, text, text) TO service_role;


COMMIT;
