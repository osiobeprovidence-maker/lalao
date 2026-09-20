"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api.js";
import { v } from "convex/values";
import webpush from "web-push";

/* ─────────────────────────────────────────────────────────────────────────────
   WEB PUSH / FCM DISPATCH (internal)
   ───────────────────────────────────────────────────────────────────────────── */

export const dispatchPush = internalAction({
  args: {
    recipientId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
  },
  handler: async (ctx, { recipientId, title, body, url, icon, badge }) => {
    // 1. Native Web Push
    const webPushSubs: any[] = await ctx.runQuery(internal.push.getWebPushSubscriptionsForUser, {
      userId: recipientId,
    });

    if (webPushSubs && webPushSubs.length > 0) {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      if (publicKey && privateKey) {
        webpush.setVapidDetails(
          "mailto:support@lalao.app", // standard VAPID subject
          publicKey,
          privateKey
        );

        const payload = JSON.stringify({
          title,
          body,
          url: url ?? "/",
          icon: icon ?? "/mascot.png",
          badge: badge ?? "/mascot.png",
          notificationId: Math.random().toString(36).substring(7),
        });

        for (const sub of webPushSubs) {
          try {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            await webpush.sendNotification(pushSubscription, payload);
          } catch (err: any) {
            console.error("[push] Error sending native Web Push:", err);
            // If the endpoint is gone or unsubscribed (status 404 or 410)
            if (err.statusCode === 404 || err.statusCode === 410) {
              await ctx.runMutation(internal.push.markWebPushSubscriptionInactive, {
                subscriptionId: sub._id,
              });
            }
          }
        }
      } else {
        console.warn("[push] VAPID keys not configured in Convex Environment.");
      }
    }

    // 2. Fallback to legacy FCM if tokens exist
    const fcmTokens: any[] = await ctx.runQuery(internal.push.getFcmTokensForUser, {
      userId: recipientId,
    });

    if (fcmTokens && fcmTokens.length > 0) {
      const serverKey = process.env.FIREBASE_SERVER_KEY;
      if (!serverKey) {
        // FCM tokens exist, but no server key configured.
        return;
      }

      const staleIds: string[] = [];

      for (const row of fcmTokens) {
        try {
          const payload = {
            to: row.token,
            notification: {
              title,
              body,
              icon: icon ?? "/mascot.png",
              click_action: url ?? "/",
            },
            data: {
              url: url ?? "/",
            },
            webpush: {
              fcm_options: {
                link: url ?? "/",
              },
            },
          };

          const res = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${serverKey}`,
            },
            body: JSON.stringify(payload),
          });

          const json = await res.json() as any;
          if (json.failure && json.results) {
            for (const result of json.results) {
              if (
                result.error === "NotRegistered" ||
                result.error === "InvalidRegistration"
              ) {
                staleIds.push(row._id);
              }
            }
          }
        } catch (err) {
          console.error("[push] Error sending push to FCM token", row.token, err);
        }
      }

      for (const id of staleIds) {
        await ctx.runMutation(internal.push.deleteStaleToken, { tokenId: id as any });
      }
    }
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN & TESTING
   ───────────────────────────────────────────────────────────────────────────── */

export const sendTestNotification = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await ctx.runQuery(internal.push.getUserIdFromIdentity, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    
    if (!userId) throw new Error("User not found");

    await ctx.runAction(internal.pushActions.dispatchPush, {
      recipientId: userId,
      title: "Lalao Test Notification",
      body: "Push notifications are working.",
      url: "/app/notifications",
    });
  },
});
