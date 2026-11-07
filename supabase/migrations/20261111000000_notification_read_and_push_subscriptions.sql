DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."pushSubscriptions"
    GROUP BY "endpoint"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Web Push endpoints exist; reconcile them before applying notification migration';
  END IF;
END
$$;

CREATE UNIQUE INDEX idx_pushSubscriptions_endpoint_unique
  ON public."pushSubscriptions" ("endpoint");

CREATE OR REPLACE FUNCTION public.upsert_lalao_web_push_subscription(
  p_user_id text,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = ''
     OR p_endpoint IS NULL OR length(p_endpoint) > 4096
     OR p_endpoint !~ '^https://[^[:space:]]+$'
     OR p_p256dh IS NULL OR length(p_p256dh) < 16 OR length(p_p256dh) > 256
     OR p_auth IS NULL OR length(p_auth) < 8 OR length(p_auth) > 128
     OR (p_user_agent IS NOT NULL AND length(p_user_agent) > 1024) THEN
    RAISE EXCEPTION 'Invalid Web Push subscription' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public."pushSubscriptions" AS existing (
    "_id", "userId", "endpoint", "p256dh", "auth", "userAgent",
    "createdAt", "updatedAt", "isActive", "provider"
  )
  VALUES (
    'webpush_' || gen_random_uuid()::text,
    p_user_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    p_user_agent,
    v_now,
    v_now,
    true,
    'web_push'
  )
  ON CONFLICT ("endpoint") DO UPDATE
  SET "userId" = EXCLUDED."userId",
      "p256dh" = EXCLUDED."p256dh",
      "auth" = EXCLUDED."auth",
      "userAgent" = COALESCE(EXCLUDED."userAgent", existing."userAgent"),
      "updatedAt" = EXCLUDED."updatedAt",
      "isActive" = true
  RETURNING "_id" INTO v_id;

  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.deactivate_lalao_web_push_subscription(
  p_user_id text,
  p_endpoint text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_endpoint IS NULL OR p_endpoint = '' THEN
    RAISE EXCEPTION 'Invalid Web Push subscription request' USING ERRCODE = '22023';
  END IF;

  UPDATE public."pushSubscriptions"
  SET "isActive" = false,
      "updatedAt" = extract(epoch FROM clock_timestamp()) * 1000
  WHERE "userId" = p_user_id
    AND "endpoint" = p_endpoint
    AND "isActive" = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END
$$;

CREATE OR REPLACE FUNCTION public.mark_lalao_user_notifications_read(
  p_user_id text,
  p_notification_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Invalid notification owner' USING ERRCODE = '22023';
  END IF;

  IF p_notification_id IS NOT NULL THEN
    UPDATE public."notifications"
    SET "isRead" = true
    WHERE "_id" = p_notification_id
      AND "recipientId" = p_user_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      IF EXISTS (SELECT 1 FROM public."notifications" WHERE "_id" = p_notification_id) THEN
        RAISE EXCEPTION 'Unauthorized notification access' USING ERRCODE = '42501';
      END IF;
      RAISE EXCEPTION 'Notification not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN v_count;
  END IF;

  WITH pending AS (
    SELECT "_id"
    FROM public."notifications"
    WHERE "recipientId" = p_user_id
      AND "isRead" = false
    ORDER BY "createdAt" ASC, "_id" ASC
    LIMIT 250
  )
  UPDATE public."notifications" AS notification
  SET "isRead" = true
  FROM pending
  WHERE notification."_id" = pending."_id";

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END
$$;

REVOKE ALL ON FUNCTION public.upsert_lalao_web_push_subscription(text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deactivate_lalao_web_push_subscription(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lalao_user_notifications_read(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lalao_web_push_subscription(text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_lalao_web_push_subscription(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lalao_user_notifications_read(text, text) TO service_role;
