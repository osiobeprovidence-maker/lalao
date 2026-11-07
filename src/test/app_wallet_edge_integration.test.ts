import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import Module from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migrationConfig = readFileSync(resolve(root, 'supabase/config.toml'), 'utf8');
assert.match(migrationConfig, /^project_id\s*=\s*"lalao-local"/m, 'integration tests must target the local project');

const profileDir = resolve(root, '.supabase-edge-test-profile');
mkdirSync(profileDir, { recursive: true });
const cliPath = resolve(root, 'node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
assert.ok(existsSync(cliPath), 'Supabase CLI must be installed');
const bundlePath = resolve(root, `.app-wallet-edge-test-${process.pid}.cjs`);
const helperPath = resolve(root, 'supabase/functions/_shared/currentUser.ts');
const temporarySqlFiles: string[] = [];

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function runLocalSql(sql: string): unknown {
  const sqlPath = resolve(root, `.app-wallet-edge-test-${process.pid}-${randomUUID()}.sql`);
  temporarySqlFiles.push(sqlPath);
  writeFileSync(sqlPath, `${sql.trim()}\n`, 'utf8');
  const env = {
    ...process.env,
    USERPROFILE: profileDir,
    HOME: profileDir,
  };
  const result = spawnSync(cliPath, ['db', 'query', '--local', '--file', sqlPath], {
    cwd: root,
    env,
    encoding: 'utf8',
    shell: false,
    timeout: 30_000,
  });
  if (result.error) throw result.error;

  const jsonStart = result.stdout.indexOf('{');
  const jsonEnd = result.stdout.lastIndexOf('}');
  let parsed: { rows?: Array<Record<string, unknown>>; error?: { message?: string } } | null = null;
  if (jsonStart >= 0 && jsonEnd >= jsonStart) {
    try { parsed = JSON.parse(result.stdout.slice(jsonStart, jsonEnd + 1)); } catch { /* report a generic local CLI response error below */ }
  }
  if (result.status === 0 && !parsed) return { rows: [], raw: result.stdout.trim() };
  if (result.status !== 0 || !parsed) {
    const output = parsed;
    const message = output?.error?.message ?? `Local Supabase SQL command failed (status ${result.status}): ${result.stderr.trim()} ${result.stdout.trim()}`;
    const code = /expired|already been used/i.test(message) ? 'P0410' : 'LOCAL_DB_ERROR';
    throw Object.assign(new Error(message), { code });
  }
  return parsed;
}

type QueryEnvelope = { rows?: Array<Record<string, unknown>> };
function queryRows(sql: string): Array<Record<string, unknown>> {
  return ((runLocalSql(sql) as QueryEnvelope).rows ?? []);
}

function serviceRoleCte(sqlExpression: string): string {
  return `WITH service_role_context AS MATERIALIZED (
    SELECT set_config('role', 'service_role', true)
  ), rpc_result AS MATERIALIZED (
    SELECT ${sqlExpression} AS result FROM service_role_context
  ) SELECT result FROM rpc_result`;
}

function localRpc(name: string, args: Record<string, unknown>): { data: unknown; error: { code: string; message: string } | null } {
  const uid = sqlString(String(args.p_user_id ?? ''));
  let sql: string;
  if (name === 'lalao_wallet_get_pin_credentials') {
    sql = `WITH service_role_context AS MATERIALIZED (SELECT set_config('role', 'service_role', true))
      SELECT coalesce(jsonb_agg(to_jsonb(credentials)), '[]'::jsonb) AS result
      FROM service_role_context, public.lalao_wallet_get_pin_credentials(${uid}) AS credentials`;
  } else if (name === 'lalao_wallet_request_pin_reset_otp') {
    sql = serviceRoleCte(`public.lalao_wallet_request_pin_reset_otp(
      ${uid}, ${sqlString(String(args.p_otp_hash))}, ${sqlString(String(args.p_otp_salt))}, ${Number(args.p_expires_at)}
    )`);
  } else if (name === 'lalao_wallet_reset_pin_with_otp') {
    sql = serviceRoleCte(`public.lalao_wallet_reset_pin_with_otp(
      ${uid}, ${sqlString(String(args.p_candidate_otp_hash))}, ${sqlString(String(args.p_expected_otp_hash))},
      ${sqlString(String(args.p_expected_otp_salt))}, ${Number(args.p_max_attempts)},
      ${sqlString(String(args.p_pin_hash))}, ${sqlString(String(args.p_pin_salt))}
    )`);
  } else if (name === 'lalao_wallet_record_pin_attempt') {
    sql = serviceRoleCte(`public.lalao_wallet_record_pin_attempt(${uid}, ${args.p_success === true})`);
  } else {
    throw new Error(`Unexpected RPC in integration harness: ${name}`);
  }
  try {
    const rows = queryRows(`${sql};`);
    return { data: rows[0]?.result ?? null, error: null };
  } catch (error) {
    const failure = error as Error & { code?: string };
    return { data: null, error: { code: failure.code ?? 'LOCAL_DB_ERROR', message: failure.message } };
  }
}

async function main(): Promise<void> {
  const pepper = 'wallet-edge-local-test-pepper-not-a-production-secret';
  let resendApiKey: string | undefined = 'local-test-only';
  Object.defineProperty(globalThis, 'Deno', {
    configurable: true,
    value: { env: { get: (name: string) => name === 'WALLET_PIN_PEPPER' ? pepper : name === 'WALLET_PIN_RESET_OTP_MAX_ATTEMPTS' ? '5' : name === 'RESEND_API_KEY' ? resendApiKey : undefined } },
  });

  const helperCompiled = ts.transpileModule(readFileSync(helperPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const helperModule = new Module(helperPath);
  (helperModule as unknown as { _compile: (code: string, filename: string) => void })._compile(helperCompiled, helperPath);
  const source = readFileSync(resolve(root, 'supabase/functions/app-wallet/index.ts'), 'utf8');
  const edgeCompiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
    .replace('require("../_shared/withLalaoAuth.ts")', 'globalThis.__walletEdgeSupabaseShim');
  assert.doesNotMatch(edgeCompiled, /require\("(?:npm:|\.\.\/_shared\/)/, 'test harness must replace Edge-only imports');
  Object.assign(globalThis, {
    __walletEdgeSupabaseShim: { withLalaoAuth: (handler: unknown) => handler },
  });
  const edgeModule = new Module(bundlePath);
  (edgeModule as unknown as { _compile: (code: string, filename: string) => void })._compile(edgeCompiled, bundlePath);
  const edgeFetch = (edgeModule.exports as { default: { fetch: (request: Request, context: unknown) => Promise<Response> } }).default.fetch;
  assert.match(source, /withLalaoAuth\(/, 'production function must retain shared authentication wrapper');
  assert.match(source, /lalao_wallet_reset_pin_with_otp/, 'reset operation must use the atomic OTP RPC');

  const previousFetch = globalThis.fetch;
  let capturedOtp = '';
  let emailRecipient = '';
  let emailSendCount = 0;
  let emailExpiryCopy = false;
  let resendStatus = 200;
  let resendNetworkFailure = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'https://api.resend.com/emails', 'the local test must intercept outbound requests');
    if (resendNetworkFailure) throw new Error('simulated local Resend network failure');
    const message = JSON.parse(String(init?.body)) as { to: string[]; html: string };
    const headers = init?.headers as Record<string, string>;
    emailRecipient = message.to[0] ?? '';
    capturedOtp = message.html.match(/<strong>(\d{6})<\/strong>/)?.[1] ?? '';
    emailExpiryCopy = message.html.includes('expires in 10 minutes');
    assert.ok(headers?.Authorization === 'Bearer local-test-only', 'Resend request must use configured API authorization');
    emailSendCount += 1;
    return new Response('{}', { status: resendStatus, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  const suffix = randomUUID().replaceAll('-', '');
  const userA = `wallet_edge_test_a_${suffix}`;
  const userB = `wallet_edge_test_b_${suffix}`;
  const walletA = `wallet_edge_test_wallet_a_${suffix}`;
  const walletB = `wallet_edge_test_wallet_b_${suffix}`;
  const subjectA = `edge-subject-a-${suffix}`;
  const subjectB = `edge-subject-b-${suffix}`;
  const issuer = 'https://securetoken.google.com/uselalaoapp';
  const audience = 'uselalaoapp';
  const userRows = new Map<string, Record<string, unknown>>([
    [userA, { _id: userA, tokenIdentifier: `${issuer}|${subjectA}`, email: 'edge-a@example.invalid', name: 'Local Test A' }],
    [userB, { _id: userB, tokenIdentifier: `${issuer}|${subjectB}`, email: 'edge-b@example.invalid', name: 'Local Test B' }],
  ]);

  const admin = {
    from(table: string) {
      let filters: Record<string, unknown> = {};
      const query = {
        select: () => query,
        eq: (field: string, value: unknown) => { filters[field] = value; return query; },
        limit: async () => ({
          data: table === 'authIdentities' ? [] : [...userRows.values()]
            .filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value))
            .map((row) => ({ _id: row._id, userId: row._id })),
          error: null,
        }),
        maybeSingle: async () => ({ data: userRows.get(String(filters._id)) ?? null, error: null }),
      };
      return query;
    },
    rpc: async (name: string, args: Record<string, unknown>) => localRpc(name, args),
  };

  function context(subject?: string) {
    return {
      supabaseAdmin: admin,
      principal: { provider: 'firebase', issuer, audience, subject: subject ?? '', issuedAt: 0, expiresAt: 0, email: null, emailVerified: false, name: null, picture: null, firebaseSignInProvider: null },
      currentUser: subject === subjectA ? userRows.get(userA) : subject === subjectB ? userRows.get(userB) : null,
    };
  }

  async function call(operation: string, payload: Record<string, unknown>, subject?: string) {
    const request = new Request('http://127.0.0.1/functions/v1/app-wallet', {
      method: 'POST',
      headers: { authorization: 'Bearer local-test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ operation, payload }),
    });
    return edgeFetch(request, context(subject));
  }

  async function assertStatus(response: Response, status: number, label: string) {
    const body = await response.clone().text();
    assert.equal(response.status, status, `${label}: expected HTTP ${status}; response ${body}`);
  }

  async function requestOtp(subject: string): Promise<string> {
    capturedOtp = '';
    await assertStatus(await call('requestPinResetOtp', {}, subject), 200, 'request OTP');
    assert.ok(/^\d{6}$/.test(capturedOtp), 'request should send a six-digit code through the local Resend stub');
    assert.ok(emailRecipient === 'edge-a@example.invalid', 'reset email recipient should match authenticated user');
    assert.ok(emailExpiryCopy, 'reset email should describe OTP expiry');
    return capturedOtp;
  }

  try {
    const now = Date.now();
    runLocalSql(`DO $setup$
      BEGIN
        INSERT INTO public.users ("_id", "tokenIdentifier", "onboardingStep", "createdAt", "updatedAt") VALUES
          (${sqlString(userA)}, ${sqlString(`${issuer}|${subjectA}`)}, 'complete', ${now}, ${now}),
          (${sqlString(userB)}, ${sqlString(`${issuer}|${subjectB}`)}, 'complete', ${now}, ${now});
        INSERT INTO public."userWallets" ("_id", "userId", "balance", "currency", "walletPinHash", "pinSalt", "updatedAt") VALUES
          (${sqlString(walletA)}, ${sqlString(userA)}, 0, 'LC', NULL, NULL, ${now}),
          (${sqlString(walletB)}, ${sqlString(userB)}, 0, 'LC', 'untouched_wallet_b_hash', 'untouched_wallet_b_salt', ${now});
      END
    $setup$;`);

    assertStatus(await call('resetPinWithOtp', { otp: '123456', newPin: '2468' }), 404, 'missing resolved identity');
    assertStatus(await call('resetPinWithOtp', { otp: '123456', newPin: '2468' }, 'unmapped-subject'), 404, 'valid identity without a Lalao profile');

    let issuedOtp = await requestOtp(subjectA);
    const firstOtpHash = queryRows(`SELECT "pinResetOtpHash" AS result FROM public."userWallets" WHERE "userId" = ${sqlString(userA)};`)[0]?.result;
    await assertStatus(await call('requestPinResetOtp', {}, subjectA), 429, 'one-minute resend cooldown');
    assert.equal(emailSendCount, 1, 'rate-limited resend must not contact Resend');
    assert.ok(queryRows(`SELECT "pinResetOtpHash" AS result FROM public."userWallets" WHERE "userId" = ${sqlString(userA)};`)[0]?.result === firstOtpHash, 'rate-limited resend must preserve active code');

    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpLastRequestedAt" = ${Date.now() - 60001} WHERE "userId" = ${sqlString(userA)};`);
    const oldOtp = issuedOtp;
    issuedOtp = await requestOtp(subjectA);
    assert.ok(issuedOtp !== oldOtp, 'accepted resend must rotate OTP');
    assert.equal(emailSendCount, 2, 'accepted resend should send one email');
    const wrong = await call('resetPinWithOtp', { otp: oldOtp, newPin: '2468' }, subjectA);
    assertStatus(wrong, 401, 'incorrect OTP');
    let rows = queryRows(`SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) AS result FROM public.lalao_wallet_get_pin_credentials(${sqlString(userA)}) AS c;`);
    let credentials = (rows[0]?.result as Array<Record<string, unknown>>)[0];
    assert.equal(credentials.pinResetOtpFailCount, 1, 'incorrect OTP failure must persist in the database');
    assert.equal(credentials.pinFailCount, 0, 'incorrect OTP must not increment PIN failures');

    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpLastRequestedAt" = ${Date.now() - 60001} WHERE "userId" = ${sqlString(userA)};`);
    issuedOtp = await requestOtp(subjectA);
    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpExpiresAt" = ${Date.now() - 1} WHERE "userId" = ${sqlString(userA)};`);
    assertStatus(await call('resetPinWithOtp', { otp: issuedOtp, newPin: '2468' }, subjectA), 410, 'expired OTP');

    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpLastRequestedAt" = ${Date.now() - 60001} WHERE "userId" = ${sqlString(userA)};`);
    const goodOtp = await requestOtp(subjectA);
    const success = await call('resetPinWithOtp', { otp: goodOtp, newPin: '2468', userId: userB }, subjectA);
    assertStatus(success, 200, 'correct OTP reset');
    rows = queryRows(`SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) AS result FROM public.lalao_wallet_get_pin_credentials(${sqlString(userA)}) AS c;`);
    credentials = (rows[0]?.result as Array<Record<string, unknown>>)[0];
    assert.equal(credentials.walletPinHash === null, false, 'successful reset must install a PIN hash');
    assert.ok(credentials.pinResetOtpHash === null, 'successful reset consumes OTP hash');
    assert.equal(credentials.pinResetOtpUsedAt === null, false, 'successful reset records OTP consumption');
    assert.equal(credentials.pinResetOtpFailCount, 0, 'successful reset clears OTP failure count');
    assertStatus(await call('resetPinWithOtp', { otp: goodOtp, newPin: '1357' }, subjectA), 410, 'reused consumed OTP');

    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpLastRequestedAt" = ${Date.now() - 60001} WHERE "userId" = ${sqlString(userA)};`);
    const pinIndependenceOtp = await requestOtp(subjectA);
    const wrongPin = await call('verifyWalletPin', { pin: '1357' }, subjectA);
    assertStatus(wrongPin, 401, 'incorrect wallet PIN');
    rows = queryRows(`SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) AS result FROM public.lalao_wallet_get_pin_credentials(${sqlString(userA)}) AS c;`);
    credentials = (rows[0]?.result as Array<Record<string, unknown>>)[0];
    assert.equal(credentials.pinFailCount, 1, 'incorrect wallet PIN increments PIN counter');
    assert.equal(credentials.pinResetOtpFailCount, 0, 'incorrect wallet PIN leaves OTP counter independent');
    assertStatus(await call('verifyWalletPin', { pin: '2468' }, subjectA), 200, 'correct wallet PIN');

    await assertStatus(await call('requestPinResetOtp', {}, subjectA), 429, 'five-per-hour request quota');
    assert.equal(emailSendCount, 5, 'hourly quota must not deliver another message');
    assertStatus(await call('resetPinWithOtp', { otp: pinIndependenceOtp, newPin: '1357' }, subjectA), 200, 'OTP succeeds after independent PIN checks');

    const sendsBeforeMissingConfig = emailSendCount;
    resendApiKey = undefined;
    await assertStatus(await call('requestPinResetOtp', {}, subjectB), 503, 'missing Resend configuration');
    assert.equal(emailSendCount, sendsBeforeMissingConfig, 'missing email configuration must not send a message');
    resendApiKey = 'local-test-only';
    resendStatus = 503;
    await assertStatus(await call('requestPinResetOtp', {}, subjectB), 502, 'Resend provider failure');
    assert.ok(emailRecipient === 'edge-b@example.invalid', 'second reset email should use the second authenticated user recipient');
    resendStatus = 200;
    runLocalSql(`UPDATE public."userWallets" SET "pinResetOtpLastRequestedAt" = ${Date.now() - 60001} WHERE "userId" = ${sqlString(userB)};`);
    resendNetworkFailure = true;
    await assertStatus(await call('requestPinResetOtp', {}, subjectB), 502, 'Resend network exception');
    resendNetworkFailure = false;

    rows = queryRows(`SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) AS result FROM public.lalao_wallet_get_pin_credentials(${sqlString(userB)}) AS c;`);
    const credentialsB = (rows[0]?.result as Array<Record<string, unknown>>)[0];
    assert.ok(credentialsB.walletPinHash === 'untouched_wallet_b_hash', 'payload userId cannot redirect reset to another wallet');

    const directRpc = runLocalSql(`DO $auth$
      BEGIN
        PERFORM set_config('role', 'authenticated', true);
        BEGIN
          EXECUTE 'SELECT public.lalao_wallet_reset_pin_with_otp(''${userB}'', ''x'', ''x'', ''x'', 5, ''x'', ''x'')';
          RAISE EXCEPTION 'authenticated role unexpectedly invoked internal OTP RPC';
        EXCEPTION WHEN insufficient_privilege THEN
          NULL;
        END;
      END
    $auth$;`);
    assert.ok(directRpc, 'direct authenticated RPC attempt should be denied');
    assert.equal(queryRows(`SELECT to_jsonb(public.lalao_wallet_get_pin_credentials(${sqlString(userB)})) AS result;`).length, 1);

    console.log('PASS: local wallet handler/database integration with injected pre-resolved synthetic identity, OTP email payload/recipient, resend cooldown/hourly quota, old-code invalidation, expiry, consumption/replay, ownership, PIN independence, and RPC ACL checks');
  } finally {
    globalThis.fetch = previousFetch;
    try {
      runLocalSql(`DO $cleanup$
        BEGIN
          DELETE FROM public."userWallets" WHERE "userId" IN (${sqlString(userA)}, ${sqlString(userB)});
          DELETE FROM public.users WHERE "_id" IN (${sqlString(userA)}, ${sqlString(userB)});
        END
      $cleanup$;`);
    } finally {
      for (const file of temporarySqlFiles) rmSync(file, { force: true });
      rmSync(bundlePath, { force: true });
      rmSync(profileDir, { recursive: true, force: true });
      Reflect.deleteProperty(globalThis, 'Deno');
    }
  }
}

await main();
