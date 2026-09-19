import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   TOKEN MANAGEMENT  (called from the frontend)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Upsert an FCM registration token for the current user/device.
 * If the token already exists for this user, update the timestamp.
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
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Check if this exact token already exists for this user
    const existing = await ctx.db
      .query("fcmTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
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
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Check whether the current user has any active FCM tokens registered.
 */
export const hasActivePushToken = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return false;

    const token = await ctx.db
      .query("fcmTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return token !== null;
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL TOKEN HELPERS (used by the dispatch action)
   ───────────────────────────────────────────────────────────────────────────── */

export const getTokensForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("fcmTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const deleteStaleToken = internalMutation({
  args: { tokenId: v.id("fcmTokens") },
  handler: async (ctx, { tokenId }) => {
    await ctx.db.delete(tokenId);
  },
});
