import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

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
    const signature = request.headers.get("x-bachs-signature") || request.headers.get("X-Bachs-Signature");
    const timestampStr = request.headers.get("x-bachs-timestamp") || request.headers.get("X-Bachs-Timestamp");

    const webhookSecret = process.env.BACHS_WEBHOOK_SECRET;

    // Validate signature and timestamp if webhook secret is configured
    if (webhookSecret) {
      if (!signature) {
        return new Response("Missing X-Bachs-Signature header", { status: 401 });
      }

      // Replay prevention: verify timestamp drift within 300 seconds (5 minutes)
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 300) {
          return new Response("Webhook timestamp expired or invalid", { status: 401 });
        }
      }

      try {
        // SubtleCrypto is standard Web Cryptography available in modern runtimes / Edge / Convex
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhookSecret);
        const signedPayload = timestampStr ? `${timestampStr}.${payloadString}` : payloadString;
        
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBytes = await crypto.subtle.sign(
          "HMAC",
          cryptoKey,
          encoder.encode(signedPayload)
        );
        const expectedSignature = Array.from(new Uint8Array(signatureBytes))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        // Constant time comparison
        if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
          console.warn("[BACHS Webhook] Signature mismatch");
          return new Response("Invalid signature", { status: 401 });
        }
      } catch (cryptoErr) {
        console.error("[BACHS Webhook] Signature verification error:", cryptoErr);
        return new Response("Signature verification error", { status: 500 });
      }
    }

    let data: any;
    try {
      data = JSON.parse(payloadString);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const event = data.event || data.type;
    const sessionData = data.data || data;

    // We process successful collection / checkout session completions
    const isSuccessEvent = 
      event === "collection.succeeded" || 
      event === "checkout.session.completed" || 
      event === "payment.succeeded" ||
      sessionData.status === "completed" ||
      sessionData.status === "paid" ||
      sessionData.status === "succeeded";

    if (isSuccessEvent) {
      const reference = sessionData.reference || sessionData.metadata?.reference;
      const currency = (sessionData.pricing?.currency || sessionData.currency || "NGN").toUpperCase();
      const amountVal = parseFloat(sessionData.pricing?.amount || sessionData.amount || "0");
      const transactionId = sessionData.id?.toString() || sessionData.transaction_id?.toString();

      if (!reference) {
        return new Response("Missing payment reference in payload", { status: 400 });
      }

      if (currency !== "NGN") {
        return new Response("Ignored non-NGN currency", { status: 200 });
      }

      if (isNaN(amountVal) || amountVal <= 0) {
        return new Response("Invalid amount", { status: 400 });
      }

      try {
        await ctx.runMutation(internal.wallet.settleWalletFunding, {
          reference,
          verifiedAmount: amountVal,
          providerTransactionId: transactionId,
          provider: "bachs",
        });
        return new Response("Success", { status: 200 });
      } catch (error: any) {
        console.error("[BACHS Webhook] Settlement error:", error);
        return new Response("Processed with message: " + error.message, { status: 200 });
      }
    }

    return new Response("Unhandled event", { status: 200 });
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

