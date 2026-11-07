BEGIN;

-- ============================================================================
-- Lalao Wallet â€” Secure PIN credentials and atomic wallet operations
--
-- Migrates wallet credentials off plaintext storage and adds server-side
-- PIN hashing, attempt throttling, lockouts, hashed OTP resets, and atomic
-- SQL functions for transfers and market purchases.
--
-- IMPORTANT: Previously applied migrations are NOT edited. This migration only
-- adds new columns, indexes, and functions to the existing tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Secure credential / lockout columns on userWallets
-- ---------------------------------------------------------------------------
-- Legacy plaintext columns (walletPin, pinResetOtp) are retained read-only for
-- fallback/audit. New plaintext values must never be written into them.
ALTER TABLE public."userWallets"
  ADD COLUMN IF NOT EXISTS "walletPinHash" text,
  ADD COLUMN IF NOT EXISTS "pinSalt" text,
  ADD COLUMN IF NOT EXISTS "pinFailCount" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pinLockedUntil" bigint,
  ADD COLUMN IF NOT EXISTS "pinRequiresSetup" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pinResetOtpHash" text,
  ADD COLUMN IF NOT EXISTS "pinResetOtpSalt" text,
  ADD COLUMN IF NOT EXISTS "pinResetOtpExpiresAt" bigint,
  ADD COLUMN IF NOT EXISTS "pinResetOtpUsedAt" bigint,
  ADD COLUMN IF NOT EXISTS "pinResetOtpFailCount" integer NOT NULL DEFAULT 0;

-- Account numbers must be unique so no two wallets collide (Convex generation
-- used a 6-digit random suffix with no uniqueness guarantee).
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userWallets_accountNumber"
  ON public."userWallets" ("accountNumber") WHERE "accountNumber" IS NOT NULL;

-- Index for discovering migrated wallets that still require a secure PIN setup.
CREATE INDEX IF NOT EXISTS "idx_userWallets_pin_requires_setup"
  ON public."userWallets" ("pinRequiresSetup") WHERE "pinRequiresSetup" = true;

COMMENT ON COLUMN public."userWallets"."walletPinHash" IS
  'Server-side PBKDF2-HMAC-SHA-256 hash of the transaction PIN (peppered). Never plaintext.';
COMMENT ON COLUMN public."userWallets"."pinSalt" IS
  'Random 16-byte salt (hex) used for wallet PIN hashing.';
COMMENT ON COLUMN public."userWallets"."pinFailCount" IS
  'Consecutive failed PIN verification attempts (resets to 0 on success).';
COMMENT ON COLUMN public."userWallets"."pinLockedUntil" IS
  'Epoch-ms timestamp when the temporary PIN lockout expires, if any.';
COMMENT ON COLUMN public."userWallets"."pinRequiresSetup" IS
  'True when a legacy wallet carried plaintext PIN/OTP credentials at migration
  time and the owner must establish a new secure PIN before PIN-authorized
  transactions. Plaintext legacy values are never imported into hash columns.';
COMMENT ON COLUMN public."userWallets"."pinResetOtpHash" IS
  'Hashed one-time PIN-reset code. Never returned to clients.';
COMMENT ON COLUMN public."userWallets"."pinResetOtpSalt" IS
  'Salt (hex) for the PIN-reset OTP hash.';
COMMENT ON COLUMN public."userWallets"."pinResetOtpExpiresAt" IS
  'Epoch-ms expiry of the reset OTP (10 minutes after generation).';
COMMENT ON COLUMN public."userWallets"."pinResetOtpUsedAt" IS
  'Epoch-ms when the reset OTP was consumed (single-use enforcement).';
COMMENT ON COLUMN public."userWallets"."pinResetOtpFailCount" IS
  'Failed reset-OTP verification attempts.';

-- ---------------------------------------------------------------------------
-- 2. Legacy plaintext-credential backfill
--
-- Any wallet that still carries a plaintext walletPin (from the Convex
-- production snapshot) is flagged as requiring a new secure PIN. The plaintext
-- value is never copied into walletPinHash and never logged.
-- ---------------------------------------------------------------------------
UPDATE public."userWallets"
  SET "pinRequiresSetup" = true
  WHERE "walletPin" IS NOT NULL AND "walletPin" <> ''
    AND ("walletPinHash" IS NULL OR "walletPinHash" = '');

-- ---------------------------------------------------------------------------
-- 3. Atomic wallet operations (SECURITY DEFINER, service_role only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lalao_wallet_get_or_init(p_user_id text)
RETURNS TABLE (
  "_id" text, "userId" text, "balance" double precision, "currency" text,
  "accountNumber" text, "accountName" text, "bankName" text,
  "hasPin" boolean, "pinRequiresSetup" boolean, "updatedAt" bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_name text;
  v_has_pin boolean;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-owner:' || p_user_id, 0));

  SELECT wallet.* INTO v_wallet
  FROM public."userWallets" AS wallet
  WHERE wallet."userId" = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT users."name" INTO v_name FROM public."users" WHERE users."_id" = p_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public."userWallets" (
      "_id", "userId", "balance", "currency", "accountNumber", "accountName",
      "bankName", "pinRequiresSetup", "updatedAt"
    )
    VALUES (
      'wallet_' || replace(gen_random_uuid()::text, '-', ''),
      p_user_id, 0, 'LC',
      'LC-' || lpad((floor(random() * 900000) + 100000)::bigint::text, 6, '0'),
      coalesce(v_name, 'Lalao User'), 'LaLao Platform', false,
      floor(extract(epoch FROM clock_timestamp()) * 1000)
    )
    RETURNING * INTO v_wallet;
  END IF;

  v_has_pin := (v_wallet."walletPinHash" IS NOT NULL AND v_wallet."walletPinHash" <> '')
    OR (v_wallet."walletPin" IS NOT NULL AND v_wallet."walletPin" <> '');

  RETURN QUERY SELECT
    v_wallet."_id", v_wallet."userId", v_wallet."balance", v_wallet."currency",
    v_wallet."accountNumber", v_wallet."accountName", v_wallet."bankName",
    v_has_pin, v_wallet."pinRequiresSetup", v_wallet."updatedAt"::bigint;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_create_pin(
  p_user_id text,
  p_pin_hash text,
  p_pin_salt text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;
  IF p_pin_hash IS NULL OR p_pin_hash = '' OR p_pin_salt IS NULL OR p_pin_salt = '' THEN
    RAISE EXCEPTION 'PIN credentials are required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-pin:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  -- Allow creation only when no usable PIN exists yet, or the wallet was
  -- flagged as requiring setup after legacy migration.
  IF (v_wallet."walletPinHash" IS NOT NULL AND v_wallet."walletPinHash" <> '')
     OR (v_wallet."walletPin" IS NOT NULL AND v_wallet."walletPin" <> '')
  THEN
    IF NOT v_wallet."pinRequiresSetup" THEN
      RAISE EXCEPTION 'A wallet PIN is already configured. Use change PIN instead.' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public."userWallets"
    SET "walletPinHash" = p_pin_hash,
        "pinSalt" = p_pin_salt,
        "pinFailCount" = 0,
        "pinLockedUntil" = NULL,
        "pinRequiresSetup" = false,
        "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object('success', true, 'message', 'Wallet PIN created successfully.');
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_change_pin(
  p_user_id text,
  p_pin_hash text,
  p_pin_salt text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;
  IF p_pin_hash IS NULL OR p_pin_hash = '' OR p_pin_salt IS NULL OR p_pin_salt = '' THEN
    RAISE EXCEPTION 'PIN credentials are required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-pin:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  -- The Edge Function verifies the current PIN before calling this function.
  -- This function persists the new hash and clears any lockout state.
  UPDATE public."userWallets"
    SET "walletPinHash" = p_pin_hash,
        "pinSalt" = p_pin_salt,
        "pinFailCount" = 0,
        "pinLockedUntil" = NULL,
        "pinRequiresSetup" = false,
        "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object('success', true, 'message', 'Wallet PIN updated successfully.');
END;
$function$;

-- Internal: returns PIN credential material to the trusted Edge Function only.
-- Never exposed to browser clients.
CREATE OR REPLACE FUNCTION public.lalao_wallet_get_pin_credentials(p_user_id text)
RETURNS TABLE (
  "walletPinHash" text, "pinSalt" text, "pinFailCount" integer,
  "pinLockedUntil" bigint, "pinRequiresSetup" boolean,
  "pinResetOtpHash" text, "pinResetOtpSalt" text,
  "pinResetOtpExpiresAt" bigint, "pinResetOtpUsedAt" bigint,
  "pinResetOtpFailCount" integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY SELECT
    v_wallet."walletPinHash", v_wallet."pinSalt", v_wallet."pinFailCount",
    v_wallet."pinLockedUntil", v_wallet."pinRequiresSetup",
    v_wallet."pinResetOtpHash", v_wallet."pinResetOtpSalt",
    v_wallet."pinResetOtpExpiresAt", v_wallet."pinResetOtpUsedAt",
    v_wallet."pinResetOtpFailCount";
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_record_pin_attempt(
  p_user_id text,
  p_success boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  v_locked_until bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-pin:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_success THEN
    UPDATE public."userWallets"
      SET "pinFailCount" = 0,
          "pinLockedUntil" = NULL,
          "updatedAt" = v_now
    WHERE "_id" = v_wallet."_id";
    RETURN jsonb_build_object('success', true, 'locked', false);
  END IF;

  -- Failed attempt: increment and lock after 5 consecutive failures.
  v_locked_until := NULL;
  IF v_wallet."pinFailCount" + 1 >= 5 THEN
    v_locked_until := v_now + (15 * 60 * 1000); -- 15-minute lockout
  END IF;

  UPDATE public."userWallets"
    SET "pinFailCount" = v_wallet."pinFailCount" + 1,
        "pinLockedUntil" = v_locked_until,
        "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object(
    'success', false,
    'locked', v_locked_until IS NOT NULL,
    'lockedUntil', v_locked_until,
    'remainingAttempts', greatest(0, 4 - (v_wallet."pinFailCount" + 1))
  );
END;
$function$;

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
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;
  IF p_otp_hash IS NULL OR p_otp_hash = '' OR p_otp_salt IS NULL OR p_otp_salt = '' OR p_expires_at IS NULL THEN
    RAISE EXCEPTION 'OTP credentials are required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-otp:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public."userWallets"
    SET "pinResetOtpHash" = p_otp_hash,
        "pinResetOtpSalt" = p_otp_salt,
        "pinResetOtpExpiresAt" = p_expires_at,
        "pinResetOtpUsedAt" = NULL,
        "pinResetOtpFailCount" = 0,
        "updatedAt" = floor(extract(epoch FROM clock_timestamp()) * 1000)
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object('success', true, 'message', 'Reset code stored.');
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_reset_pin_with_otp(
  p_user_id text,
  p_candidate_otp_hash text,
  p_expected_otp_hash text,
  p_expected_otp_salt text,
  p_max_attempts integer,
  p_pin_hash text,
  p_pin_salt text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = ''
     OR p_candidate_otp_hash IS NULL OR p_candidate_otp_hash = ''
     OR p_expected_otp_hash IS NULL OR p_expected_otp_hash = ''
     OR p_expected_otp_salt IS NULL OR p_expected_otp_salt = ''
     OR p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 20
     OR p_pin_hash IS NULL OR p_pin_hash = '' OR p_pin_salt IS NULL OR p_pin_salt = '' THEN
    RAISE EXCEPTION 'User, OTP, and new PIN credentials are required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-otp:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  -- OTP must exist, not be expired, and not already consumed (single-use).
  IF v_wallet."pinResetOtpHash" IS NULL OR v_wallet."pinResetOtpHash" = ''
     OR v_wallet."pinResetOtpExpiresAt" IS NULL
     OR v_now >= v_wallet."pinResetOtpExpiresAt" THEN
    RAISE EXCEPTION 'Verification code has expired. Please request a new code.' USING ERRCODE = 'P0410';
  END IF;

  IF v_wallet."pinResetOtpUsedAt" IS NOT NULL THEN
    RAISE EXCEPTION 'Verification code has already been used.' USING ERRCODE = 'P0410';
  END IF;

  IF v_wallet."pinResetOtpFailCount" >= p_max_attempts THEN
    UPDATE public."userWallets"
      SET "pinResetOtpHash" = NULL, "pinResetOtpSalt" = NULL,
          "pinResetOtpExpiresAt" = NULL, "updatedAt" = v_now
    WHERE "_id" = v_wallet."_id";
    RETURN jsonb_build_object('success', false, 'code', 'otp_locked', 'remainingAttempts', 0);
  END IF;

  -- The Edge Function hashes the supplied OTP; compare under the row lock and
  -- reject stale credential snapshots so concurrent requests cannot consume a
  -- replacement OTP or reset PIN with an earlier OTP.
  IF p_expected_otp_hash <> v_wallet."pinResetOtpHash"
     OR p_expected_otp_salt <> v_wallet."pinResetOtpSalt" THEN
    RETURN jsonb_build_object('success', false, 'code', 'otp_invalidated', 'remainingAttempts', 0);
  END IF;
  IF v_wallet."pinResetOtpSalt" IS NULL OR v_wallet."pinResetOtpSalt" = '' THEN
    RETURN jsonb_build_object('success', false, 'code', 'otp_invalidated', 'remainingAttempts', 0);
  END IF;
  IF p_candidate_otp_hash IS DISTINCT FROM v_wallet."pinResetOtpHash" THEN
    UPDATE public."userWallets"
      SET "pinResetOtpFailCount" = v_wallet."pinResetOtpFailCount" + 1,
          "pinResetOtpHash" = CASE WHEN v_wallet."pinResetOtpFailCount" + 1 >= p_max_attempts THEN NULL ELSE "pinResetOtpHash" END,
          "pinResetOtpSalt" = CASE WHEN v_wallet."pinResetOtpFailCount" + 1 >= p_max_attempts THEN NULL ELSE "pinResetOtpSalt" END,
          "pinResetOtpExpiresAt" = CASE WHEN v_wallet."pinResetOtpFailCount" + 1 >= p_max_attempts THEN NULL ELSE "pinResetOtpExpiresAt" END,
          "updatedAt" = v_now
    WHERE "_id" = v_wallet."_id";
    RETURN jsonb_build_object('success', false,
      'code', CASE WHEN v_wallet."pinResetOtpFailCount" + 1 >= p_max_attempts THEN 'otp_locked' ELSE 'invalid_otp' END,
      'remainingAttempts', greatest(0, p_max_attempts - (v_wallet."pinResetOtpFailCount" + 1)));
  END IF;

  -- Consume the OTP (single-use) and install the new PIN.
  UPDATE public."userWallets"
    SET "pinResetOtpHash" = NULL,
        "pinResetOtpSalt" = NULL,
        "pinResetOtpExpiresAt" = NULL,
        "pinResetOtpUsedAt" = v_now,
        "pinResetOtpFailCount" = 0,
        "walletPinHash" = p_pin_hash,
        "pinSalt" = p_pin_salt,
        "pinFailCount" = 0,
        "pinLockedUntil" = NULL,
        "pinRequiresSetup" = false,
        "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  RETURN jsonb_build_object('success', true, 'message', 'Your transaction PIN has been successfully reset!');
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_transfer_credits(
  p_user_id text,
  p_recipient_page_id text,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_sender_wallet public."userWallets"%ROWTYPE;
  v_recipient_page public."pages"%ROWTYPE;
  v_recipient_owner public."users"%ROWTYPE;
  v_recipient_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  v_tx_id text;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_recipient_page_id IS NULL OR p_recipient_page_id = ''
     OR p_amount IS NULL OR p_amount <= 0 OR p_amount <> trunc(p_amount) THEN
    RAISE EXCEPTION 'Invalid transfer request' USING ERRCODE = '22023';
  END IF;

  -- Lock sender wallet for the duration of the transfer (prevents concurrent spending).
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-transfer:' || p_user_id, 0));

  SELECT * INTO v_sender_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_sender_wallet."balance"::numeric < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_recipient_page FROM public."pages" WHERE "_id" = p_recipient_page_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient business not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_recipient_page."type" <> 'business' THEN
    RAISE EXCEPTION 'LaLao Credits cannot be transferred to personal accounts.' USING ERRCODE = '42501';
  END IF;

  IF v_sender_wallet."userId" = v_recipient_page."ownerId" THEN
    RAISE EXCEPTION 'Cannot transfer to your own business' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_recipient_owner FROM public."users" WHERE "_id" = v_recipient_page."ownerId";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient business owner not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_recipient_wallet FROM public."userWallets" WHERE "userId" = v_recipient_page."ownerId" FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public."userWallets" (
      "_id", "userId", "balance", "currency", "accountNumber", "accountName",
      "bankName", "updatedAt"
    )
    VALUES (
      'wallet_' || replace(gen_random_uuid()::text, '-', ''),
      v_recipient_page."ownerId", 0, 'LC',
      'LC-' || lpad((floor(random() * 900000) + 100000)::bigint::text, 6, '0'),
      coalesce(v_recipient_owner."name", 'Business Owner'), 'LaLao Platform', v_now
    )
    RETURNING * INTO v_recipient_wallet;
  END IF;

  v_tx_id := 'TXN-' || lpad((floor(random() * 900000000) + 100000000)::bigint::text, 9, '0');

  UPDATE public."userWallets"
    SET "balance" = "balance" - p_amount, "updatedAt" = v_now
  WHERE "_id" = v_sender_wallet."_id";

  UPDATE public."userWallets"
    SET "balance" = "balance" + p_amount, "updatedAt" = v_now
  WHERE "_id" = v_recipient_wallet."_id";

  INSERT INTO public."walletTransactions" (
    "_id", "walletId", "userId", "relatedUserId", "relatedUserName", "relatedUserUsername",
    "amount", "fee", "currency", "assetType", "type", "status", "description",
    "reference", "createdAt"
  )
  VALUES (
    'wtx_' || replace(gen_random_uuid()::text, '-', ''),
    v_sender_wallet."_id", p_user_id, v_recipient_page."ownerId",
    v_recipient_page."name", v_recipient_page."username",
    p_amount::double precision, 0, 'LC', 'LALAO_CREDITS',
    'transfer_out', 'completed', 'Payment to Partner Business', v_tx_id, v_now
  );

  INSERT INTO public."walletTransactions" (
    "_id", "walletId", "userId", "relatedUserId", "relatedUserName", "relatedUserUsername",
    "amount", "fee", "currency", "assetType", "type", "status", "description",
    "reference", "createdAt"
  )
  VALUES (
    'wtx_' || replace(gen_random_uuid()::text, '-', ''),
    v_recipient_wallet."_id", v_recipient_page."ownerId", p_user_id,
    coalesce(v_sender_wallet."accountName", 'Lalao User'), NULL,
    p_amount::double precision, 0, 'LC', 'LALAO_CREDITS',
    'deposit', 'completed', 'Payment from Lalao User', v_tx_id, v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'newBalance', (v_sender_wallet."balance"::numeric - p_amount)::double precision,
    'transactionId', v_tx_id,
    'reference', v_tx_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_initiate_market_purchase(
  p_user_id text,
  p_service_category text,
  p_provider text,
  p_customer_identifier text,
  p_product text,
  p_variation_id text,
  p_amount numeric,
  p_fee numeric,
  p_request_id text
)
RETURNS TABLE (
  "marketTxId" text, "walletTxId" text, "laLaoReference" text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_existing public."marketTransactions"%ROWTYPE;
  v_total numeric;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  v_wallet_tx_id text;
  v_market_tx_id text;
  v_la_lao_ref text;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_request_id IS NULL OR p_request_id = ''
     OR p_amount IS NULL OR p_amount <= 0 OR p_fee IS NULL THEN
    RAISE EXCEPTION 'Invalid purchase request' USING ERRCODE = '22023';
  END IF;

  v_total := p_amount + p_fee;

  -- Idempotency: reject duplicate request IDs.
  SELECT * INTO v_existing FROM public."marketTransactions" WHERE "requestId" = p_request_id;
  IF FOUND THEN
    RAISE EXCEPTION 'Duplicate request' USING ERRCODE = '23505';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-purchase:' || p_user_id, 0));

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_wallet."balance"::numeric < v_total THEN
    RAISE EXCEPTION 'Insufficient wallet balance.' USING ERRCODE = '42501';
  END IF;

  -- Reserve balance.
  UPDATE public."userWallets"
    SET "balance" = "balance" - v_total, "updatedAt" = v_now
  WHERE "_id" = v_wallet."_id";

  v_la_lao_ref := 'LAL-MKT-' || lpad((floor(random() * 90000000) + 10000000)::bigint::text, 8, '0');

  v_wallet_tx_id := 'wtx_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public."walletTransactions" (
    "_id", "walletId", "userId", "amount", "fee", "type", "status", "description",
    "assetType", "currency", "reference", "createdAt"
  )
  VALUES (
    v_wallet_tx_id, v_wallet."_id", p_user_id,
    v_total::double precision, p_fee::double precision,
    'MARKET_PURCHASE', 'pending',
    p_provider || ' ' || p_service_category || ' - ' || p_customer_identifier,
    'LALAO_CREDITS', 'LC', v_la_lao_ref, v_now
  );

  v_market_tx_id := 'mtx_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public."marketTransactions" (
    "_id", "userId", "type", "category", "provider", "status", "requestId",
    "amount", "platformFee", "totalAmount", "currency", "recipient",
    "network", "variationId", "productName", "metadata", "createdAt", "updatedAt"
  )
  VALUES (
    v_market_tx_id, p_user_id, 'MARKET_PURCHASE', upper(p_service_category),
    p_provider, 'PENDING', p_request_id,
    p_amount::double precision, p_fee::double precision, v_total::double precision,
    'LC', p_customer_identifier,
    NULL, p_variation_id, p_product,
    jsonb_build_object('walletTxId', v_wallet_tx_id), v_now, v_now
  );

  RETURN QUERY SELECT v_market_tx_id, v_wallet_tx_id, v_la_lao_ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_complete_market_purchase(
  p_market_tx_id text,
  p_wallet_tx_id text,
  p_provider_order_id text,
  p_provider_amount numeric,
  p_provider_discount numeric,
  p_token text,
  p_units text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_market_tx public."marketTransactions"%ROWTYPE;
  v_wallet_tx public."walletTransactions"%ROWTYPE;
  v_wallet public."userWallets"%ROWTYPE;
BEGIN
  SELECT * INTO v_market_tx FROM public."marketTransactions" WHERE "_id" = p_market_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market transaction not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_wallet_tx FROM public."walletTransactions" WHERE "_id" = p_wallet_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet transaction not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_market_tx."status" NOT IN ('PENDING', 'PROCESSING') THEN
    -- Already finalized: idempotent no-op.
    RETURN jsonb_build_object('success', true, 'alreadyFinalized', true, 'status', v_market_tx."status");
  END IF;

  IF v_wallet_tx."status" <> 'pending' THEN
    RAISE EXCEPTION 'Wallet transaction is not pending' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "_id" = v_wallet_tx."walletId";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public."walletTransactions"
    SET "status" = 'completed'
  WHERE "_id" = p_wallet_tx_id;

  UPDATE public."marketTransactions"
    SET "status" = 'COMPLETED',
        "providerOrderId" = p_provider_order_id,
        "providerAmount" = coalesce(p_provider_amount, v_market_tx."amount"),
        "providerDiscount" = coalesce(p_provider_discount, 0),
        "token" = p_token,
        "units" = p_units,
        "updatedAt" = floor(extract(epoch FROM clock_timestamp()) * 1000),
        "completedAt" = floor(extract(epoch FROM clock_timestamp()) * 1000)
  WHERE "_id" = p_market_tx_id;

  RETURN jsonb_build_object('success', true, 'status', 'COMPLETED');
END;
$function$;

CREATE OR REPLACE FUNCTION public.lalao_wallet_fail_market_purchase(
  p_market_tx_id text,
  p_wallet_tx_id text,
  p_error_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_market_tx public."marketTransactions"%ROWTYPE;
  v_wallet_tx public."walletTransactions"%ROWTYPE;
  v_wallet public."userWallets"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  SELECT * INTO v_market_tx FROM public."marketTransactions" WHERE "_id" = p_market_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market transaction not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_wallet_tx FROM public."walletTransactions" WHERE "_id" = p_wallet_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet transaction not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_market_tx."status" NOT IN ('PENDING', 'PROCESSING') THEN
    RETURN jsonb_build_object('success', true, 'alreadyFinalized', true, 'status', v_market_tx."status");
  END IF;

  SELECT * INTO v_wallet FROM public."userWallets" WHERE "_id" = v_wallet_tx."walletId";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  -- Restore reserved balance and record refund ledger entry.
  UPDATE public."userWallets"
    SET "balance" = "balance" + v_wallet_tx."amount", "updatedAt" = v_now
  WHERE "_id" = v_wallet_tx."walletId";

  INSERT INTO public."walletTransactions" (
    "_id", "walletId", "userId", "amount", "fee", "type", "status", "description",
    "assetType", "currency", "reference", "createdAt"
  )
  VALUES (
    'wtx_' || replace(gen_random_uuid()::text, '-', ''),
    v_wallet_tx."walletId", v_wallet_tx."userId",
    v_wallet_tx."amount", 0,
    'MARKET_REFUND', 'completed',
    'Refund for ' || v_market_tx."category" || ' - ' || v_market_tx."recipient",
    'LALAO_CREDITS', 'LC',
    'REF-' || coalesce(v_wallet_tx."reference", p_market_tx_id), v_now
  );

  UPDATE public."walletTransactions"
    SET "status" = 'failed'
  WHERE "_id" = p_wallet_tx_id;

  UPDATE public."marketTransactions"
    SET "status" = 'FAILED',
        "errorMessage" = p_error_message,
        "updatedAt" = v_now,
        "refundedAt" = v_now
  WHERE "_id" = p_market_tx_id;

  RETURN jsonb_build_object('success', true, 'status', 'FAILED');
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Permissions
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.lalao_wallet_get_or_init(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_create_pin(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_change_pin(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_get_pin_credentials(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_record_pin_attempt(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_reset_pin_with_otp(text, text, text, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_transfer_credits(text, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_initiate_market_purchase(text, text, text, text, text, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_complete_market_purchase(text, text, text, numeric, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lalao_wallet_fail_market_purchase(text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.lalao_wallet_get_or_init(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_create_pin(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_change_pin(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_get_pin_credentials(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_record_pin_attempt(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_reset_pin_with_otp(text, text, text, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_transfer_credits(text, text, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_initiate_market_purchase(text, text, text, text, text, text, numeric, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_complete_market_purchase(text, text, text, numeric, numeric, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lalao_wallet_fail_market_purchase(text, text, text) TO service_role;

COMMENT ON FUNCTION public.lalao_wallet_get_or_init(text) IS 'Returns or creates the caller wallet without exposing PIN credentials; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_create_pin(text, text, text) IS 'Stores a server-hashed wallet PIN after Edge Function verification; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_change_pin(text, text, text) IS 'Replaces the stored wallet PIN hash after the Edge Function verifies the current PIN; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_get_pin_credentials(text) IS 'Internal: returns stored PIN/OTP credential material to the trusted Edge Function. Never for clients.';
COMMENT ON FUNCTION public.lalao_wallet_record_pin_attempt(text, boolean) IS 'Internal: records a PIN attempt result and applies lockout throttling; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_request_pin_reset_otp(text, text, text, bigint) IS 'Internal: stores a hashed PIN-reset OTP with expiry; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_reset_pin_with_otp(text, text, text, text, integer, text, text) IS 'Internal: atomically verifies and consumes a single-use OTP, tracking OTP failures separately from PIN attempts; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_transfer_credits(text, text, numeric) IS 'Atomically transfers LaLao Credits to a business page with balance locking; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_initiate_market_purchase(text, text, text, text, text, text, numeric, numeric, text) IS 'Idempotently reserves balance and creates pending market/wallet ledger entries; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_complete_market_purchase(text, text, text, numeric, numeric, text, text) IS 'Finalizes a completed market purchase; trusted server only.';
COMMENT ON FUNCTION public.lalao_wallet_fail_market_purchase(text, text, text) IS 'Refunds and finalizes a failed market purchase; trusted server only.';

COMMIT;
