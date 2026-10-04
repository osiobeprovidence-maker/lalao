import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
