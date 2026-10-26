import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Internal mutation to create a pending ad payment record
 */
export const createPendingAdPayment = internalMutation({
  args: {
    campaignId: v.id("adCampaigns"),
    userId: v.id("users"),
    amountKobo: v.number(),
    currency: v.string(),
    reference: v.string(),
    paystackAccessCode: v.optional(v.string()),
    bachsCheckoutId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if reference already exists to enforce idempotency
    const existing = await ctx.db
      .query("adPayments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();

    if (existing) {
      return existing._id;
    }

    const paymentId = await ctx.db.insert("adPayments", {
      campaignId: args.campaignId,
      userId: args.userId,
      amountKobo: args.amountKobo,
      currency: args.currency,
      reference: args.reference,
      status: "pending",
      paystackAccessCode: args.paystackAccessCode,
      bachsCheckoutId: args.bachsCheckoutId,
      paymentProvider: "bachs",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

/**
 * Internal mutation to settle an ad payment strictly and idempotently
 */
export const settleAdPayment = internalMutation({
  args: {
    reference: v.string(),
    paystackAmountKobo: v.number(),
    paystackTransactionId: v.optional(v.string()),
    paymentProvider: v.optional(v.string()),
    gatewayResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("adPayments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();

    if (!payment) {
      throw new Error(`Ad payment record not found for reference ${args.reference}`);
    }

    // Idempotency: If already successful, exit gracefully without double crediting
    if (payment.status === "successful") {
      return { settled: true, message: "Payment already settled" };
    }

    // Financial verification: Amount must match expected kobo
    if (payment.amountKobo !== args.paystackAmountKobo) {
      await ctx.db.patch(payment._id, {
        status: "failed",
        gatewayResponse: `Amount mismatch: expected ${payment.amountKobo} kobo, got ${args.paystackAmountKobo} kobo`,
        updatedAt: Date.now(),
      });
      throw new Error(
        `Amount mismatch: expected ${payment.amountKobo} kobo, but Paystack sent ${args.paystackAmountKobo} kobo.`
      );
    }

    const now = Date.now();

    // Mark payment successful
    await ctx.db.patch(payment._id, {
      status: "successful",
      paystackTransactionId: args.paystackTransactionId,
      paymentProvider: args.paymentProvider || "paystack",
      gatewayResponse: args.gatewayResponse || "Successful",
      paidAt: now,
      updatedAt: now,
    });

    // Update Campaign state
    const campaign = await ctx.db.get(payment.campaignId);
    if (campaign) {
      let nextStatus = campaign.status;

      // If already approved by admin, move to active or scheduled
      if (campaign.moderationStatus === "approved") {
        if (campaign.schedule.startDate <= now && campaign.schedule.endDate > now) {
          nextStatus = "active";
        } else if (campaign.schedule.startDate > now) {
          nextStatus = "scheduled";
        }
      } else {
        // Pending review
        nextStatus = "pending_review";
      }

      await ctx.db.patch(campaign._id, {
        status: nextStatus,
        updatedAt: now,
      });

      // Dispatch notification to advertiser
      await ctx.db.insert("notifications", {
        recipientId: campaign.userId,
        actorId: campaign.userId,
        type: "ad_payment_confirmed",
        targetExcerpt: `Payment confirmed for ad "${campaign.name}". Your campaign is being delivered or awaiting review.`,
        isRead: false,
        createdAt: now,
      });
    }

    return { settled: true, campaignId: payment.campaignId };
  },
});

/**
 * Create a Bachs hosted checkout for an ad campaign.
 */
export const initializeCampaignPayment = action({
  args: {
    campaignId: v.id("adCampaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Fetch user and campaign
    const user: any = await ctx.runQuery(internal.wallet.getUserByIdentity, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User not found");

    const campaign: any = await ctx.runQuery(internal.adActions.getCampaignInternal, {
      campaignId: args.campaignId,
    });
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.userId !== user._id) throw new Error("Unauthorized");

    const amountKobo = campaign.budget.totalBudgetKobo;
    const currency = campaign.budget.currency || "NGN";
    const reference = `LALAO_AD_${campaign._id}_${Date.now()}`;
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("Bachs checkout is not configured. Please try again later.");
    const environment = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
    const isLive = environment === "live" || environment === "production";
    if ((isLive && !secretKey.startsWith("sk_live_")) || (!isLive && !secretKey.startsWith("sk_sandbox_"))) {
      throw new Error("Bachs key does not match the configured payment environment.");
    }
    const baseUrl = isLive ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website").replace(/\/+$/, "");

    const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        pricing: { currency, amount: (amountKobo / 100).toFixed(2) },
        customer: { email: user.email || `${user.username || "user"}@lalao.app`, name: user.name || "Lalao Advertiser" },
        reference,
        success_url: `${appUrl}/app?tab=ads&payment=pending&reference=${encodeURIComponent(reference)}`,
        cancel_url: `${appUrl}/app?tab=ads&payment=cancelled&reference=${encodeURIComponent(reference)}`,
        metadata: {
          campaignId: args.campaignId,
          userId: user._id,
          campaignName: campaign.name,
          source: "lalao_ads",
        },
      }),
    });

    const data = await res.json() as any;
    if (!res.ok || typeof data.checkout_id !== "string" || typeof data.checkout_url !== "string") {
      throw new Error(data.detail || "Bachs could not start checkout.");
    }

    // Persist pending payment record
    await ctx.runMutation(internal.adActions.createPendingAdPayment, {
      campaignId: args.campaignId,
      userId: user._id,
      amountKobo,
      currency,
      reference,
      bachsCheckoutId: data.checkout_id,
    });

    return {
      authorizationUrl: data.data.authorization_url,
      checkoutId: data.checkout_id,
      reference,
    };
  },
});

/**
 * Server-side Bachs checkout verification for an ad campaign.
 */
export const verifyCampaignPayment = action({
  args: {
    reference: v.string(),
    checkoutId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("Bachs checkout is not configured.");
    const environment = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
    const isLive = environment === "live" || environment === "production";
    if ((isLive && !secretKey.startsWith("sk_live_")) || (!isLive && !secretKey.startsWith("sk_sandbox_"))) throw new Error("Bachs key does not match the configured payment environment.");
    const baseUrl = isLive ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
    const res = await fetch(`${baseUrl}/v1/checkout-sessions/${encodeURIComponent(args.checkoutId)}`, {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Could not retrieve the Bachs checkout session.");
    const session = await res.json() as any;
    if (session.checkout_id !== args.checkoutId || session.reference !== args.reference) throw new Error("Checkout does not match this ad payment.");
    if (session.status !== "completed" || session.payment_status !== "succeeded") throw new Error("Payment is not confirmed yet.");
    if (String(session.currency).toUpperCase() !== "NGN") throw new Error("Payment currency does not match the campaign.");
    const paystackAmountKobo = Math.round(Number(session.amount) * 100);
    if (!Number.isSafeInteger(paystackAmountKobo) || paystackAmountKobo <= 0) throw new Error("Invalid verified payment amount.");

    const result: any = await ctx.runMutation(internal.adActions.settleAdPayment, {
      reference: args.reference,
      paystackAmountKobo,
      paystackTransactionId: session.charge?.payment_id || args.checkoutId,
      paymentProvider: "bachs",
      gatewayResponse: "Verified with Bachs",
    });

    return result;
  },
});

/**
 * Internal query to fetch a campaign
 */
export const getCampaignInternal = internalQuery({
  args: { campaignId: v.id("adCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

/**
 * Dev test settlement fallback
 */
export const settleAdPaymentDev = internalMutation({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("adPayments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();

    if (!payment) throw new Error("Payment record not found");

    return await ctx.db.patch(payment._id, {
      status: "successful",
      paidAt: Date.now(),
      gatewayResponse: "Dev Verified",
      updatedAt: Date.now(),
    });
  },
});
