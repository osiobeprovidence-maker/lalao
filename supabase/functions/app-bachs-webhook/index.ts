import { withSupabase } from 'npm:@supabase/server@1';
import { verifyBachsWebhookSignature } from '../_shared/bachsWebhookSignature.ts';

const BATCH_SANDBOX_URL = 'https://sandbox-api.bachs.io';
const BATCH_LIVE_URL = 'https://api.bachs.io';
const runtimeEnv = (globalThis as typeof globalThis & { Deno: { env: { get(name: string): string | undefined } } }).Deno.env;

function textResponse(message: string, status: number): Response {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function getBatchConfig() {
  const environment = (runtimeEnv.get('BACHS_ENVIRONMENT') || 'sandbox').toLowerCase();
  const baseUrl = environment === 'live' || environment === 'production' ? BATCH_LIVE_URL : BATCH_SANDBOX_URL;
  const secretKey = runtimeEnv.get('BACHS_SECRET_KEY');
  if (!secretKey) throw new Error('Batch payment secret is missing.');
  if ((baseUrl === BATCH_LIVE_URL && !secretKey.startsWith('sk_live_'))
      || (baseUrl === BATCH_SANDBOX_URL && !secretKey.startsWith('sk_sandbox_'))) throw new Error('Batch payment environment mismatch.');
  return { baseUrl, secretKey };
}

function serviceHeaders(serviceKey: string, extra: Record<string, string> = {}): HeadersInit {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json', ...extra };
}

async function serviceRequest<T>(baseUrl: string, serviceKey: string, path: string, init: RequestInit = {}): Promise<{ data: T | null; response: Response }> {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { ...init, headers: serviceHeaders(serviceKey, init.headers as Record<string, string> | undefined) });
  if (!response.ok) return { data: null, response };
  if (response.status === 204) return { data: null, response };
  return { data: await response.json() as T, response };
}

async function markEventProcessed(baseUrl: string, serviceKey: string, eventId: string, eventType: string): Promise<boolean> {
  const query = new URLSearchParams({ select: 'eventId', eventId: `eq.${eventId}`, limit: '1' });
  const prior = await serviceRequest<Array<{ eventId: string }>>(baseUrl, serviceKey, `bachsWebhookEvents?${query}`);
  if (!prior.response.ok) throw new Error('Could not read webhook event state.');
  if (prior.data?.length) return false;
  const inserted = await serviceRequest<unknown>(baseUrl, serviceKey, 'bachsWebhookEvents?on_conflict=eventId', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ _id: `batch_event_${crypto.randomUUID().replaceAll('-', '')}`, eventId, eventType, processedAt: Date.now() }),
  });
  if (!inserted.response.ok) throw new Error('Could not record webhook event state.');
  return inserted.response.status !== 204;
}

async function forwardExistingPayments(request: Request, rawBody: string): Promise<Response> {
  const siteUrl = runtimeEnv.get('CONVEX_SITE_URL');
  if (!siteUrl) return textResponse('Existing payment webhook forwarding is not configured', 503);
  let target: URL;
  try { target = new URL(siteUrl); } catch { return textResponse('Existing payment webhook forwarding is invalid', 503); }
  if (target.protocol !== 'https:' || !target.hostname.endsWith('.convex.site')) return textResponse('Existing payment webhook forwarding is invalid', 503);
  target.pathname = '/api/webhooks/bachs';
  target.search = '';
  const headers = new Headers({ 'content-type': 'application/json' });
  for (const name of ['x-bachs-signature-v2', 'x-bachs-signature', 'x-bachs-timestamp']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return await fetch(target, { method: 'POST', headers, body: rawBody });
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (request) => {
    if (request.method !== 'POST') return textResponse('Method not allowed', 405);
    const rawBody = await request.text();
    const webhookSecret = runtimeEnv.get('BACHS_WEBHOOK_SECRET');
    if (!webhookSecret) return textResponse('Webhook is not configured', 503);
    try {
      if (!await verifyBachsWebhookSignature({
        rawBody,
        secret: webhookSecret,
        signatureV2: request.headers.get('x-bachs-signature-v2'),
        legacySignature: request.headers.get('x-bachs-signature'),
        legacyTimestamp: request.headers.get('x-bachs-timestamp'),
      })) return textResponse('Invalid or expired signature', 400);
    } catch {
      return textResponse('Signature verification failed', 500);
    }

    let envelope: { id?: unknown; type?: unknown; data?: { checkout_id?: unknown } };
    try { envelope = JSON.parse(rawBody); } catch { return textResponse('Invalid JSON payload', 400); }
    if (typeof envelope.id !== 'string' || !envelope.id || typeof envelope.type !== 'string') return textResponse('Invalid event envelope', 400);
    const eventType = envelope.type;
    const checkoutId = envelope.data?.checkout_id;
    if (eventType !== 'checkout.completed' && eventType !== 'collection.succeeded') {
      try {
        const serviceUrl = runtimeEnv.get('SUPABASE_URL');
        const serviceKey = runtimeEnv.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!serviceUrl || !serviceKey) return textResponse('Webhook storage is not configured', 503);
        const inserted = await markEventProcessed(serviceUrl, serviceKey, envelope.id, eventType);
        return textResponse(inserted ? 'Event ignored' : 'Duplicate event', 200);
      } catch { return textResponse('Webhook event processing failed', 500); }
    }
    if (typeof checkoutId !== 'string' || !checkoutId) return textResponse('Missing checkout_id', 400);

    try {
      const { baseUrl: batchUrl, secretKey } = getBatchConfig();
      const batchResponse = await fetch(`${batchUrl}/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`, {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      });
      if (!batchResponse.ok) return textResponse('Checkout verification failed', 502);
      const payment = await batchResponse.json() as Record<string, unknown>;
      if (payment.checkout_id !== checkoutId || String(payment.status || '').toLowerCase() !== 'completed'
          || String(payment.payment_status || (payment.charge as Record<string, unknown> | undefined)?.status || '').toLowerCase() !== 'succeeded') {
        return textResponse('Checkout is not confirmed yet', 503);
      }
      const reference = payment.reference;
      if (typeof reference !== 'string' || !reference) return textResponse('Invalid verified checkout', 400);
      if (!reference.startsWith('BACHS_FUND_')) return await forwardExistingPayments(request, rawBody);

      const serviceUrl = runtimeEnv.get('SUPABASE_URL');
      const serviceKey = runtimeEnv.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceUrl || !serviceKey) return textResponse('Wallet settlement is not configured', 503);
      const referenceQuery = new URLSearchParams({ select: 'userId,amount,paymentProvider,status', reference: `eq.${reference}`, limit: '1' });
      const paymentResult = await serviceRequest<Array<{ userId: string; amount: number; paymentProvider: string; status: string }>>(
        serviceUrl, serviceKey, `walletTransactions?${referenceQuery}`,
      );
      const reserved = paymentResult.data?.[0];
      if (!paymentResult.response.ok || !reserved || reserved.paymentProvider !== 'bachs') return textResponse('Wallet funding record is not ready', 500);
      if (String(payment.currency || '').toUpperCase() !== 'NGN') return textResponse('Currency mismatch', 200);
      const amount = Number(payment.amount);
      if (!Number.isSafeInteger(amount) || amount !== reserved.amount) return textResponse('Amount mismatch', 400);
      const userQuery = new URLSearchParams({ select: 'email,username', _id: `eq.${reserved.userId}`, limit: '1' });
      const userResult = await serviceRequest<Array<{ email: string | null; username: string | null }>>(serviceUrl, serviceKey, `users?${userQuery}`);
      const owner = userResult.data?.[0];
      const email = String(payment.customer && (payment.customer as Record<string, unknown>).email
        || payment.customer_details && (payment.customer_details as Record<string, unknown>).email || '').trim().toLowerCase();
      const expectedEmail = (owner?.email || `${owner?.username || 'user'}@lalao.app`).toLowerCase();
      if (!userResult.response.ok || !owner || String((payment.metadata as Record<string, unknown> | undefined)?.userId || '') !== reserved.userId || email !== expectedEmail) {
        return textResponse('Checkout customer does not match the payment owner', 400);
      }
      const charge = payment.charge as Record<string, unknown> | undefined;
      const transactionId = typeof charge?.payment_id === 'string' ? charge.payment_id : checkoutId;
      const settlementResponse = await fetch(`${serviceUrl}/rest/v1/rpc/settle_lalao_wallet_funding`, {
        method: 'POST',
        headers: serviceHeaders(serviceKey),
        body: JSON.stringify({ p_user_id: reserved.userId, p_reference: reference, p_amount: amount, p_provider_transaction_id: transactionId }),
      });
      if (!settlementResponse.ok) return textResponse('Wallet settlement failed; Batch may retry.', 500);
      const marked = await markEventProcessed(serviceUrl, serviceKey, envelope.id, eventType);
      return textResponse(marked ? 'Wallet funding settled' : 'Duplicate event', 200);
    } catch {
      return textResponse('Temporary payment processing failure', 500);
    }
  }),
};
