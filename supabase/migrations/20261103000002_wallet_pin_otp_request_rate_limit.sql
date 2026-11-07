BEGIN;

-- Limit OTP email abuse per wallet. These limits are enforced atomically under
-- the same wallet row lock used to replace the active OTP.
ALTER TABLE public."userWallets"
  ADD COLUMN IF NOT EXISTS "pinResetOtpLastRequestedAt" bigint,
  ADD COLUMN IF NOT EXISTS "pinResetOtpRequestWindowStartedAt" bigint,
  ADD COLUMN IF NOT EXISTS "pinResetOtpRequestCount" integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public."userWallets"."pinResetOtpLastRequestedAt" IS
  'Epoch-ms timestamp of the last accepted PIN-reset OTP email request.';
COMMENT ON COLUMN public."userWallets"."pinResetOtpRequestWindowStartedAt" IS
  'Epoch-ms start of the rolling PIN-reset OTP request window.';
COMMENT ON COLUMN public."userWallets"."pinResetOtpRequestCount" IS
  'Accepted PIN-reset OTP requests in the current one-hour window.';

CREATE OR REPLACE FUNCTION public.lalao_wallet_request_pin_reset_otp(
  p_user_id text,
  p_otp_hash text,
  p_otp_salt text,
  p_expires_at bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  v_window_started_at bigint;
  v_request_count integer;
  v_retry_after_ms bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;
  IF p_otp_hash IS NULL OR p_otp_hash = '' OR p_otp_salt IS NULL OR p_otp_salt = ''
     OR p_expires_at IS NULL OR p_expires_at <= v_now OR p_expires_at > v_now + 600000 THEN
    RAISE EXCEPTION 'OTP credentials or expiry are invalid' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-otp:' || p_user_id, 0));

  SELECT wallet.* INTO v_wallet
  FROM public."userWallets" AS wallet
  WHERE wallet."userId" = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  v_window_started_at := v_wallet."pinResetOtpRequestWindowStartedAt";
  v_request_count := v_wallet."pinResetOtpRequestCount";
  IF v_window_started_at IS NULL OR v_now >= v_window_started_at + 3600000 THEN
    v_window_started_at := v_now;
    v_request_count := 0;
  END IF;

  IF v_request_count >= 5 THEN
    v_retry_after_ms := greatest(1, v_window_started_at + 3600000 - v_now);
    RETURN jsonb_build_object('success', false, 'code', 'otp_rate_limited', 'retryAfterMs', v_retry_after_ms);
  END IF;

  IF v_wallet."pinResetOtpLastRequestedAt" IS NOT NULL
     AND v_now < v_wallet."pinResetOtpLastRequestedAt" + 60000 THEN
    v_retry_after_ms := greatest(1, v_wallet."pinResetOtpLastRequestedAt" + 60000 - v_now);
    RETURN jsonb_build_object('success', false, 'code', 'otp_rate_limited', 'retryAfterMs', v_retry_after_ms);
  END IF;

  UPDATE public."userWallets"
    SET "pinResetOtpHash" = p_otp_hash,
        "pinResetOtpSalt" = p_otp_salt,
        "pinResetOtpExpiresAt" = p_expires_at,
        "pinResetOtpUsedAt" = NULL,
        "pinResetOtpFailCount" = 0,
        "pinResetOtpLastRequestedAt" = v_now,
        "pinResetOtpRequestWindowStartedAt" = v_window_started_at,
        "pinResetOtpRequestCount" = v_request_count + 1,
        "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object('success', true, 'message', 'Reset code stored.');
END;
$function$;

REVOKE ALL ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) TO service_role;
COMMENT ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) IS
  'Internal: stores a hashed PIN-reset OTP and atomically limits resends to one per minute and five per hour; trusted server only.';

COMMIT;
