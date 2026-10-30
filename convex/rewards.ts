import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { getUserByAuthIdentity } from "./lib/authIdentity";

// ============================================
// DEFAULT REWARD CONFIGURATION
// ============================================

const DEFAULT_POINTS_PER_DOLLAR = 1;
const DEFAULT_REFERRAL_POINTS = 20;
const DEFAULT_REFERRAL_QUALIFICATION = "first_purchase";
// Reward amounts are tracked in USD. Purchases settle in NGN (LC), so the
// conversion rate is configurable and only used to express spend in USD.
const DEFAULT_NGN_PER_USD = 1500;

const DEFAULT_REWARD_CONFIG: Array<{ key: string; value: string; description: string }> = [
  { key: "points_per_dollar", value: String(DEFAULT_POINTS_PER_DOLLAR), description: "Reward points awarded per eligible USD 1 spent" },
  { key: "ngn_per_usd", value: String(DEFAULT_NGN_PER_USD), description: "NGN per USD rate used to value eligible purchase spend" },
  { key: "referral_points", value: String(DEFAULT_REFERRAL_POINTS), description: "Points awarded to referrer when a referred user qualifies" },
  { key: "referral_qualification", value: DEFAULT_REFERRAL_QUALIFICATION, description: "Action required for referral to qualify (first_purchase, wallet_topup, registration)" },
  { key: "fractional_points_enabled", value: "true", description: "Whether fractional points are awarded for partial amounts" },
  { key: "points_rounding", value: "round", description: "Rounding policy: round, floor, ceil" },
  { key: "rewards_enabled", value: "true", description: "Master switch for awarding points on purchases" },
];

async function seedDefaultConfig(ctx: any) {
  for (const config of DEFAULT_REWARD_CONFIG) {
    const existing = await ctx.db
      .query("rewardConfiguration")
      .withIndex("by_key", (q: any) => q.eq("key", config.key))
      .first();
    if (!existing) {
      await ctx.db.insert("rewardConfiguration", {
        key: config.key,
        value: config.value,
        description: config.description,
        updatedAt: Date.now(),
      });
    }
  }
}

// Initialize default configuration if not exists (internal mutation - can write to DB)
export const ensureRewardConfig = internalMutation({
  args: {},
  handler: async (ctx) => {
    await seedDefaultConfig(ctx);
  },
});

/**
 * Client-callable, idempotent seeding of the default reward configuration.
 * Safe to call on app load: it only inserts keys that are missing.
 */
export const ensureRewardsReady = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { seeded: false };
    await seedDefaultConfig(ctx);
    return { seeded: true };
  },
});

async function getRewardConfig(ctx: any, key: string): Promise<string | null> {
  const config = await ctx.db
    .query("rewardConfiguration")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  return config ? config.value : null;
}

// ============================================
// USER REWARD BALANCE
// ============================================

export const getUserRewardBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return null;

    let balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!balance) {
      return {
        availablePoints: 0,
        pendingPoints: 0,
        lifetimePoints: 0,
        totalEarned: 0,
        totalRedeemed: 0,
      };
    }

    return {
      availablePoints: balance.availablePoints,
      pendingPoints: balance.pendingPoints,
      lifetimePoints: balance.lifetimePoints,
      totalEarned: balance.totalEarned,
      totalRedeemed: balance.totalRedeemed,
    };
  },
});

// ============================================
// AWARD POINTS FOR PURCHASE
// ============================================

/**
 * Award reward points for an eligible completed purchase.
 * Must be called from wallet settlement or payment webhook after payment confirmed.
 * Uses idempotencyKey to prevent duplicate awards.
 */
async function getOrCreateRewardBalance(ctx: any, userId: any) {
  let balance: any = await ctx.db
    .query("userRewardBalances")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!balance) {
    const id: any = await ctx.db.insert("userRewardBalances", {
      userId,
      availablePoints: 0,
      pendingPoints: 0,
      lifetimePoints: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      lastUpdatedAt: Date.now(),
    });
    balance = await ctx.db.get(id);
  }

  return balance;
}

/**
 * Shared award routine. Callers must supply a stable idempotency key so a
 * retried webhook cannot award the same purchase twice.
 */
async function awardPointsForPurchase(
  ctx: any,
  params: {
    userId: any;
    eligibleAmountUsd: number;
    relatedTransactionId?: any;
    idempotencyKey: string;
    metadata?: any;
    description?: string;
  }
) {
  // Check idempotency - prevent duplicate awards
  const existing = await ctx.db
    .query("rewardTransactions")
    .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", params.idempotencyKey))
    .first();
  if (existing) {
    return { status: "already_awarded", transactionId: existing._id };
  }

  if ((await getRewardConfig(ctx, "rewards_enabled")) === "false") {
    return { status: "disabled", points: 0 };
  }

  const pointsPerDollar = parseFloat(await getRewardConfig(ctx, "points_per_dollar") || String(DEFAULT_POINTS_PER_DOLLAR));
  const fractionalEnabled = await getRewardConfig(ctx, "fractional_points_enabled") === "true";
  const rounding = await getRewardConfig(ctx, "points_rounding") || "round";

  // Calculate points: 1 point per $1 eligible
  let points = params.eligibleAmountUsd * pointsPerDollar;

  // Apply rounding policy
  if (!fractionalEnabled) {
    if (rounding === "floor") points = Math.floor(points);
    else if (rounding === "ceil") points = Math.ceil(points);
    else points = Math.round(points);
  } else {
    // Keep a sane precision so repeated fractional awards cannot drift.
    points = Math.round(points * 100) / 100;
  }

  if (!isFinite(points) || points <= 0) {
    return { status: "no_points", points: 0 };
  }

  const user = await ctx.db.get(params.userId);
  if (!user) throw new Error("User not found");

  let balance: any = await ctx.db
    .query("userRewardBalances")
    .withIndex("by_user", (q: any) => q.eq("userId", params.userId))
    .first();

  if (!balance) {
    const id: any = await ctx.db.insert("userRewardBalances", {
      userId: params.userId,
      availablePoints: 0,
      pendingPoints: 0,
      lifetimePoints: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      lastUpdatedAt: Date.now(),
    });
    balance = await ctx.db.get(id);
  }

  const pointsBefore = balance.availablePoints;
  const pointsAfter = pointsBefore + points;

  await ctx.db.patch(balance._id, {
    availablePoints: pointsAfter,
    lifetimePoints: balance.lifetimePoints + points,
    totalEarned: balance.totalEarned + points,
    lastUpdatedAt: Date.now(),
  });

  const txId: any = await ctx.db.insert("rewardTransactions", {
    userId: params.userId,
    type: "earn_purchase",
    description: params.description || `Purchase reward: +${points} points`,
    amount: points,
    pointsBefore,
    pointsAfter,
    status: "completed",
    relatedTransactionId: params.relatedTransactionId,
    idempotencyKey: params.idempotencyKey,
    metadata: params.metadata,
    createdAt: Date.now(),
  });

  return { status: "awarded", points, transactionId: txId, pointsBefore, pointsAfter };
}

export const awardPurchasePoints = internalMutation({
  args: {
    userId: v.id("users"),
    eligibleAmountUsd: v.number(),
    relatedTransactionId: v.optional(v.id("walletTransactions")),
    idempotencyKey: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await awardPointsForPurchase(ctx, args);
  },
});

/**
 * Award points for a completed market purchase (airtime, data, bills, etc.).
 * Amounts settle in NGN, so convert to USD using the configured rate.
 * Called from `market.updatePurchaseStatus` when a purchase reaches COMPLETED.
 */
export const awardMarketPurchasePoints = internalMutation({
  args: {
    userId: v.id("users"),
    amountNgn: v.number(),
    marketTxId: v.id("marketTransactions"),
    walletTxId: v.optional(v.id("walletTransactions")),
  },
  handler: async (ctx, args) => {
    const ngnPerUsd = parseFloat(await getRewardConfig(ctx, "ngn_per_usd") || String(DEFAULT_NGN_PER_USD));
    if (!isFinite(ngnPerUsd) || ngnPerUsd <= 0) {
      return { status: "invalid_rate", points: 0 };
    }

    const eligibleAmountUsd = args.amountNgn / ngnPerUsd;

    return await awardPointsForPurchase(ctx, {
      userId: args.userId,
      eligibleAmountUsd,
      relatedTransactionId: args.walletTxId,
      idempotencyKey: `purchase:${args.marketTxId}`,
      metadata: {
        source: "market_purchase",
        marketTxId: args.marketTxId,
        amountNgn: args.amountNgn,
        ngnPerUsd,
      },
      description: `Purchase reward: +${(args.amountNgn / ngnPerUsd).toFixed(2)} USD eligible`,
    });
  },
});

/**
 * Reverse the exact points awarded for a market purchase when it is refunded
 * or charged back. No-op when no points were awarded.
 */
export const reverseMarketPurchasePoints = internalMutation({
  args: {
    userId: v.id("users"),
    marketTxId: v.id("marketTransactions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const awardKey = `purchase:${args.marketTxId}`;
    const reverseKey = `purchase_reversal:${args.marketTxId}`;

    const existingReversal = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", reverseKey))
      .first();
    if (existingReversal) return { status: "already_reversed" };

    const award: any = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", awardKey))
      .first();
    if (!award) return { status: "nothing_to_reverse" };

    let balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();
    if (!balance) return { status: "no_balance" };

    // Never let a reversal push the available balance below zero.
    const pointsToReverse = Math.min(award.amount, balance.availablePoints);
    if (pointsToReverse <= 0) return { status: "no_points_to_reverse" };

    const pointsBefore = balance.availablePoints;
    const pointsAfter = pointsBefore - pointsToReverse;

    await ctx.db.patch(balance._id, {
      availablePoints: pointsAfter,
      lifetimePoints: Math.max(0, balance.lifetimePoints - pointsToReverse),
      totalEarned: Math.max(0, balance.totalEarned - pointsToReverse),
      lastUpdatedAt: Date.now(),
    });

    await ctx.db.insert("rewardTransactions", {
      userId: args.userId,
      type: "reverse_purchase",
      description: `Reversed purchase points: -${pointsToReverse} points${args.reason ? ` (${args.reason})` : ""}`,
      amount: -pointsToReverse,
      pointsBefore,
      pointsAfter,
      status: "completed",
      idempotencyKey: reverseKey,
      metadata: { source: "market_purchase", marketTxId: args.marketTxId, reason: args.reason },
      createdAt: Date.now(),
    });

    return { status: "reversed", pointsReversed: pointsToReverse, pointsBefore, pointsAfter };
  },
});

/**
 * Reverse points when a purchase is refunded or charged back.
 */
export const reversePurchasePoints = internalMutation({
  args: {
    userId: v.id("users"),
    pointsToReverse: v.number(),
    relatedTransactionId: v.optional(v.id("walletTransactions")),
    idempotencyKey: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check idempotency
    const existing = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { status: "already_reversed" };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    let balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!balance) {
      return { status: "no_balance", pointsReversed: 0 };
    }

    const pointsToReverse = Math.min(args.pointsToReverse, balance.availablePoints);
    if (pointsToReverse <= 0) {
      return { status: "no_points_to_reverse", pointsReversed: 0 };
    }

    const pointsBefore = balance.availablePoints;
    const pointsAfter = pointsBefore - pointsToReverse;

    await ctx.db.patch(balance._id, {
      availablePoints: pointsAfter,
      lastUpdatedAt: Date.now(),
    });

    await ctx.db.insert("rewardTransactions", {
      userId: args.userId,
      type: "reverse_purchase",
      description: `Reversed purchase points: -${pointsToReverse} points${args.reason ? ` (${args.reason})` : ""}`,
      amount: -pointsToReverse,
      pointsBefore,
      pointsAfter,
      status: "completed",
      relatedTransactionId: args.relatedTransactionId,
      idempotencyKey: args.idempotencyKey,
      metadata: { reason: args.reason },
      createdAt: Date.now(),
    });

    return { status: "reversed", pointsReversed: pointsToReverse, pointsBefore, pointsAfter };
  },
});

// ============================================
// REWARD CATALOGUE (Admin)
// ============================================

export const getRewardCatalogue = query({
  args: {},
  handler: async (ctx) => {
    const rewards: any[] = await ctx.db
      .query("rewardCatalogue")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .order("desc")
      .take(100);

    return rewards.map((r: any) => ({
      ...r,
      isAvailable: r.status === "active" &&
        (!r.availabilityStart || Date.now() >= r.availabilityStart) &&
        (!r.availabilityEnd || Date.now() <= r.availabilityEnd) &&
        (!r.stockLimit || (r.stockRemaining ?? 0) > 0),
    }));
  },
});

export const getAllRewardCatalogue = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("rewardCatalogue").order("desc").take(100);
  },
});

export const createReward = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("gift_card"),
      v.literal("airtime"),
      v.literal("data_bundle"),
      v.literal("voucher"),
      v.literal("partner_offer"),
      v.literal("other")
    ),
    imageUrl: v.optional(v.string()),
    pointsCost: v.number(),
    stockLimit: v.optional(v.number()),
    availabilityStart: v.optional(v.number()),
    availabilityEnd: v.optional(v.number()),
    eligibilityRequirements: v.optional(v.any()),
    fulfillmentInstructions: v.optional(v.string()),
    providerIntegration: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const id: any = await ctx.db.insert("rewardCatalogue", {
      name: args.name,
      description: args.description,
      type: args.type,
      imageUrl: args.imageUrl,
      pointsCost: args.pointsCost,
      status: "active",
      stockLimit: args.stockLimit,
      stockRemaining: args.stockLimit,
      availabilityStart: args.availabilityStart,
      availabilityEnd: args.availabilityEnd,
      eligibilityRequirements: args.eligibilityRequirements,
      fulfillmentInstructions: args.fulfillmentInstructions,
      providerIntegration: args.providerIntegration,
      createdBy: actor._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAdminAudit(ctx, actor._id, "create_reward", `reward:${id}`, undefined, args.name);

    return { success: true, rewardId: id };
  },
});

export const updateReward = mutation({
  args: {
    rewardId: v.id("rewardCatalogue"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("gift_card"),
      v.literal("airtime"),
      v.literal("data_bundle"),
      v.literal("voucher"),
      v.literal("partner_offer"),
      v.literal("other")
    )),
    imageUrl: v.optional(v.string()),
    pointsCost: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))),
    stockLimit: v.optional(v.number()),
    stockRemaining: v.optional(v.number()),
    availabilityStart: v.optional(v.number()),
    availabilityEnd: v.optional(v.number()),
    eligibilityRequirements: v.optional(v.any()),
    fulfillmentInstructions: v.optional(v.string()),
    providerIntegration: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const existing: any = await ctx.db.get(args.rewardId);
    if (!existing) throw new Error("Reward not found");

    const before = { ...existing };

    const updates: any = { updatedAt: Date.now(), updatedBy: actor._id };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.type !== undefined) updates.type = args.type;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.pointsCost !== undefined) updates.pointsCost = args.pointsCost;
    if (args.status !== undefined) updates.status = args.status;
    if (args.stockLimit !== undefined) updates.stockLimit = args.stockLimit;
    if (args.stockRemaining !== undefined) updates.stockRemaining = args.stockRemaining;
    if (args.availabilityStart !== undefined) updates.availabilityStart = args.availabilityStart;
    if (args.availabilityEnd !== undefined) updates.availabilityEnd = args.availabilityEnd;
    if (args.eligibilityRequirements !== undefined) updates.eligibilityRequirements = args.eligibilityRequirements;
    if (args.fulfillmentInstructions !== undefined) updates.fulfillmentInstructions = args.fulfillmentInstructions;
    if (args.providerIntegration !== undefined) updates.providerIntegration = args.providerIntegration;

    await ctx.db.patch(args.rewardId, updates);

    await writeAdminAudit(ctx, actor._id, "update_reward", `reward:${args.rewardId}`, JSON.stringify(before), JSON.stringify(updates));

    return { success: true };
  },
});

export const archiveReward = mutation({
  args: { rewardId: v.id("rewardCatalogue") },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    await ctx.db.patch(args.rewardId, { status: "archived", updatedAt: Date.now(), updatedBy: actor._id });
    await writeAdminAudit(ctx, actor._id, "archive_reward", `reward:${args.rewardId}`);
    return { success: true };
  },
});

// ============================================
// REWARD REDEMPTION
// ============================================

export const claimReward = mutation({
  args: {
    rewardId: v.id("rewardCatalogue"),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) throw new Error("User not found");

    // Check idempotency
    const existing = await ctx.db
      .query("rewardRedemptions")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { status: "already_redeemed", redemptionId: existing._id };
    }

    const reward: any = await ctx.db.get(args.rewardId);
    if (!reward) throw new Error("Reward not found");
    if (reward.status !== "active") throw new Error("Reward is not available");
    if (reward.stockLimit && (reward.stockRemaining ?? 0) <= 0) throw new Error("Reward is out of stock");

    let balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!balance) {
      throw new Error("No reward balance found");
    }

    if (balance.availablePoints < reward.pointsCost) {
      throw new Error(`Insufficient points. You have ${balance.availablePoints} points, need ${reward.pointsCost}.`);
    }

    const pointsBefore = balance.availablePoints;
    const pointsAfter = pointsBefore - reward.pointsCost;

    // Deduct points
    await ctx.db.patch(balance._id, {
      availablePoints: pointsAfter,
      totalRedeemed: balance.totalRedeemed + reward.pointsCost,
      lastUpdatedAt: Date.now(),
    });

    // Record redemption
    const redemptionId: any = await ctx.db.insert("rewardRedemptions", {
      userId: user._id,
      rewardId: args.rewardId,
      rewardName: reward.name,
      rewardType: reward.type,
      pointsCost: reward.pointsCost,
      status: "pending",
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("rewardTransactions", {
      userId: user._id,
      type: "redeem_reward",
      description: `Redeemed: ${reward.name} (-${reward.pointsCost} points)`,
      amount: -reward.pointsCost,
      pointsBefore,
      pointsAfter,
      status: "completed",
      relatedRedemptionId: redemptionId,
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    });

    // Decrement stock
    if (reward.stockLimit) {
      await ctx.db.patch(args.rewardId, {
        stockRemaining: (reward.stockRemaining ?? 1) - 1,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      redemptionId,
      pointsCost: reward.pointsCost,
      pointsRemaining: pointsAfter,
      status: "pending",
      message: `Redemption request submitted for ${reward.name}. Points deducted. Pending fulfillment.`,
    };
  },
});

export const getUserRewardRedemptions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return [];

    const redemptions: any[] = await ctx.db
      .query("rewardRedemptions")
      .withIndex("by_user_created", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);

    return redemptions.map((r: any) => ({
      ...r,
      isDeduction: true,
    }));
  },
});

export const getRewardRedemptionsAdmin = query({
  args: { limit: v.optional(v.number()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let queryBuilder = ctx.db.query("rewardRedemptions").order("desc");

    if (args.status) {
      queryBuilder = queryBuilder.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const rows: any[] = await queryBuilder.take(args.limit ?? 100);

    // Attach a display label so admins can identify who is redeeming.
    return await Promise.all(
      rows.map(async (row: any) => {
        const user: any = row.userId ? await ctx.db.get(row.userId) : null;
        return {
          ...row,
          userName: user?.name || user?.username || user?.email || "Unknown user",
          userEmail: user?.email ?? null,
        };
      })
    );
  },
});

/**
 * Admin ledger view: recent reward transactions with the originating user.
 */
export const getRewardTransactionsAdmin = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const rows: any[] = await ctx.db
      .query("rewardTransactions")
      .order("desc")
      .take(Math.min(args.limit ?? 100, 200));

    return await Promise.all(
      rows.map(async (row: any) => {
        const user: any = row.userId ? await ctx.db.get(row.userId) : null;
        return {
          ...row,
          userName: user?.name || user?.username || user?.email || "Unknown user",
        };
      })
    );
  },
});

export const approveRedemption = mutation({
  args: { redemptionId: v.id("rewardRedemptions") },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const redemption: any = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");
    if (redemption.status !== "pending") throw new Error("Redemption is not pending");

    await ctx.db.patch(args.redemptionId, {
      status: "approved",
      updatedAt: Date.now(),
    });

    await writeAdminAudit(ctx, actor._id, "approve_redemption", `redemption:${args.redemptionId}`);

    return { success: true };
  },
});

export const fulfillRedemption = mutation({
  args: {
    redemptionId: v.id("rewardRedemptions"),
    fulfillmentReference: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const redemption: any = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");
    if (redemption.status !== "approved") throw new Error("Redemption is not approved");

    await ctx.db.patch(args.redemptionId, {
      status: "fulfilled",
      fulfillmentReference: args.fulfillmentReference,
      fulfilledAt: Date.now(),
      fulfilledBy: actor._id,
      updatedAt: Date.now(),
    });

    await writeAdminAudit(ctx, actor._id, "fulfill_redemption", `redemption:${args.redemptionId}`, undefined, args.fulfillmentReference);

    return { success: true };
  },
});

export const rejectRedemption = mutation({
  args: {
    redemptionId: v.id("rewardRedemptions"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const redemption: any = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");
    if (redemption.status !== "pending") throw new Error("Redemption is not pending");

    // Refund points
    const user = await ctx.db.get(redemption.userId);
    if (!user) throw new Error("User not found");

    let balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q: any) => q.eq("userId", redemption.userId))
      .first();

    if (balance) {
      const pointsBefore = balance.availablePoints;
      const pointsAfter = pointsBefore + redemption.pointsCost;

      await ctx.db.patch(balance._id, {
        availablePoints: pointsAfter,
        totalRedeemed: balance.totalRedeemed - redemption.pointsCost,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("rewardTransactions", {
        userId: redemption.userId,
        type: "redeem_reward",
        description: `Refunded: ${redemption.rewardName} (+${redemption.pointsCost} points)`,
        amount: redemption.pointsCost,
        pointsBefore,
        pointsAfter,
        status: "completed",
        relatedRedemptionId: redemption._id,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.redemptionId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      updatedAt: Date.now(),
    });

    await writeAdminAudit(ctx, actor._id, "reject_redemption", `redemption:${args.redemptionId}`, undefined, args.rejectionReason);

    return { success: true };
  },
});

// ============================================
// REFERRAL SYSTEM
// ============================================

export const getUserReferralCode = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return null;

    let referral: any = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!referral) {
      return {
        code: "",
        isActive: false,
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalPointsEarned: 0,
      };
    }

    return {
      code: referral.code,
      isActive: referral.isActive,
      totalReferrals: referral.totalReferrals,
      qualifiedReferrals: referral.qualifiedReferrals,
      totalPointsEarned: referral.totalPointsEarned,
    };
  },
});

function generateReferralCode(): string {
  // Avoid ambiguous characters (0/O, 1/I) so codes can be read aloud.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `LALAO-${suffix}`;
}

/**
 * Lazily create the signed-in user's referral code. Idempotent: returns the
 * existing code when one already exists.
 */
export const ensureMyReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) throw new Error("User not found");

    const existing: any = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { code: existing.code, isActive: existing.isActive, created: false };
    }

    // Collision odds are tiny, but verify against the unique index anyway.
    let code = generateReferralCode();
    let clash: any = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q: any) => q.eq("code", code))
      .first();
    let attempts = 0;
    while (clash && attempts < 5) {
      code = generateReferralCode();
      clash = await ctx.db
        .query("referralCodes")
        .withIndex("by_code", (q: any) => q.eq("code", code))
        .first();
      attempts++;
    }
    if (clash) throw new Error("Could not allocate a referral code. Please retry.");

    await ctx.db.insert("referralCodes", {
      userId: user._id,
      code,
      isActive: true,
      totalReferrals: 0,
      qualifiedReferrals: 0,
      totalPointsEarned: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { code, isActive: true, created: true };
  },
});

/**
 * Attach a referral code to the signed-in user. Called after signup when the
 * user arrived through a referral link. One referrer per user; self-referral
 * and unknown codes are rejected without revealing which codes exist.
 */
export const registerReferral = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) throw new Error("User not found");

    const normalized = (args.code || "").trim().toUpperCase();
    if (!normalized) return { status: "invalid_code" as const };

    const codeRow: any = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q: any) => q.eq("code", normalized))
      .first();

    if (!codeRow || !codeRow.isActive) return { status: "invalid_code" as const };
    if (codeRow.userId === user._id) return { status: "self_referral" as const };

    const existing: any = await ctx.db
      .query("referralRelationships")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", user._id))
      .first();

    if (existing) {
      return { status: "already_registered" as const, relationshipId: existing._id };
    }

    const qualificationRequirement =
      (await getRewardConfig(ctx, "referral_qualification")) || DEFAULT_REFERRAL_QUALIFICATION;

    const relationshipId: any = await ctx.db.insert("referralRelationships", {
      referrerId: codeRow.userId,
      referredUserId: user._id,
      referralCode: normalized,
      status: "registered",
      qualificationRequirement,
      rewardPoints: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(codeRow._id, {
      totalReferrals: codeRow.totalReferrals + 1,
      updatedAt: Date.now(),
    });

    // Some programs reward on signup, so qualify immediately in that case.
    if (qualificationRequirement === "registration") {
      await qualifyReferralInternal(ctx, {
        referredUserId: user._id,
        trigger: "registration",
      });
    }

    return { status: "registered" as const, relationshipId };
  },
});

export const getReferralRelationships = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return [];

    const relationships: any[] = await ctx.db
      .query("referralRelationships")
      .withIndex("by_referrer", (q: any) => q.eq("referrerId", user._id))
      .order("desc")
      .take(100);

    return relationships.map((r: any) => ({
      ...r,
    }));
  },
});

/**
 * Shared qualification routine: awards the referrer exactly once per referred
 * user. The configured qualification event decides when this may run.
 */
async function qualifyReferralInternal(
  ctx: any,
  params: { referredUserId: any; trigger: "purchase" | "wallet_topup" | "registration" }
) {
  const configured =
    (await getRewardConfig(ctx, "referral_qualification")) || DEFAULT_REFERRAL_QUALIFICATION;

  const requiredTrigger =
    configured === "registration"
      ? "registration"
      : configured === "wallet_topup"
      ? "wallet_topup"
      : "purchase";

  if (params.trigger !== requiredTrigger) {
    return { status: "not_qualified_yet" as const, requiredTrigger };
  }

  const relationship: any = await ctx.db
    .query("referralRelationships")
    .withIndex("by_referred", (q: any) => q.eq("referredUserId", params.referredUserId))
    .order("desc")
    .first();

  if (!relationship) return { status: "no_relationship" as const };
  if (relationship.status === "rewarded") return { status: "already_rewarded" as const };

  const rewardKey = `referral:${relationship._id}`;
  const existingTx = await ctx.db
    .query("rewardTransactions")
    .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", rewardKey))
    .first();
  if (existingTx) return { status: "already_rewarded" as const };

  const codeRow: any = await ctx.db
    .query("referralCodes")
    .withIndex("by_code", (q: any) => q.eq("code", relationship.referralCode))
    .first();

  if (!codeRow || !codeRow.isActive) return { status: "invalid_code" as const };
  if (codeRow.userId === params.referredUserId) return { status: "self_referral" as const };

  const referrer: any = await ctx.db.get(codeRow.userId);
  if (!referrer) return { status: "no_referrer" as const };

  const referralPoints = parseFloat(
    (await getRewardConfig(ctx, "referral_points")) || String(DEFAULT_REFERRAL_POINTS)
  );

  const balance: any = await getOrCreateRewardBalance(ctx, codeRow.userId);
  const pointsBefore = balance.availablePoints;
  const pointsAfter = pointsBefore + referralPoints;

  await ctx.db.patch(balance._id, {
    availablePoints: pointsAfter,
    lifetimePoints: balance.lifetimePoints + referralPoints,
    totalEarned: balance.totalEarned + referralPoints,
    lastUpdatedAt: Date.now(),
  });

  await ctx.db.patch(relationship._id, {
    status: "rewarded",
    qualificationRequirement: configured,
    qualificationCompletedAt: Date.now(),
    rewardAwardedAt: Date.now(),
    rewardPoints: referralPoints,
    updatedAt: Date.now(),
  });

  // Only qualified referrals are counted here; totalReferrals is incremented
  // when the relationship is registered.
  await ctx.db.patch(codeRow._id, {
    qualifiedReferrals: codeRow.qualifiedReferrals + 1,
    totalPointsEarned: codeRow.totalPointsEarned + referralPoints,
    updatedAt: Date.now(),
  });

  await ctx.db.insert("rewardTransactions", {
    userId: codeRow.userId,
    type: "earn_referral",
    description: `Referral reward: +${referralPoints} points`,
    amount: referralPoints,
    pointsBefore,
    pointsAfter,
    status: "completed",
    relatedReferralId: relationship._id,
    idempotencyKey: rewardKey,
    metadata: { source: "referral", trigger: params.trigger },
    createdAt: Date.now(),
  });

  return { status: "rewarded" as const, pointsAwarded: referralPoints, pointsBefore, pointsAfter };
}

/**
 * Legacy entry point: attaches the code (if not attached yet) and qualifies
 * immediately using the event named in `qualificationRequirement`.
 */
export const qualifyReferral = internalMutation({
  args: {
    referredUserId: v.id("users"),
    referralCode: v.string(),
    qualificationRequirement: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const codeRow: any = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q: any) => q.eq("code", args.referralCode))
      .first();

    if (!codeRow || !codeRow.isActive) throw new Error("Invalid or inactive referral code");
    if (codeRow.userId === args.referredUserId) throw new Error("Self-referral not allowed");

    const existing: any = await ctx.db
      .query("referralRelationships")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", args.referredUserId))
      .first();

    if (!existing) {
      await ctx.db.insert("referralRelationships", {
        referrerId: codeRow.userId,
        referredUserId: args.referredUserId,
        referralCode: args.referralCode,
        status: "registered",
        qualificationRequirement: args.qualificationRequirement,
        rewardPoints: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.patch(codeRow._id, {
        totalReferrals: codeRow.totalReferrals + 1,
        updatedAt: Date.now(),
      });
    } else if (existing.referralCode !== args.referralCode) {
      return { status: "different_referrer" as const };
    }

    const trigger =
      args.qualificationRequirement === "registration"
        ? "registration"
        : args.qualificationRequirement === "wallet_topup"
        ? "wallet_topup"
        : "purchase";

    return await qualifyReferralInternal(ctx, {
      referredUserId: args.referredUserId,
      trigger,
    });
  },
});

/**
 * Called after a qualifying event occurs (completed purchase or wallet
 * top-up). Cheap no-op when the user was not referred or already rewarded.
 */
export const qualifyReferralAfterEvent = internalMutation({
  args: {
    referredUserId: v.id("users"),
    trigger: v.union(v.literal("purchase"), v.literal("wallet_topup")),
  },
  handler: async (ctx, args) => {
    return await qualifyReferralInternal(ctx, {
      referredUserId: args.referredUserId,
      trigger: args.trigger,
    });
  },
});

// ============================================
// REWARD CONFIGURATION (Admin)
// ============================================

export const getRewardConfigAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("rewardConfiguration").take(100);
  },
});

export const updateRewardConfig = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("rewardConfiguration")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description ?? existing.description,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("rewardConfiguration", {
        key: args.key,
        value: args.value,
        description: args.description ?? "",
        updatedBy: actor._id,
        updatedAt: Date.now(),
      });
    }

    await writeAdminAudit(ctx, actor._id, "configure_earning", `config:${args.key}`, undefined, args.value);

    return { success: true };
  },
});

// ============================================
// ADMIN ANALYTICS
// ============================================

export const getRewardAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [balances, transactions, redemptions, referrals, catalogues] =
      await Promise.all([
        ctx.db.query("userRewardBalances").take(1000),
        ctx.db.query("rewardTransactions").take(1000),
        ctx.db.query("rewardRedemptions").take(1000),
        ctx.db.query("referralCodes").take(1000),
        ctx.db.query("rewardCatalogue").take(1000),
      ]);

    const totalPointsIssued = (balances as any[]).reduce((sum: number, b: any) => sum + b.totalEarned, 0);
    const availablePointsLiability = (balances as any[]).reduce((sum: number, b: any) => sum + b.availablePoints, 0);
    const pendingPoints = (balances as any[]).reduce((sum: number, b: any) => sum + b.pendingPoints, 0);
    const pointsRedeemed = (balances as any[]).reduce((sum: number, b: any) => sum + b.totalRedeemed, 0);

    const redemptionStats = (redemptions as any[]).reduce(
      (acc: any, r: any) => {
        acc.total++;
        if (r.status === "fulfilled") acc.fulfilled++;
        if (r.status === "pending") acc.pending++;
        if (r.status === "rejected") acc.rejected++;
        return acc;
      },
      { total: 0, fulfilled: 0, pending: 0, rejected: 0 }
    );

    const mostClaimed = (redemptions as any[]).reduce(
      (acc: any, r: any) => {
        acc[r.rewardName] = (acc[r.rewardName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topRewards = Object.entries(mostClaimed)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const totalReferrals = (referrals as any[]).reduce((sum: number, r: any) => sum + r.totalReferrals, 0);
    const qualifiedReferrals = (referrals as any[]).reduce((sum: number, r: any) => sum + r.qualifiedReferrals, 0);
    const referralPointsEarned = (referrals as any[]).reduce((sum: number, r: any) => sum + r.totalPointsEarned, 0);

    return {
      totalPointsIssued,
      availablePointsLiability,
      pendingPoints,
      pointsRedeemed,
      redemptions: redemptionStats,
      topRewards,
      totalReferrals,
      qualifiedReferrals,
      referralPointsEarned,
      activeRewards: (catalogues as any[]).filter((r: any) => r.status === "active").length,
      totalUsersWithBalances: (balances as any[]).length,
    };
  },
});

// ============================================
// HELPERS
// ============================================

async function requireAdmin(ctx: any, allowedRoles = ["super_admin", "admin", "editor"]) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const user = await getUserByAuthIdentity(ctx, identity);
  if (!user) throw new Error("User not found");

  const role = user.role;
  if (!role || !allowedRoles.includes(role)) {
    throw new Error(`Unauthorized: Requires one of: ${allowedRoles.join(", ")}`);
  }

  return user;
}

async function writeAdminAudit(
  ctx: any,
  actorId: any,
  action: string,
  target?: string,
  before?: string,
  after?: string
) {
  await ctx.db.insert("rewardAdminAudit", {
    actorId,
    action,
    target,
    before,
    after,
    createdAt: Date.now(),
  });
}