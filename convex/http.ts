import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { verifyBachsWebhookSignature } from "./lib/bachsWebhookSignature";

const http = httpRouter();

http.route({
  path: "/api/webhooks/vtu",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Read raw body
    const payloadString = await request.text();
    const signature = request.headers.get("x-vtu-signature") || request.headers.get("X-VTU-Signature");

    // 2. Verify signature
    // In production, VTU.ng sends a signature via headers, often HMAC-SHA256 of payload using VTU_USER_PIN.
    // Ensure you have VTU_USER_PIN in your convex env variables.
    /*
    const crypto = require('crypto');
    const expectedSig = crypto.createHmac('sha256', process.env.VTU_USER_PIN || '').update(payloadString).digest('hex');
    if (signature !== expectedSig) return new Response("Unauthorized", { status: 401 });
    */
    
    // Uncomment the above code block when your VTU_USER_PIN is set and you want to enforce webhook signature validation.

    let data;
    try {
      data = JSON.parse(payloadString);
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // 3. Process webhook idempotently using internal mutation
    // Payload depends on VTU.ng, usually { request_id: "...", status: "completed-api", ... }
    const requestId = data.request_id;
    const providerOrderId = data.order_id;
    const status = data.status; // 'completed-api', 'refunded', 'failed'

    if (!requestId) {
      return new Response("Missing request_id", { status: 400 });
    }

    try {
      await ctx.runMutation(internal.market.processWebhook, {
        requestId,
        providerOrderId,
        status,
        rawPayload: payloadString
      });
      return new Response("Webhook processed", { status: 200 });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      // We return 200 even on some logic failures to prevent retries if it's not a temporary error
      return new Response(error.message, { status: 200 });
    }
  }),
});

http.route({
  path: "/api/webhooks/paystack",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    
    // 1. Verify signature
    /*
    const crypto = require('crypto');
    const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    const expectedSig = crypto.createHmac('sha512', secretKey).update(payloadString).digest('hex');
    if (signature !== expectedSig) return new Response("Unauthorized", { status: 401 });
    */
    // Uncomment the above to enforce Paystack signature validation

    let data;
    try {
      data = JSON.parse(payloadString);
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (data.event === "charge.success") {
      const reference = data.data.reference;
      const amountKobo = data.data.amount;
      const amountNgn = amountKobo / 100;
      const transactionId = data.data.id?.toString();

      if (data.data.currency !== "NGN") {
        return new Response("Ignored non-NGN currency", { status: 200 });
      }

      // Check if reference belongs to Lalao Ads
      if (typeof reference === "string" && reference.startsWith("LALAO_AD_")) {
        try {
          await ctx.runMutation(internal.adActions.settleAdPayment, {
            reference,
            paystackAmountKobo: amountKobo,
            paystackTransactionId: transactionId,
            gatewayResponse: data.data.gateway_response || "Webhook verified",
          });
          return new Response("Ad Payment Success", { status: 200 });
        } catch (error: any) {
          console.error("Paystack Ad webhook error:", error);
          return new Response("Processed with error: " + error.message, { status: 200 });
        }
      }

      try {
        await ctx.runMutation(internal.wallet.settleWalletFunding, {
          reference,
          paystackAmount: amountNgn,
          paystackTransactionId: transactionId
        });
        return new Response("Success", { status: 200 });
      } catch (error: any) {
        console.error("Paystack webhook processing error:", error);
        // If it's already settled, we just return 200 to prevent retries
        return new Response("Processed with error: " + error.message, { status: 200 });
      }
    }

    return new Response("Unhandled event", { status: 200 });
  })
});

/**
 * BACHS Webhook Endpoint
 * Validates HMAC-SHA256 signature and timestamp drift (<300s).
 * Idempotently settles wallet funding on successful payment.
 */
http.route({
  path: "/api/webhooks/bachs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const webhookSecret = process.env.BACHS_WEBHOOK_SECRET;
    if (!webhookSecret) return new Response("Webhook is not configured", { status: 503 });

    // Bachs V2 signs `${timestamp}.${rawBody}` and may include multiple v1 values
    // during secret rotation. Fall back to the legacy headers only for compatibility.
    try {
      const valid = await verifyBachsWebhookSignature({
        rawBody: payloadString,
        secret: webhookSecret,
        signatureV2: request.headers.get("x-bachs-signature-v2"),
        legacySignature: request.headers.get("x-bachs-signature"),
        legacyTimestamp: request.headers.get("x-bachs-timestamp"),
      });
      if (!valid) return new Response("Invalid or expired signature", { status: 401 });
    } catch (error) {
      console.error("[BACHS Webhook] Signature verification failed");
      return new Response("Signature verification error", { status: 500 });
    }

    let data: any;
    try {
      data = JSON.parse(payloadString);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const event = data.type;
    const eventData = data.data || {};
    if (typeof data.id !== "string" || !data.id || typeof event !== "string") return new Response("Invalid event envelope", { status: 400 });
    const alreadyProcessed = await ctx.runQuery(internal.bachs.getProcessedWebhookEvent, { eventId: data.id });
    if (alreadyProcessed) return new Response("Duplicate event", { status: 200 });
    if (event !== "checkout.completed" && event !== "collection.succeeded") {
      await ctx.runMutation(internal.bachs.recordProcessedWebhookEvent, { eventId: data.id, eventType: event });
      return new Response("Event ignored", { status: 200 });
    }
    const checkoutId = eventData.checkout_id;
    if (typeof checkoutId !== "string" || !checkoutId) return new Response("Missing checkout_id", { status: 400 });

    // The signed event identifies the checkout. Fetch its authoritative state before
    // crediting anything; never infer amount, status, or currency from the redirect/event.
    const apiKey = process.env.BACHS_SECRET_KEY;
    if (!apiKey) return new Response("Payments are not configured", { status: 503 });
    const environment = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
    const expectedPrefix = environment === "live" || environment === "production" ? "sk_live_" : "sk_sandbox_";
    if (!apiKey.startsWith(expectedPrefix)) return new Response("Payment environment is misconfigured", { status: 503 });
    const baseUrl = expectedPrefix === "sk_live_" ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
    try {
      const verifyResponse = await fetch(`${baseUrl}/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!verifyResponse.ok) return new Response("Checkout verification failed", { status: 502 });
      const session = await verifyResponse.json() as any;
      if (session.checkout_id !== checkoutId || session.status !== "completed" || session.payment_status !== "succeeded") {
        return new Response("Checkout is not paid", { status: 200 });
      }
      if (String(session.currency || "").toUpperCase() !== "NGN") return new Response("Currency mismatch", { status: 200 });
      const reference = session.reference;
      const amount = Number(session.amount);
      if (typeof reference !== "string" || !reference || !Number.isFinite(amount) || amount <= 0) {
        return new Response("Invalid verified checkout", { status: 400 });
      }
      const expectedOwner = await ctx.runQuery(internal.bachs.getExpectedPaymentOwner, { reference });
      if (!expectedOwner) return new Response("Payment record is not ready", { status: 500 });
      const checkoutEmail = String(session.customer?.email || session.customer_details?.email || "").trim().toLowerCase();
      if (String(session.metadata?.userId || "") !== expectedOwner.userId || checkoutEmail !== expectedOwner.email.toLowerCase()) {
        return new Response("Checkout customer does not match the payment owner", { status: 400 });
      }
      if (reference.startsWith("LALAO_AD_")) {
        const amountKobo = Math.round(amount * 100);
        if (!Number.isSafeInteger(amountKobo)) return new Response("Invalid verified amount", { status: 400 });
        await ctx.runMutation(internal.adActions.settleAdPayment, {
          reference,
          paystackAmountKobo: amountKobo,
          paystackTransactionId: session.charge?.payment_id || checkoutId,
          paymentProvider: "bachs",
          gatewayResponse: "Verified with Bachs",
        });
        await ctx.runMutation(internal.bachs.recordProcessedWebhookEvent, { eventId: data.id, eventType: event });
        return new Response("Success", { status: 200 });
      }
      await ctx.runMutation(internal.wallet.settleWalletFunding, {
        reference,
        verifiedAmount: amount,
        providerTransactionId: session.charge?.payment_id || checkoutId,
        provider: "bachs",
      });
      await ctx.runMutation(internal.bachs.recordProcessedWebhookEvent, { eventId: data.id, eventType: event });
      return new Response("Success", { status: 200 });
    } catch (error: any) {
      console.error("[BACHS Webhook] Settlement failed; provider may retry.", error?.message || "unknown error");
      return new Response("Temporary processing failure", { status: 500 });
    }
  }),
});

/**
 * BACHS Return / Callback URL handler
 * Redirects user back to Lalao web wallet and reconciles status
 */
http.route({
  path: "/api/payments/bachs/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference") || url.searchParams.get("ref");
    const sessionId = url.searchParams.get("session_id") || url.searchParams.get("id");

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website").replace(/\/+$/, "");

    if (!reference && !sessionId) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/app?tab=wallet&funding_error=missing_reference` },
      });
    }

    try {
      const verifyRes = await ctx.runAction(api.bachs.verifyBachsFunding, {
        reference: reference || sessionId || "",
        sessionId: sessionId || undefined,
      });

      if (verifyRes.success) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/app?tab=wallet&funding_success=true&ref=${encodeURIComponent(reference || "")}` },
        });
      } else {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/app?tab=wallet&funding_failed=true&reason=${encodeURIComponent(verifyRes.message || "unconfirmed")}` },
        });
      }
    } catch (e: any) {
      console.error("[BACHS Callback] Error:", e);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/app?tab=wallet&funding_error=true` },
      });
    }
  }),
});

http.route({
  path: "/api/payments/paystack/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return new Response("Missing reference", { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return new Response("Server error", { status: 500 });

    try {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      });
      const data = await res.json();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";

      if (data.status === true && data.data.status === "success" && data.data.currency === "NGN") {
        const amountNgn = data.data.amount / 100;
        await ctx.runMutation(internal.wallet.settleWalletFunding, {
          reference,
          paystackAmount: amountNgn,
          paystackTransactionId: data.data.id?.toString()
        });
        
        // Redirect back to app wallet with success
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}?funding_success=true` }
        });
      } else {
        // Redirect back to app wallet with failure
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}?funding_failed=true` }
        });
      }
    } catch (e) {
      console.error("Callback error", e);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}?funding_error=true` }
      });
    }
  })
});

export default http;

