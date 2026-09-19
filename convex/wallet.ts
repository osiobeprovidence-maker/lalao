import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or get user's wallet
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to getWallet");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return wallet;
  },
});

export const initializeWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: user._id,
        balance: 0,
        currency: "NGN",
        accountNumber: "8" + Math.floor(100000000 + Math.random() * 900000000).toString(), // mock v-account
        accountName: user.name || "Lalao User",
        bankName: "Lalao Bank",
        updatedAt: Date.now(),
      });
      wallet = await ctx.db.get(walletId);
    }
    return wallet;
  },
});

// Top up wallet
export const topUp = mutation({
  args: {
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) throw new Error("Wallet not found. Please initialize wallet first.");

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: args.amount,
      type: "deposit",
      status: "completed",
      description: `Wallet Top-Up via ${args.method}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance: wallet.balance + args.amount };
  },
});

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return transactions;
  },
});
