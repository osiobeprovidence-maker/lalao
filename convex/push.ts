import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   TOKEN MANAGEMENT (called from the frontend)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Upsert an FCM registration token for the current user/device.
 * Supports multiple active tokens/devices per user.
 */
export const upsertFcmToken = mutation({
  args: {
    token: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { token, userAgent }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Check if this exact token already exists
    const existing = await ctx.db
      .query("fcmTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user._id,
        userAgent: userAgent ?? existing.userAgent,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("fcmTokens", {
      userId: user._id,
      token,
      userAgent,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Remove an FCM token (called on logout or when the user disables push).
 */
export const removeFcmToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("fcmTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Check whether the current user has any active FCM tokens registered.
 * Safe for unauthenticated users (returns false).
 */
export const hasActivePushToken = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return false;

      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
      if (!user) return false;

      const token = await ctx.db
        .query("fcmTokens")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      return token !== null;
    } catch (err) {
      console.warn("[push] hasActivePushToken query error:", err);
      return false;
    }
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL TOKEN HELPERS (used by the dispatch action)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Retrieve all active push tokens for a user (used by FCM push dispatch).
 */
export const getTokensForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("fcmTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Deactivate/delete a stale or invalid FCM token after send failure.
 */
export const deleteStaleToken = internalMutation({
  args: { tokenId: v.id("fcmTokens") },
  handler: async (ctx, { tokenId }) => {
    const existing = await ctx.db.get(tokenId);
    if (existing) {
      await ctx.db.delete(tokenId);
    }
  },
});
