import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all crypto wallets for the authenticated user.
 */
export const getCryptoWallets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return [];

    const wallets = await ctx.db
      .query("cryptoWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return wallets;
  },
});

/**
 * Save or update a crypto wallet connection for the authenticated user.
 * Upserts by wallet address — if the same address is reconnected, update instead of duplicate.
 */
export const saveCryptoWallet = mutation({
  args: {
    walletAddress: v.string(),
    provider: v.string(),
    network: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    // Normalize address to lowercase for consistent lookups
    const normalizedAddress = args.walletAddress.toLowerCase();

    // Check for existing wallet with same address for this user
    const existingWallets = await ctx.db
      .query("cryptoWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const existing = existingWallets.find(
      (w) => w.walletAddress.toLowerCase() === normalizedAddress
    );

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        isConnected: true,
        provider: args.provider,
        network: args.network,
        lastConnectedAt: Date.now(),
      });
      return { success: true, walletId: existing._id, action: "updated" };
    }

    // Create new
    const walletId = await ctx.db.insert("cryptoWallets", {
      userId: user._id,
      walletAddress: normalizedAddress,
      provider: args.provider,
      network: args.network,
      isConnected: true,
      lastConnectedAt: Date.now(),
    });

    return { success: true, walletId, action: "created" };
  },
});

/**
 * Mark a crypto wallet as disconnected.
 */
export const disconnectCryptoWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const normalizedAddress = args.walletAddress.toLowerCase();

    const wallets = await ctx.db
      .query("cryptoWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const wallet = wallets.find(
      (w) => w.walletAddress.toLowerCase() === normalizedAddress
    );

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        isConnected: false,
      });
    }

    return { success: true };
  },
});

/**
 * Remove a crypto wallet record entirely.
 */
export const removeCryptoWallet = mutation({
  args: {
    walletId: v.id("cryptoWallets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      throw new Error("Wallet not found or not authorized");
    }

    await ctx.db.delete(args.walletId);
    return { success: true };
  },
});
