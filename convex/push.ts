import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   TOKEN MANAGEMENT (called from the frontend)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Upsert a native Web Push subscription for the current user/device.
 * Supports multiple active tokens/devices per user.
 */
export const upsertWebPushSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { endpoint, p256dh, auth, userAgent }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user._id,
        p256dh,
        auth,
        userAgent: userAgent ?? existing.userAgent,
        updatedAt: now,
        isActive: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint,
      p256dh,
      auth,
      userAgent,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      provider: "web_push",
    });
  },
});

/**
 * Upsert an FCM registration token for the current user/device (Legacy/Fallback).
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
 * Check whether the current user has any active push subscriptions.
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

      const webPushSub = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .first();
        
      if (webPushSub) return true;

      const fcmToken = await ctx.db
        .query("fcmTokens")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      return fcmToken !== null;
    } catch (err) {
      console.warn("[push] hasActivePushToken query error:", err);
      return false;
    }
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL TOKEN HELPERS (used by the dispatch action)
   ───────────────────────────────────────────────────────────────────────────── */

export const getWebPushSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();
  },
});

export const getFcmTokensForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("fcmTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const markWebPushSubscriptionInactive = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    const existing = await ctx.db.get(subscriptionId);
    if (existing) {
      await ctx.db.patch(subscriptionId, { isActive: false, updatedAt: Date.now() });
    }
  },
});

export const deleteStaleToken = internalMutation({
  args: { tokenId: v.id("fcmTokens") },
  handler: async (ctx, { tokenId }) => {
    const existing = await ctx.db.get(tokenId);
    if (existing) {
      await ctx.db.delete(tokenId);
    }
  },
});

export const getUserIdFromIdentity = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
    return user?._id ?? null;
  },
});

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendWebPush = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    conversationId: v.optional(v.string()),
    postId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscriptions: any[] = await ctx.runQuery(internal.push.getWebPushSubscriptionsForUser, { userId: args.userId }) || [];
    
    if (subscriptions.length === 0) return;

    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn("VAPID keys not configured");
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@lalao.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      data: {
        url: args.url,
        conversationId: args.conversationId,
        postId: args.postId,
      },
    });

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired
          await ctx.runMutation(internal.push.markWebPushSubscriptionInactive, { subscriptionId: sub._id });
        } else {
          console.error("Error sending push notification", err);
        }
      }
    }
  },
});
