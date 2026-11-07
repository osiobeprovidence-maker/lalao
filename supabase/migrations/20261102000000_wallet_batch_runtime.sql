BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_lalao_wallet(p_user_id text)
RETURNS public."userWallets"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_name text;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Wallet owner is required' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-owner:' || p_user_id, 0));
  SELECT users."name" INTO v_name FROM public."users" AS users WHERE users."_id" = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_wallet FROM public."userWallets" WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public."userWallets" ("_id", "userId", "balance", "currency", "accountNumber", "accountName", "bankName", "updatedAt")
    VALUES ('wallet_' || replace(gen_random_uuid()::text, '-', ''), p_user_id, 0, 'LC',
      'LC-' || lpad((floor(random() * 900000) + 100000)::bigint::text, 6, '0'), coalesce(v_name, 'Lalao User'), 'LaLao Platform', floor(extract(epoch FROM clock_timestamp()) * 1000))
    RETURNING * INTO v_wallet;
  END IF;
  RETURN v_wallet;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_lalao_wallet_funding(p_user_id text, p_amount numeric, p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_wallet public."userWallets"%ROWTYPE;
  v_tx public."walletTransactions"%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_reference IS NULL OR p_reference !~ '^BACHS_FUND_[A-Za-z0-9_-]{8,100}$'
     OR p_amount IS NULL OR p_amount < 100 OR p_amount > 500000 OR p_amount <> trunc(p_amount) THEN
    RAISE EXCEPTION 'Invalid wallet funding request' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-reference:' || p_reference, 0));
  SELECT * INTO v_tx FROM public."walletTransactions" WHERE "reference" = p_reference FOR UPDATE;
  IF FOUND THEN
    IF v_tx."userId" <> p_user_id OR v_tx."amount" <> p_amount OR v_tx."paymentProvider" <> 'bachs' OR v_tx."type" <> 'deposit' THEN
      RAISE EXCEPTION 'Funding reference conflicts with an existing transaction' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object('walletId', v_tx."walletId", 'status', v_tx."status");
  END IF;
  SELECT * INTO v_wallet FROM public.ensure_lalao_wallet(p_user_id);
  INSERT INTO public."walletTransactions" ("_id", "walletId", "userId", "amount", "type", "status", "paymentProvider", "reference", "description", "currency", "assetType", "createdAt")
  VALUES ('wtx_' || replace(gen_random_uuid()::text, '-', ''), v_wallet."_id", p_user_id, p_amount::double precision, 'deposit', 'pending', 'bachs', p_reference,
    'Wallet funded via Batch (₦' || p_amount::text || ' -> ' || p_amount::text || ' LC)', 'LC', 'LALAO_CREDITS', v_now)
  RETURNING * INTO v_tx;
  RETURN jsonb_build_object('walletId', v_wallet."_id", 'status', v_tx."status");
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_lalao_wallet_funding(p_user_id text, p_reference text, p_amount numeric, p_provider_transaction_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_tx public."walletTransactions"%ROWTYPE;
  v_balance double precision;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_reference IS NULL OR p_amount IS NULL OR p_amount <= 0
     OR p_provider_transaction_id IS NULL OR p_provider_transaction_id = '' THEN
    RAISE EXCEPTION 'Invalid verified funding details' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet-reference:' || p_reference, 0));
  SELECT * INTO v_tx FROM public."walletTransactions" WHERE "reference" = p_reference FOR UPDATE;
  IF NOT FOUND OR v_tx."userId" <> p_user_id OR v_tx."paymentProvider" <> 'bachs' THEN
    RAISE EXCEPTION 'Funding transaction not found for this account' USING ERRCODE = 'P0002';
  END IF;
  IF v_tx."amount"::numeric <> p_amount THEN RAISE EXCEPTION 'Verified payment amount does not match' USING ERRCODE = '22023'; END IF;
  IF v_tx."status" = 'completed' THEN
    SELECT "balance" INTO v_balance FROM public."userWallets" WHERE "_id" = v_tx."walletId" AND "userId" = p_user_id;
    RETURN jsonb_build_object('success', true, 'alreadySettled', true, 'newBalance', v_balance);
  END IF;
  IF v_tx."status" <> 'pending' THEN RAISE EXCEPTION 'Funding transaction is not pending' USING ERRCODE = '55000'; END IF;
  UPDATE public."userWallets" SET "balance" = "balance" + v_tx."amount", "updatedAt" = v_now
   WHERE "_id" = v_tx."walletId" AND "userId" = p_user_id RETURNING "balance" INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found for this funding transaction' USING ERRCODE = 'P0002'; END IF;
  UPDATE public."walletTransactions" SET "status" = 'completed', "providerTransactionId" = p_provider_transaction_id
   WHERE "_id" = v_tx."_id";
  RETURN jsonb_build_object('success', true, 'newBalance', v_balance);
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_lalao_wallet(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lalao_wallet_funding(text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_lalao_wallet_funding(text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_lalao_wallet(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lalao_wallet_funding(text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_lalao_wallet_funding(text, text, numeric, text) TO service_role;

COMMENT ON FUNCTION public.ensure_lalao_wallet(text) IS 'Creates or returns the specified user wallet; trusted server only.';
COMMENT ON FUNCTION public.create_lalao_wallet_funding(text, numeric, text) IS 'Idempotently reserves a Batch wallet funding reference without crediting balance; trusted server only.';
COMMENT ON FUNCTION public.settle_lalao_wallet_funding(text, text, numeric, text) IS 'Atomically settles a server-verified Batch wallet payment exactly once; trusted server only.';

COMMIT;
