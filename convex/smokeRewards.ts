import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * TEMPORARY smoke test helpers for the rewards ledger. These are deleted after
 * verification; they never run in normal app flows.
 */

/** Award + idempotency + cleanup, all in one transaction. */
export const run = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const key = `smoke:${Date.now()}`;

    const before: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const first: any = await ctx.runMutation(internal.rewards.awardPurchasePoints, {
      userId: args.userId,
      eligibleAmountUsd: 10,
      idempotencyKey: key,
    });

    const second: any = await ctx.runMutation(internal.rewards.awardPurchasePoints, {
      userId: args.userId,
      eligibleAmountUsd: 10,
      idempotencyKey: key,
    });

    const after: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const txs: any[] = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", key))
      .collect();

    // Restore the ledger exactly as it was.
    for (const tx of txs) await ctx.db.delete(tx._id);

    if (before) {
      await ctx.db.patch(before._id, {
        availablePoints: before.availablePoints,
        lifetimePoints: before.lifetimePoints,
        totalEarned: before.totalEarned,
        lastUpdatedAt: Date.now(),
      });
    } else if (after) {
      await ctx.db.delete(after._id);
    }

    const remaining: any[] = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", key))
      .collect();

    return {
      awaitedPoints: first.points,
      duplicateStatus: second.status,
      duplicatePoints: second.points,
      balanceBefore: before?.availablePoints ?? 0,
      balanceAfterAward: after?.availablePoints ?? 0,
      txRowsCreated: txs.length,
      cleanedUp: remaining.length === 0,
    };
  },
});

/** Award points so a redemption flow can be exercised via the public API. */
export const grant = internalMutation({
  args: {
    userId: v.id("users"),
    eligibleAmountUsd: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation(internal.rewards.awardPurchasePoints, {
      userId: args.userId,
      eligibleAmountUsd: args.eligibleAmountUsd,
      idempotencyKey: args.idempotencyKey,
    });
  },
});

/** Remove everything created by the redemption smoke test. */
export const cleanupRedemption = internalMutation({
  args: {
    userId: v.id("users"),
    awardKey: v.string(),
    rewardId: v.optional(v.id("rewardCatalogue")),
    redemptionIds: v.optional(v.array(v.id("rewardRedemptions"))),
    deleteBalance: v.boolean(),
  },
  handler: async (ctx, args) => {
    const txs: any[] = await ctx.db
      .query("rewardTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let deletedTxs = 0;
    for (const tx of txs) {
      const key: string = tx.idempotencyKey ?? "";
      const belongsToSmokeRedemption =
        tx.relatedRedemptionId && (args.redemptionIds ?? []).includes(tx.relatedRedemptionId);
      if (key === args.awardKey || key.startsWith("smoke_redeem:") || belongsToSmokeRedemption) {
        await ctx.db.delete(tx._id);
        deletedTxs++;
      }
    }

    for (const redemptionId of args.redemptionIds ?? []) {
      const redemption = await ctx.db.get(redemptionId);
      if (redemption) await ctx.db.delete(redemptionId);
    }

    if (args.rewardId) {
      const reward = await ctx.db.get(args.rewardId);
      if (reward) await ctx.db.delete(args.rewardId);
    }

    // Remove audit entries produced by this smoke test.
    const auditRows: any[] = await ctx.db.query("rewardAdminAudit").collect();
    let deletedAudit = 0;
    for (const row of auditRows) {
      const target: string = row.target ?? "";
      const matchesReward = !!args.rewardId && target.includes(args.rewardId);
      const matchesRedemption = (args.redemptionIds ?? []).some((id) => target.includes(id));
      if (matchesReward || matchesRedemption) {
        await ctx.db.delete(row._id);
        deletedAudit++;
      }
    }

    const balance: any = await ctx.db
      .query("userRewardBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (balance) {
      if (args.deleteBalance) {
        await ctx.db.delete(balance._id);
      } else {
        await ctx.db.patch(balance._id, {
          availablePoints: 0,
          lifetimePoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          lastUpdatedAt: Date.now(),
        });
      }
    }

    return { deletedTxs, deletedBalance: !!balance, deletedAudit };
  },
});
