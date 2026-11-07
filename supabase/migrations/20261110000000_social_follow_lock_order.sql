BEGIN;

CREATE OR REPLACE FUNCTION public.toggle_lalao_user_follow(
  p_follower_id text,
  p_target_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_existing_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_follow_id text;
  v_notification_id text;
BEGIN
  IF p_follower_id IS NULL OR p_follower_id = ''
     OR p_target_user_id IS NULL OR p_target_user_id = '' THEN
    RAISE EXCEPTION 'Invalid follow request' USING ERRCODE = '22023';
  END IF;
  IF p_follower_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot follow yourself' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('follow:' || p_follower_id || ':' || p_target_user_id, 0)
  );

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_follower_id)
     OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_target_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM "_id"
  FROM public."users"
  WHERE "_id" IN (p_follower_id, p_target_user_id)
  ORDER BY "_id"
  FOR UPDATE;

  SELECT "_id" INTO v_existing_id
  FROM public."follows"
  WHERE "followerId" = p_follower_id AND "followingId" = p_target_user_id
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM public."follows" WHERE "_id" = v_existing_id;

    UPDATE public."users"
    SET "followingCount" = greatest(0, coalesce("followingCount", 0) - 1),
        "updatedAt" = v_now
    WHERE "_id" = p_follower_id;

    UPDATE public."users"
    SET "followersCount" = greatest(0, coalesce("followersCount", 0) - 1),
        "updatedAt" = v_now
    WHERE "_id" = p_target_user_id;

    RETURN jsonb_build_object('following', false);
  END IF;

  v_follow_id := 'follow_' || pg_catalog.gen_random_uuid()::text;
  INSERT INTO public."follows" (
    "_id", "_creationTime", "followerId", "followingId", "createdAt"
  ) VALUES (v_follow_id, v_now, p_follower_id, p_target_user_id, v_now);

  UPDATE public."users"
  SET "followingCount" = coalesce("followingCount", 0) + 1,
      "updatedAt" = v_now
  WHERE "_id" = p_follower_id;

  UPDATE public."users"
  SET "followersCount" = coalesce("followersCount", 0) + 1,
      "updatedAt" = v_now
  WHERE "_id" = p_target_user_id;

  v_notification_id := 'notification_follow_' || pg_catalog.gen_random_uuid()::text;
  INSERT INTO public."notifications" (
    "_id", "_creationTime", "recipientId", "actorId", "type", "isRead", "createdAt"
  ) VALUES (
    v_notification_id, v_now, p_target_user_id, p_follower_id, 'follow', false, v_now
  );

  RETURN jsonb_build_object('following', true, 'notificationId', v_notification_id);
END;
$function$;

COMMENT ON FUNCTION public.toggle_lalao_user_follow(text, text) IS
  'Atomically toggles one follow edge, updates both counters, and records the in-app follow notification. Locks both user rows in sorted ID order to avoid reciprocal-follow deadlocks. Caller identity must be resolved by app-social; push delivery is not dispatched by this RPC.';

COMMIT;
