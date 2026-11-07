BEGIN;
SELECT plan(21);

SELECT ok(to_regprocedure('public.ensure_lalao_wallet(text)') IS NOT NULL, 'wallet initialization RPC exists');
SELECT ok(to_regprocedure('public.create_lalao_wallet_funding(text,numeric,text)') IS NOT NULL, 'Batch funding reservation RPC exists');
SELECT ok(to_regprocedure('public.settle_lalao_wallet_funding(text,text,numeric,text)') IS NOT NULL, 'verified Batch settlement RPC exists');
SELECT ok(NOT has_function_privilege('anon', 'public.create_lalao_wallet_funding(text,numeric,text)', 'EXECUTE'), 'anonymous users cannot create funding records');
SELECT ok(NOT has_function_privilege('authenticated', 'public.create_lalao_wallet_funding(text,numeric,text)', 'EXECUTE'), 'browser JWTs cannot create funding records directly');
SELECT ok(has_function_privilege('service_role', 'public.create_lalao_wallet_funding(text,numeric,text)', 'EXECUTE'), 'trusted Edge Function can reserve funding');
SELECT ok(NOT has_function_privilege('anon', 'public.settle_lalao_wallet_funding(text,text,numeric,text)', 'EXECUTE'), 'anonymous users cannot settle funding');
SELECT ok(NOT has_function_privilege('authenticated', 'public.settle_lalao_wallet_funding(text,text,numeric,text)', 'EXECUTE'), 'browser JWTs cannot settle funding directly');
SELECT ok(has_function_privilege('service_role', 'public.settle_lalao_wallet_funding(text,text,numeric,text)', 'EXECUTE'), 'trusted server can settle verified funding');

INSERT INTO public."users" ("_id", "tokenIdentifier", "onboardingStep", "createdAt", "updatedAt", "name")
VALUES ('wallet_batch_runtime_user', 'synthetic|wallet-batch', 'complete', 1, 1, 'Synthetic Wallet User');

SELECT is((public.ensure_lalao_wallet('wallet_batch_runtime_user'))."balance", 0::double precision, 'wallet initialization starts with zero balance');
SELECT is((public.ensure_lalao_wallet('wallet_batch_runtime_user'))."_id", (public.ensure_lalao_wallet('wallet_batch_runtime_user'))."_id", 'wallet initialization is idempotent');
SELECT is(
  public.create_lalao_wallet_funding('wallet_batch_runtime_user', 125, 'BACHS_FUND_TEST_00001')->>'status',
  'pending', 'funding reservation records a pending Batch payment'
);
SELECT is(
  public.create_lalao_wallet_funding('wallet_batch_runtime_user', 125, 'BACHS_FUND_TEST_00001')->>'status',
  'pending', 'repeated reservation with same owner, amount, and reference is idempotent'
);
SELECT is((SELECT count(*)::integer FROM public."walletTransactions" WHERE "reference" = 'BACHS_FUND_TEST_00001'), 1, 'duplicate reservation creates no duplicate ledger row');
SELECT is((SELECT "balance" FROM public."userWallets" WHERE "userId" = 'wallet_batch_runtime_user'), 0::double precision, 'reservation does not credit the wallet');
SELECT throws_ok(
  $$SELECT public.create_lalao_wallet_funding('wallet_batch_runtime_user', 125, 'not-a-batch-reference')$$,
  '22023', 'Invalid wallet funding request', 'malformed references are rejected'
);
SELECT is(public.settle_lalao_wallet_funding('wallet_batch_runtime_user', 'BACHS_FUND_TEST_00001', 125, 'batch-payment-001')->>'success', 'true', 'verified Batch payment settles successfully');
SELECT is((SELECT "balance" FROM public."userWallets" WHERE "userId" = 'wallet_batch_runtime_user'), 125::double precision, 'settlement credits the wallet once');
SELECT is((SELECT "status" FROM public."walletTransactions" WHERE "reference" = 'BACHS_FUND_TEST_00001'), 'completed', 'settlement marks the ledger entry completed');
SELECT is((public.settle_lalao_wallet_funding('wallet_batch_runtime_user', 'BACHS_FUND_TEST_00001', 125, 'batch-payment-001')->>'alreadySettled'), 'true', 'repeated settlement is idempotent');
SELECT is((SELECT "balance" FROM public."userWallets" WHERE "userId" = 'wallet_batch_runtime_user'), 125::double precision, 'repeated settlement never credits twice');

SELECT * FROM finish();
ROLLBACK;
