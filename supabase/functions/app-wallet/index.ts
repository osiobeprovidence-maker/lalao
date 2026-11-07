import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';

const BATCH_SANDBOX_URL = 'https://sandbox-api.bachs.io';
const BATCH_LIVE_URL = 'https://api.bachs.io';
const runtimeEnv = (globalThis as typeof globalThis & { Deno: { env: { get(name: string): string | undefined } } }).Deno.env;

const WALLET_PIN_PEPPER = runtimeEnv.get('WALLET_PIN_PEPPER');
const PIN_PBKDF2_ITERATIONS = 100_000;
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function otpMaxAttempts(): number {
  const configured = Number(runtimeEnv.get('WALLET_PIN_RESET_OTP_MAX_ATTEMPTS') ?? 5);
  if (!Number.isSafeInteger(configured) || configured < 1 || configured > 20) {
    throw new Error('Wallet PIN reset OTP attempt limit must be an integer from 1 to 20.');
  }
  return configured;
}

function jsonError(error: string, status: number): Response { return Response.json({ error }, { status }); }

function batchConfig() {
  const environment = (runtimeEnv.get('BACHS_ENVIRONMENT') || 'sandbox').toLowerCase();
  const baseUrl = environment === 'live' || environment === 'production' ? BATCH_LIVE_URL : BATCH_SANDBOX_URL;
  const secretKey = runtimeEnv.get('BACHS_SECRET_KEY');
  if (!secretKey) throw new Error('Batch checkout is not configured. Please try again later.');
  if ((baseUrl === BATCH_LIVE_URL && !secretKey.startsWith('sk_live_'))
      || (baseUrl === BATCH_SANDBOX_URL && !secretKey.startsWith('sk_sandbox_'))) {
    throw new Error('Batch payment configuration does not match its environment.');
  }
  return { baseUrl, secretKey };
}

function safeBatchError(error: unknown): string {
  return error instanceof Error && error.message.startsWith('Batch ') ? error.message : 'Could not complete the Batch payment request. Please try again.';
}

/* ------------------------------------------------------------------ */
/* Secure PIN hashing (Web Crypto, available in the Supabase/Deno edge */
/* runtime). Argon2id was evaluated but is not part of the Web Crypto   */
/* API implemented by the Deno edge runtime, so PBKDF2-HMAC-SHA-256   */
/* with a server-side pepper is the deployed construction.              */
/* ------------------------------------------------------------------ */

function requirePepper(): string {
  if (!WALLET_PIN_PEPPER || WALLET_PIN_PEPPER.length < 16) {
    throw new Error('Wallet PIN encryption is not configured. Please contact support.');
  }
  return WALLET_PIN_PEPPER;
}

async function importPepperKey(pepper: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function pepperedPin(pepperKey: CryptoKey, pin: string): Promise<ArrayBuffer> {
  return crypto.subtle.sign('HMAC', pepperKey, new TextEncoder().encode(pin));
}

async function derivePinHash(peppered: ArrayBuffer, saltHex: string): Promise<string> {
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    peppered,
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PIN_PBKDF2_ITERATIONS },
    passwordKey,
    256,
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateOtp(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(value).padStart(6, '0');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hashPinWithSalt(pepperKey: CryptoKey, pin: string, saltHex: string): Promise<string> {
  return derivePinHash(await pepperedPin(pepperKey, pin), saltHex);
}

function validatePinFormat(pin: unknown): string {
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 numeric digits.');
  }
  return pin;
}

export default {
  fetch: withLalaoAuth(async (request, context) => {
    if (request.method !== 'POST') return jsonError('Method not allowed.', 405);
    let body: unknown;
    try { body = await request.json(); } catch { return jsonError('Invalid request.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid request.', 400);
    const input = body as { operation?: unknown; payload?: unknown };
    const supportedOperations = [
      'getWallet', 'getTransactions', 'initializeFunding', 'verifyFunding',
      'createWalletPin', 'changeWalletPin', 'verifyWalletPin',
      'requestPinResetOtp', 'resetPinWithOtp',
      'transferCredits', 'marketPurchase',
    ];
    if (!['getWallet', 'getTransactions'].includes(String(input.operation))
        && !supportedOperations.includes(String(input.operation))) {
      return jsonError('Unsupported wallet operation.', 400);
    }

    try {
      const admin = context.supabaseAdmin;
      const user = context.currentUser;
      if (!user || !('_id' in user) || typeof user._id !== 'string') return jsonError('Lalao profile not found.', 404);
      const userId = user._id;
      const payload = input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload)
        ? input.payload as Record<string, unknown> : {};

      const now = Date.now();

      /* -------------------------- getWallet -------------------------- */
      if (input.operation === 'getWallet') {
        const { data, error } = await admin.rpc('lalao_wallet_get_or_init', { p_user_id: userId });
        if (error) return jsonError('Could not load your wallet. Please try again.', 500);
        if (!data) return Response.json(null);
        const wallet = data as Record<string, unknown>;
        return Response.json({
          ...wallet,
          hasPin: Boolean(wallet.hasPin),
          pinRequiresSetup: Boolean(wallet.pinRequiresSetup),
          walletPin: undefined,
          walletPinHash: undefined,
          pinSalt: undefined,
          pinResetOtp: undefined,
          pinResetOtpHash: undefined,
          pinResetOtpSalt: undefined,
          pinResetOtpExpiresAt: undefined,
          pinResetOtpUsedAt: undefined,
        });
      }

      /* ----------------------- getTransactions ----------------------- */
      if (input.operation === 'getTransactions') {
        const { data, error } = await admin.from('walletTransactions').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(50);
        if (error) return jsonError('Could not load wallet transactions. Please try again.', 500);
        return Response.json(data ?? []);
      }

      /* ----------------------- createWalletPin ----------------------- */
      if (input.operation === 'createWalletPin') {
        const pin = validatePinFormat(payload.pin);
        const pepperKey = await importPepperKey(requirePepper());
        const salt = generateSaltHex();
        const pinHash = await hashPinWithSalt(pepperKey, pin, salt);
        const { data, error } = await admin.rpc('lalao_wallet_create_pin', {
          p_user_id: userId, p_pin_hash: pinHash, p_pin_salt: salt,
        });
        if (error) return jsonError(error.message?.includes('already configured') ? 'A wallet PIN is already configured.' : 'Could not create your wallet PIN. Please try again.', 400);
        return Response.json({ success: true, message: 'Wallet PIN created successfully.' });
      }

      /* ----------------------- changeWalletPin ----------------------- */
      if (input.operation === 'changeWalletPin') {
        const oldPin = validatePinFormat(payload.oldPin);
        const newPin = validatePinFormat(payload.newPin);
        if (oldPin === newPin) return jsonError('The new PIN must differ from the current PIN.', 400);

        const pepperKey = await importPepperKey(requirePepper());
        const { data: creds, error: credsError } = await admin.rpc('lalao_wallet_get_pin_credentials', { p_user_id: userId });
        if (credsError) return jsonError('Could not load wallet credentials. Please try again.', 500);
        const credential = (creds as Record<string, unknown>[])?.[0] ?? (creds as Record<string, unknown>);
        const storedHash = typeof credential.walletPinHash === 'string' ? credential.walletPinHash : '';
        const storedSalt = typeof credential.pinSalt === 'string' ? credential.pinSalt : '';
        if (!storedHash || !storedSalt) return jsonError('No wallet PIN is configured. Create a PIN first.', 400);

        const currentHash = await hashPinWithSalt(pepperKey, oldPin, storedSalt);
        if (!timingSafeEqual(currentHash, storedHash)) {
          await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: false });
          return jsonError('Incorrect current PIN.', 401);
        }

        const newSalt = generateSaltHex();
        const newHash = await hashPinWithSalt(pepperKey, newPin, newSalt);
        const { error } = await admin.rpc('lalao_wallet_change_pin', {
          p_user_id: userId, p_pin_hash: newHash, p_pin_salt: newSalt,
        });
        if (error) return jsonError('Could not update your wallet PIN. Please try again.', 400);
        await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: true });
        return Response.json({ success: true, message: 'Wallet PIN updated successfully.' });
      }

      /* ----------------------- verifyWalletPin ----------------------- */
      if (input.operation === 'verifyWalletPin') {
        const pin = validatePinFormat(payload.pin);
        const pepperKey = await importPepperKey(requirePepper());
        const { data: creds, error: credsError } = await admin.rpc('lalao_wallet_get_pin_credentials', { p_user_id: userId });
        if (credsError) return jsonError('Could not load wallet credentials. Please try again.', 500);
        const credential = (creds as Record<string, unknown>[])?.[0] ?? (creds as Record<string, unknown>);
        const storedHash = typeof credential.walletPinHash === 'string' ? credential.walletPinHash : '';
        const storedSalt = typeof credential.pinSalt === 'string' ? credential.pinSalt : '';
        const failCount = typeof credential.pinFailCount === 'number' ? credential.pinFailCount : 0;
        const lockedUntil = typeof credential.pinLockedUntil === 'number' ? credential.pinLockedUntil : 0;

        if (!storedHash || !storedSalt) return jsonError('No wallet PIN is configured.', 400);
        if (lockedUntil && now < lockedUntil) {
          return jsonError(`Your wallet is temporarily locked. Try again after ${new Date(lockedUntil).toLocaleTimeString()}.`, 423);
        }

        const currentHash = await hashPinWithSalt(pepperKey, pin, storedSalt);
        if (timingSafeEqual(currentHash, storedHash)) {
          await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: true });
          return Response.json({ success: true, verified: true });
        }

        const result = await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: false });
        const resultData = result.data as Record<string, unknown> | undefined;
        if (resultData?.locked) {
          return jsonError(`Incorrect PIN. Your wallet is temporarily locked until ${new Date(resultData.lockedUntil as number).toLocaleTimeString()}.`, 423);
        }
        return jsonError('Incorrect wallet security PIN.', 401);
      }

      /* -------------------- requestPinResetOtp -------------------- */
      if (input.operation === 'requestPinResetOtp') {
        const resendKey = runtimeEnv.get('RESEND_API_KEY');
        if (!resendKey) return jsonError('Reset code email delivery is not configured. Please try again later.', 503);

        const pepperKey = await importPepperKey(requirePepper());
        const otp = generateOtp();
        const salt = generateSaltHex();
        const otpHash = await hashPinWithSalt(pepperKey, otp, salt);
        const expiresAt = now + OTP_EXPIRY_MS;

        const { data, error } = await admin.rpc('lalao_wallet_request_pin_reset_otp', {
          p_user_id: userId, p_otp_hash: otpHash, p_otp_salt: salt, p_expires_at: expiresAt,
        });
        if (error) return jsonError('Could not prepare your reset code. Please try again.', 400);
        const requestResult = data as Record<string, unknown> | null;
        if (requestResult?.code === 'otp_rate_limited') {
          return jsonError('A reset code was sent recently. Please wait before requesting another.', 429);
        }
        if (!requestResult?.success) return jsonError('Could not prepare your reset code. Please try again.', 400);

        const email = (typeof user.email === 'string' && user.email) || `${user.username || 'user'}@lalao.app`;
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: runtimeEnv.get('RESEND_FROM_EMAIL') || 'Lalao <onboarding@resend.dev>',
              to: [email],
              subject: 'Your Lalao transaction PIN reset code',
              html: `<p>Your Lalao transaction PIN reset code is <strong>${otp}</strong>.</p>
                     <p>It expires in 10 minutes. If you did not request this, please contact support.</p>`,
            }),
          });
          if (!emailResponse.ok) return jsonError('Could not deliver your reset code. Please try again later.', 502);
        } catch {
          return jsonError('Could not deliver your reset code. Please try again later.', 502);
        }

        return Response.json({
          success: true,
          email: email.replace(/(.{2})(.*)(?=@)/, (_gp: string, a: string, b: string) => a + '*'.repeat(b.length)),
        });
      }

      /* -------------------- resetPinWithOtp --------------------- */
      if (input.operation === 'resetPinWithOtp') {
        const maxOtpAttempts = otpMaxAttempts();
        const otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';
        const newPin = validatePinFormat(payload.newPin);
        if (!/^\d{6}$/.test(otp)) return jsonError('Invalid verification code.', 400);

        const pepperKey = await importPepperKey(requirePepper());
        const { data: creds, error: credsError } = await admin.rpc('lalao_wallet_get_pin_credentials', { p_user_id: userId });
        if (credsError) return jsonError('Could not load wallet credentials. Please try again.', 500);
        const credential = (creds as Record<string, unknown>[])?.[0] ?? (creds as Record<string, unknown>);
        const storedOtpHash = typeof credential.pinResetOtpHash === 'string' ? credential.pinResetOtpHash : '';
        const storedOtpSalt = typeof credential.pinResetOtpSalt === 'string' ? credential.pinResetOtpSalt : '';
        if (!storedOtpHash || !storedOtpSalt) return jsonError('Verification code has expired. Please request a new code.', 410);
        const candidateOtpHash = await hashPinWithSalt(pepperKey, otp, storedOtpSalt);

        const newSalt = generateSaltHex();
        const newPinHash = await hashPinWithSalt(pepperKey, newPin, newSalt);
        const { data, error } = await admin.rpc('lalao_wallet_reset_pin_with_otp', {
          p_user_id: userId, p_candidate_otp_hash: candidateOtpHash,
          p_expected_otp_hash: storedOtpHash, p_expected_otp_salt: storedOtpSalt,
          p_max_attempts: maxOtpAttempts,
          p_pin_hash: newPinHash, p_pin_salt: newSalt,
        });
        if (error) {
          if (error.code === 'P0410') return jsonError(error.message, 410);
          return jsonError('Could not reset your PIN. Please try again.', 400);
        }
        const resetResult = data as Record<string, unknown> | null;
        if (!resetResult?.success) {
          if (resetResult?.code === 'otp_locked') return jsonError('Too many invalid attempts. Please request a new code.', 423);
          if (resetResult?.code === 'otp_invalidated') return jsonError('Verification code has expired or has already been used. Request a new code.', 410);
          return jsonError('Invalid verification code. Please check your email and try again.', 401);
        }
        return Response.json({ success: true, message: 'Your transaction PIN has been successfully reset!' });
      }

      /* ---------------------- transferCredits ---------------------- */
      if (input.operation === 'transferCredits') {
        const amount = Number(payload.amount);
        const recipientPageId = typeof payload.recipientPageId === 'string' ? payload.recipientPageId : '';
        const pin = validatePinFormat(payload.pin);
        if (!Number.isSafeInteger(amount) || amount <= 0 || !recipientPageId) {
          return jsonError('Enter a valid amount and recipient business.', 400);
        }

        // Verify PIN before any money movement.
        const pepperKey = await importPepperKey(requirePepper());
        const { data: creds, error: credsError } = await admin.rpc('lalao_wallet_get_pin_credentials', { p_user_id: userId });
        if (credsError) return jsonError('Could not load wallet credentials. Please try again.', 500);
        const credential = (creds as Record<string, unknown>[])?.[0] ?? (creds as Record<string, unknown>);
        const storedHash = typeof credential.walletPinHash === 'string' ? credential.walletPinHash : '';
        const storedSalt = typeof credential.pinSalt === 'string' ? credential.pinSalt : '';
        if (!storedHash || !storedSalt) return jsonError('No wallet PIN is configured. Set a PIN first.', 400);
        if (typeof credential.pinLockedUntil === 'number' && credential.pinLockedUntil && now < credential.pinLockedUntil) {
          return jsonError('Your wallet is temporarily locked. Try again later.', 423);
        }
        if (!timingSafeEqual(await hashPinWithSalt(pepperKey, pin, storedSalt), storedHash)) {
          await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: false });
          return jsonError('Incorrect wallet security PIN.', 401);
        }
        await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: true });

        const { data, error } = await admin.rpc('lalao_wallet_transfer_credits', {
          p_user_id: userId, p_recipient_page_id: recipientPageId, p_amount: amount,
        });
        if (error) {
          if (error.message === 'Insufficient balance') return jsonError('Insufficient balance.', 400);
          return jsonError(error.message || 'Transfer could not be completed. Please try again.', 400);
        }
        return Response.json(data);
      }

      /* --------------------- marketPurchase ---------------------- */
      if (input.operation === 'marketPurchase') {
        const serviceCategory = typeof payload.serviceCategory === 'string' ? payload.serviceCategory : '';
        const provider = typeof payload.provider === 'string' ? payload.provider : '';
        const customerIdentifier = typeof payload.customerIdentifier === 'string' ? payload.customerIdentifier : '';
        const product = typeof payload.product === 'string' ? payload.product : undefined;
        const variationId = typeof payload.variationId === 'string' ? payload.variationId : undefined;
        const amount = Number(payload.amount);
        const fee = Number(payload.fee || 0);
        const pin = validatePinFormat(payload.pin);
        const network = typeof payload.network === 'string' ? payload.network : undefined;
        const meterType = typeof payload.meterType === 'string' ? payload.meterType : undefined;
        if (!serviceCategory || !provider || !customerIdentifier || !Number.isSafeInteger(amount) || amount <= 0) {
          return jsonError('Enter a valid service, recipient, and amount.', 400);
        }

        const pepperKey = await importPepperKey(requirePepper());
        const { data: creds, error: credsError } = await admin.rpc('lalao_wallet_get_pin_credentials', { p_user_id: userId });
        if (credsError) return jsonError('Could not load wallet credentials. Please try again.', 500);
        const credential = (creds as Record<string, unknown>[])?.[0] ?? (creds as Record<string, unknown>);
        const storedHash = typeof credential.walletPinHash === 'string' ? credential.walletPinHash : '';
        const storedSalt = typeof credential.pinSalt === 'string' ? credential.pinSalt : '';
        if (!storedHash || !storedSalt) return jsonError('No wallet PIN is configured. Set a PIN first.', 400);
        if (typeof credential.pinLockedUntil === 'number' && credential.pinLockedUntil && now < credential.pinLockedUntil) {
          return jsonError('Your wallet is temporarily locked. Try again later.', 423);
        }
        if (!timingSafeEqual(await hashPinWithSalt(pepperKey, pin, storedSalt), storedHash)) {
          await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: false });
          return jsonError('Incorrect wallet security PIN.', 401);
        }
        await admin.rpc('lalao_wallet_record_pin_attempt', { p_user_id: userId, p_success: true });

        const requestId = `req_${Date.now()}_${crypto.randomUUID().replaceAll('-', '').substring(2, 9)}`;

        const { data: initiated, error: initError } = await admin.rpc('lalao_wallet_initiate_market_purchase', {
          p_user_id: userId, p_service_category: serviceCategory, p_provider: provider,
          p_customer_identifier: customerIdentifier, p_product: product ?? null,
          p_variation_id: variationId ?? null, p_amount: amount, p_fee: fee, p_request_id: requestId,
        });
        if (initError) {
          if (initError.message === 'Duplicate request') return jsonError('Duplicate request.', 409);
          if (initError.message === 'Insufficient wallet balance.') return jsonError('Insufficient wallet balance.', 400);
          return jsonError('Could not start your purchase. Please try again.', 400);
        }
        const marketTxId = (initiated as Record<string, unknown>).marketTxId as string;
        const walletTxId = (initiated as Record<string, unknown>).walletTxId as string;

        const totalAmount = amount + fee;

        // Mock provider for local/staging testing without live charges.
        const mockProvider = process.env.MARKET_PROVIDER === 'mock'
          || (!runtimeEnv.get('CLUBKONNECT_USER_ID') && !runtimeEnv.get('VTU_USERNAME'));
        if (mockProvider) {
          if (customerIdentifier.endsWith('999')) {
            await admin.rpc('lalao_wallet_fail_market_purchase', {
              p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId,
              p_error_message: 'Provider rejected transaction.',
            });
            return Response.json({ success: false, status: 'FAILED', message: 'Provider rejected transaction.' });
          }
          await admin.rpc('lalao_wallet_complete_market_purchase', {
            p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId,
            p_provider_order_id: `mock_${Date.now()}`,
            p_provider_amount: amount, p_provider_discount: 0,
            p_token: serviceCategory === 'electricity' ? '1234-5678-9012-3456-7890' : undefined,
            p_units: serviceCategory === 'electricity' ? '28.5 kWh' : undefined,
          });
          return Response.json({ success: true, status: 'COMPLETED', message: 'Transaction successful',
            token: serviceCategory === 'electricity' ? '1234-5678-9012-3456-7890' : undefined });
        }

        // Live ClubKonnect purchase request.
        const clubkonnectUserId = runtimeEnv.get('CLUBKONNECT_USER_ID');
        const clubkonnectApiKey = runtimeEnv.get('CLUBKONNECT_API_KEY');
        if (!clubkonnectUserId || !clubkonnectApiKey) {
          await admin.rpc('lalao_wallet_fail_market_purchase', {
            p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId,
            p_error_message: 'ClubKonnect provider is not configured.',
          });
          return Response.json({ success: false, status: 'PROCESSING',
            message: 'Transaction is taking longer than expected. We will notify you once completed.' }, { status: 503 });
        }

        const networkCode = (() => {
          const n = (network || provider || '').toUpperCase();
          if (n.includes('MTN')) return '01';
          if (n.includes('GLO')) return '02';
          if (n.includes('9MOBILE') || n.includes('ETISALAT')) return '03';
          if (n.includes('AIRTEL')) return '04';
          return '01';
        })();

        let apiUrl = '';
        if (serviceCategory === 'airtime') {
          apiUrl = `https://www.nellobytesystems.com/APIAirtimeV1.asp?UserID=${encodeURIComponent(clubkonnectUserId)}&APIKey=${encodeURIComponent(clubkonnectApiKey)}&MobileNetwork=${networkCode}&Amount=${amount}&MobileNumber=${encodeURIComponent(customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (serviceCategory === 'data') {
          apiUrl = `https://www.nellobytesystems.com/APIDatabundleV1.asp?UserID=${encodeURIComponent(clubkonnectUserId)}&APIKey=${encodeURIComponent(clubkonnectApiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(variationId || '1000')}&MobileNumber=${encodeURIComponent(customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (serviceCategory === 'electricity') {
          const discoCode = (() => {
            const d = (provider || '').toUpperCase();
            if (d.includes('KADUNA') || d.includes('KAEDCO') || d === '07') return '07';
            if (d.includes('ABUJA') || d.includes('AEDC') || d === '03') return '03';
            if (d.includes('EKO') || d.includes('EKEDC') || d === '01') return '01';
            if (d.includes('IKEJA') || d.includes('IKEDC') || d === '02') return '02';
            if (d.includes('KANO') || d.includes('KEDCO') || d === '04') return '04';
            if (d.includes('PORT') || d.includes('PHED') || d === '05') return '05';
            if (d.includes('JOS') || d.includes('JED') || d === '06') return '06';
            if (d.includes('ENUGU') || d.includes('EEDC') || d === '08') return '08';
            if (d.includes('BENIN') || d.includes('BEDC') || d === '09') return '09';
            return '01';
          })();
          apiUrl = `https://www.nellobytesystems.com/APIElectricityV1.asp?UserID=${encodeURIComponent(clubkonnectUserId)}&APIKey=${encodeURIComponent(clubkonnectApiKey)}&ElectricCompany=${discoCode}&MeterType=${encodeURIComponent(meterType || 'Prepaid')}&MeterNo=${encodeURIComponent(customerIdentifier)}&Amount=${amount}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (serviceCategory === 'cable') {
          const cableCode = (() => {
            const c = (provider || '').toLowerCase();
            if (c.includes('dstv')) return 'dstv';
            if (c.includes('gotv')) return 'gotv';
            if (c.includes('startimes')) return 'startimes';
            return 'dstv';
          })();
          apiUrl = `https://www.nellobytesystems.com/APICableTVV1.asp?UserID=${encodeURIComponent(clubkonnectUserId)}&APIKey=${encodeURIComponent(clubkonnectApiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(variationId || 'dstv-padi')}&SmartCardNo=${encodeURIComponent(customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else {
          await admin.rpc('lalao_wallet_fail_market_purchase', {
            p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId,
            p_error_message: `Unsupported service category: ${serviceCategory}`,
          });
          return Response.json({ success: false, status: 'FAILED', message: `Unsupported service category: ${serviceCategory}` }, { status: 400 });
        }

        try {
          const ckRaw = await fetch(apiUrl);
          const ckResponse = await ckRaw.json().catch(() => null);
          const statusCode = ckResponse?.statuscode?.toString();
          const statusText = (ckResponse?.status || '').toUpperCase();
          const isSuccess = statusCode === '100' || statusCode === '200'
            || statusText.includes('ORDER_RECEIVED') || statusText.includes('ORDER_COMPLETED');

          if (isSuccess) {
            const token = ckResponse?.pin || ckResponse?.epin || ckResponse?.metertoken || ckResponse?.token;
            const units = ckResponse?.units;
            await admin.rpc('lalao_wallet_complete_market_purchase', {
              p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId,
              p_provider_order_id: ckResponse?.orderid?.toString() || `ck_${Date.now()}`,
              p_provider_amount: ckResponse?.amountcharged ? parseFloat(ckResponse.amountcharged) : amount,
              p_provider_discount: ckResponse?.discount ? parseFloat(ckResponse.discount) : 0,
              p_token: token ?? null, p_units: units ?? null,
            });
            return Response.json({ success: true, status: 'COMPLETED', message: 'Transaction successful', token, units,
              orderId: ckResponse?.orderid?.toString() });
          } else {
            const errMsg = ckResponse?.msg || ckResponse?.remark || ckResponse?.status || 'Provider transaction failed';
            await admin.rpc('lalao_wallet_fail_market_purchase', {
              p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId, p_error_message: errMsg,
            });
            return Response.json({ success: false, status: 'FAILED', message: errMsg });
          }
        } catch (e: any) {
          await admin.rpc('lalao_wallet_fail_market_purchase', {
            p_market_tx_id: marketTxId, p_wallet_tx_id: walletTxId, p_error_message: e.message || 'Provider error.',
          });
          return Response.json({ success: false, status: 'PROCESSING',
            message: 'Transaction is taking longer than expected. We will notify you once completed.' });
        }
      }

      /* ---------------- initializeFunding (existing) ---------------- */
      if (input.operation === 'initializeFunding') {
        const amount = payload.amount;
        const reference = payload.reference;
        if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 100 || amount > 500000
            || typeof reference !== 'string' || !/^BACHS_FUND_[A-Za-z0-9_-]{8,100}$/.test(reference)) {
          return jsonError('Enter a valid funding amount and payment reference.', 400);
        }
        const reserved = await admin.rpc('create_lalao_wallet_funding', { p_user_id: userId, p_amount: amount, p_reference: reference });
        if (reserved.error) return jsonError(reserved.error.code === '22023' ? 'Invalid wallet funding request.' : 'Could not prepare wallet funding. Please try again.', 400);
        const { baseUrl, secretKey } = batchConfig();
        const appUrl = (runtimeEnv.get('APP_URL') || runtimeEnv.get('VITE_APP_URL') || 'https://www.lalao.website').replace(/\/+$/, '');
        const response = await fetch(`${baseUrl}/v1/checkout-sessions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            customer: { email: typeof user.email === 'string' && user.email ? user.email : `${user.username || 'user'}@lalao.app`, name: user.name || 'Lalao User' },
            pricing: { currency: 'NGN', amount: String(amount) },
            reference,
            metadata: { userId, reference, type: 'wallet_funding' },
            success_url: `${appUrl}/app?tab=wallet&funding_pending=true&ref=${encodeURIComponent(reference)}`,
            cancel_url: `${appUrl}/app?tab=wallet&funding_cancelled=true&ref=${encodeURIComponent(reference)}`,
          }),
        });
        let result: Record<string, unknown> = {};
        try { result = await response.json(); } catch { /* use generic failure */ }
        const checkoutUrl = result.checkout_url || result.url;
        if (!response.ok || typeof result.checkout_id !== 'string' || typeof checkoutUrl !== 'string') {
          return jsonError('Batch could not start checkout. Please try again.', 502);
        }
        return Response.json({ success: true, sessionId: result.checkout_id, checkoutUrl, reference });
      }

      /* ----------------- verifyFunding (existing) ------------------ */
      const reference = payload.reference;
      const sessionId = payload.sessionId;
      if (typeof reference !== 'string' || !/^BACHS_FUND_[A-Za-z0-9_-]{8,100}$/.test(reference) || typeof sessionId !== 'string' || !sessionId) {
        return jsonError('The Batch checkout reference is invalid.', 400);
      }
      const { baseUrl, secretKey } = batchConfig();
      const sessionResponse = await fetch(`${baseUrl}/v1/checkout-sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      });
      if (!sessionResponse.ok) return jsonError('Could not retrieve the Batch checkout session.', 502);
      let payment: Record<string, unknown>;
      try { payment = await sessionResponse.json(); } catch { return jsonError('Batch returned an invalid checkout response.', 502); }
      if (payment.checkout_id !== sessionId || payment.reference !== reference) return jsonError('Batch checkout does not match this wallet funding request.', 400);
      const status = String(payment.status || '').toLowerCase();
      const paymentStatus = String(payment.payment_status || (payment.charge as Record<string, unknown> | undefined)?.status || '').toLowerCase();
      if (status !== 'completed' || paymentStatus !== 'succeeded') {
        return Response.json({ success: false, status, message: `Payment status is ${status || 'pending'}. Wallet can only be credited once payment is confirmed.` });
      }
      if (String(payment.currency || '').toUpperCase() !== 'NGN') return jsonError('Batch returned an invalid payment currency.', 400);
      const verifiedAmount = Number(payment.amount);
      if (!Number.isSafeInteger(verifiedAmount) || verifiedAmount <= 0) return jsonError('Batch returned an invalid payment amount.', 400);
      const charge = payment.charge as Record<string, unknown> | undefined;
      const transactionId = typeof charge?.payment_id === 'string' ? charge.payment_id : sessionId;
      const settled = await admin.rpc('settle_lalao_wallet_funding', {
        p_user_id: userId, p_reference: reference, p_amount: verifiedAmount, p_provider_transaction_id: transactionId,
      });
      if (settled.error) {
        if (settled.error.code === '22023') return jsonError('The verified Batch payment does not match this funding request.', 409);
        return jsonError('Could not settle this verified payment. Please contact support if you were charged.', 500);
      }
      return Response.json(settled.data);
    } catch (error) {
      const message = safeBatchError(error);
      const status = message.startsWith('Batch checkout is not configured') || message.startsWith('Batch payment configuration') ? 503 : 500;
      return jsonError(message, status);
    }
  }),
};
