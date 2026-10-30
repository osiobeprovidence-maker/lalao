import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const DEFAULT_SANDBOX_URL = "https://sandbox-api.bachs.io";
const DEFAULT_LIVE_URL = "https://api.bachs.io";

export const getProcessedWebhookEvent = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, args) => ctx.db.query("bachsWebhookEvents").withIndex("by_event_id", (q) => q.eq("eventId", args.eventId)).first(),
});

export const recordProcessedWebhookEvent = internalMutation({
  args: { eventId: v.string(), eventType: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("bachsWebhookEvents").withIndex("by_event_id", (q) => q.eq("eventId", args.eventId)).first();
    if (existing) return existing._id;
    return await ctx.db.insert("bachsWebhookEvents", { ...args, processedAt: Date.now() });
  },
});

export const getExpectedPaymentOwner = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    if (args.reference.startsWith("LALAO_AD_")) {
      const payment = await ctx.db.query("adPayments").withIndex("by_reference", (q) => q.eq("reference", args.reference)).first();
      if (!payment) return null;
      const user = await ctx.db.get(payment.userId);
      return user ? { userId: String(user._id), email: user.email || `${user.username || "user"}@lalao.app`, currency: payment.currency } : null;
    }
    if (args.reference.startsWith("LALAO_CREATOR_")) {
      return await ctx.runQuery(internal.creators.getBachsCreatorPaymentOwner, { reference: args.reference });
    }
    if (args.reference.startsWith("LALAO_SUB_")) {
      return await ctx.runQuery(internal.subscriptions.getBachsReservationForReference, { reference: args.reference });
    }
    const tx = await ctx.db.query("walletTransactions").withIndex("by_reference", (q) => q.eq("reference", args.reference)).first();
    if (!tx || tx.paymentProvider !== "bachs") return null;
    const user = await ctx.db.get(tx.userId);
    return user ? { userId: String(user._id), email: user.email || `${user.username || "user"}@lalao.app`, currency: "NGN" } : null;
  },
});

function getBachsBaseUrl(): string {
  const env = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
  const expected = env === "live" || env === "production" ? DEFAULT_LIVE_URL : DEFAULT_SANDBOX_URL;
  const configured = process.env.BACHS_API_BASE_URL?.replace(/\/+$/, "");
  if (configured && configured !== expected) {
    throw new Error("BACHS_API_BASE_URL does not match BACHS_ENVIRONMENT.");
  }
  const key = process.env.BACHS_SECRET_KEY;
  if (key && ((expected === DEFAULT_LIVE_URL && !key.startsWith("sk_live_")) || (expected === DEFAULT_SANDBOX_URL && !key.startsWith("sk_sandbox_")))) {
    throw new Error("BACHS_SECRET_KEY does not match BACHS_ENVIRONMENT.");
  }
  return expected;
}

/**
 * Initialize a BACHS hosted checkout session for wallet funding.
 * Called securely by the frontend via backend action.
 */
export const initializeBachsFunding = action({
  args: {
    amount: v.number(),
    reference: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // 1. Validation: Minimum funding is ₦100 (100 LC), maximum is ₦500,000 (500,000 LC)
    if (typeof args.amount !== "number" || isNaN(args.amount) || args.amount < 100) {
      throw new Error("Minimum funding amount is ₦100 (100 LC).");
    }
    if (args.amount > 500000) {
      throw new Error("Maximum funding amount is ₦500,000 (500,000 LC) per transaction.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.runQuery(internal.wallet.getUserByIdentity, {
      tokenIdentifier: identity?.tokenIdentifier,
      userId: args.userId,
    });
    if (!user) throw new Error("User profile not found. Please sign in to fund your wallet.");

    const wallet = await ctx.runMutation(internal.wallet.getOrCreateUserWallet, {
      userId: user._id,
      userName: user.name,
    });
    if (!wallet) throw new Error("Wallet could not be initialized.");

    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Bachs checkout is not configured. Please try again later.");
    }
    const baseUrl = getBachsBaseUrl();

    // 2. Create pending ledger transaction record with provider = "bachs"
    await ctx.runMutation(internal.wallet.createPendingFunding, {
      amount: args.amount,
      reference: args.reference,
      userId: user._id,
      walletId: wallet._id,
      provider: "bachs",
    });

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website").replace(/\/+$/, "");
    const successUrl = `${appUrl}/app?tab=wallet&funding_pending=true&ref=${encodeURIComponent(args.reference)}`;
    const cancelUrl = `${appUrl}/app?tab=wallet&funding_cancelled=true&ref=${encodeURIComponent(args.reference)}`;

    try {
      const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          customer: {
            email: user.email || `${user.username || "user"}@lalao.app`,
            name: user.name || "Lalao User",
          },
          pricing: {
            currency: "NGN",
            amount: args.amount.toString(),
          },
          reference: args.reference,
          metadata: {
            userId: user._id,
            walletId: wallet._id,
            reference: args.reference,
            type: "wallet_funding",
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      const data = await res.json() as any;

      if (!res.ok || !data) {
        const errorMsg = data?.message || data?.error || `BACHS session initialization failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      const checkoutUrl = data.checkout_url || data.url;
      const sessionId = data.checkout_id;
      if (typeof checkoutUrl !== "string" || typeof sessionId !== "string") {
        throw new Error("Bachs returned an incomplete checkout session.");
      }

      return {
        success: true,
        sessionId,
        checkoutUrl,
        reference: args.reference,
      };
    } catch (err: any) {
      console.error("[BACHS] Checkout session creation error:", err);
      throw new Error(err.message || "Could not connect to BACHS payment gateway.");
    }
  },
});

/** Create a hosted one-time checkout for a pending, server-owned Lalao purchase. */
export const initializeBachsPayment = action({
  args: {
    amount: v.number(),
    currency: v.string(),
    reference: v.string(),
    purpose: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const currency = args.currency.trim().toUpperCase();
    if (!Number.isFinite(args.amount) || args.amount <= 0 || !/^[A-Z]{3}$/.test(currency) || !args.reference || !args.purpose) {
      throw new Error("Invalid payment request.");
    }
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.runQuery(internal.wallet.getUserByIdentity, {
      tokenIdentifier: identity?.tokenIdentifier,
    });
    if (!user) throw new Error("Please sign in before starting checkout.");

    const isCreatorPurchase = args.purpose === "creator_subscription" && args.reference.startsWith("LALAO_CREATOR_");
    const isMembershipPurchase = args.purpose === "subscription_membership" && args.reference.startsWith("LALAO_SUB_");
    if (!isCreatorPurchase && !isMembershipPurchase) throw new Error("This checkout purpose and reference are not supported.");
    const paymentOwner = isCreatorPurchase
      ? await ctx.runQuery(internal.creators.getBachsCreatorPaymentOwner, { reference: args.reference })
      : await ctx.runQuery(internal.subscriptions.getBachsReservationForReference, { reference: args.reference });
    if (!paymentOwner || paymentOwner.userId !== String(user._id) || paymentOwner.amount !== args.amount || paymentOwner.currency.toUpperCase() !== currency || paymentOwner.status !== "pending" || paymentOwner.expiresAt <= Date.now() || paymentOwner.checkoutId) {
      throw new Error("Checkout details do not match a pending payment for this account.");
    }

    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("Bachs checkout is not configured.");
    const baseUrl = getBachsBaseUrl();
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website").replace(/\/+$/, "");
    const payload = {
      customer: { email: user.email || `${user.username || "user"}@lalao.app`, name: user.name || "Lalao User" },
      pricing: { currency, amount: args.amount.toFixed(2) },
      reference: args.reference,
      metadata: { userId: String(user._id), reference: args.reference, purpose: args.purpose },
      success_url: `${appUrl}/app?payment=success&purpose=${encodeURIComponent(args.purpose)}&reference=${encodeURIComponent(args.reference)}`,
      cancel_url: `${appUrl}/app?payment=cancelled&purpose=${encodeURIComponent(args.purpose)}&reference=${encodeURIComponent(args.reference)}`,
    };
    const response = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as any;
    if (!response.ok || typeof data.checkout_id !== "string" || typeof data.checkout_url !== "string") {
      throw new Error(data?.message || "Bachs could not start checkout.");
    }
    return { success: true, sessionId: data.checkout_id, checkoutUrl: data.checkout_url, reference: args.reference };
  },
});

/**
 * Verify a BACHS payment directly from the BACHS API.
 * Idempotently settles wallet funding upon verification.
 */
export const verifyBachsFunding = action({
  args: {
    reference: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) {
      return {
        success: false,
        isDevelopmentMode: true,
        message: "BACHS_SECRET_KEY is not configured in backend environment variables.",
      };
    }

    const baseUrl = getBachsBaseUrl();

    try {
      if (!args.sessionId) return { success: false, message: "BACHS checkout ID is required to verify this payment." };
      const sessionRes = await fetch(`${baseUrl}/v1/checkout-sessions/${encodeURIComponent(args.sessionId)}`, {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
      });
      if (!sessionRes.ok) return { success: false, message: "Could not retrieve the BACHS checkout session." };
      const paymentRecord = await sessionRes.json() as any;
      if (paymentRecord.checkout_id !== args.sessionId || paymentRecord.reference !== args.reference) {
        return { success: false, message: "BACHS checkout does not match this wallet funding request." };
      }

      const status = String(paymentRecord.status || "").toLowerCase();
      const paymentStatus = String(paymentRecord.payment_status || paymentRecord.charge?.status || "").toLowerCase();
      if (status !== "completed" || paymentStatus !== "succeeded") {
        return {
          success: false,
          status,
          message: `Payment status is ${status || "pending"}. Wallet can only be credited once payment is confirmed.`,
        };
      }

      // 4. Verify currency & amount
      const currency = String(paymentRecord.currency || "").toUpperCase();
      if (currency !== "NGN") {
        return { success: false, message: `Invalid payment currency: ${currency}. Expected NGN.` };
      }

      const rawAmount = paymentRecord.amount || "0";
      const verifiedAmount = parseFloat(rawAmount);
      if (isNaN(verifiedAmount) || verifiedAmount <= 0) {
        return { success: false, message: "Invalid amount reported by BACHS provider." };
      }

      // 5. Atomically settle wallet credits
      const settleResult = await ctx.runMutation(internal.wallet.settleWalletFunding, {
        reference: args.reference,
        verifiedAmount,
        providerTransactionId: paymentRecord.charge?.payment_id || args.sessionId,
        provider: "bachs",
      });

      return settleResult;
    } catch (err: any) {
      console.error("[BACHS] Verification error:", err);
      return {
        success: false,
        message: err.message || "Network error verifying payment with BACHS.",
      };
    }
  },
});
