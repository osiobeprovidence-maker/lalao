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
 * Convex Action: Initialize Paystack Checkout for Campaign
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
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      // In development or test without secret key, record pending and return reference
      await ctx.runMutation(internal.adActions.createPendingAdPayment, {
        campaignId: args.campaignId,
        userId: user._id,
        amountKobo,
        currency,
        reference,
      });

      return {
        authorizationUrl: null,
        accessCode: null,
        reference,
        isDevFallback: true,
        message: "PAYSTACK_SECRET_KEY not set. Using test checkout fallback.",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "https://lalao.website";
    const callbackUrl = `${appUrl}/app?ad_payment_callback=${reference}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email || `${user.username || "user"}@lalao.website`,
        amount: amountKobo, // Paystack expects integer in kobo for NGN
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          campaignId: args.campaignId,
          userId: user._id,
          campaignName: campaign.name,
          source: "lalao_ads",
        },
      }),
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(`Paystack initialization failed: ${data.message}`);
    }

    // Persist pending payment record
    await ctx.runMutation(internal.adActions.createPendingAdPayment, {
      campaignId: args.campaignId,
      userId: user._id,
      amountKobo,
      currency,
      reference,
      paystackAccessCode: data.data.access_code,
    });

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
      isDevFallback: false,
    };
  },
});

/**
 * Convex Action: Server-side Paystack Verification of Campaign Payment
 */
export const verifyCampaignPayment = action({
  args: {
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      // Dev mode: Test settlement
      return await ctx.runMutation(internal.adActions.settleAdPaymentDev, {
        reference: args.reference,
      });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${args.reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json();

    if (!data.status || data.data.status !== "success") {
      throw new Error(data.message || "Payment verification failed or pending on provider.");
    }

    const paystackAmountKobo = data.data.amount;
    const paystackTransactionId = data.data.id?.toString();
    const gatewayResponse = data.data.gateway_response;

    const result = await ctx.runMutation(internal.adActions.settleAdPayment, {
      reference: args.reference,
      paystackAmountKobo,
      paystackTransactionId,
      gatewayResponse,
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
