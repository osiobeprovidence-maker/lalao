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
    conversationId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    tag: v.optional(v.string()),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      type: v.optional(v.string()),
      placeholder: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, { recipientId, title, body, url, icon, badge, conversationId, messageId, tag, actions }) => {
    let pushDelivered = false;

    // 1. OneSignal REST API dispatch (preferred when ONESIGNAL_REST_API_KEY is configured)
    const oneSignalApiKey = process.env.ONESIGNAL_REST_API_KEY;
    const oneSignalAppId = process.env.ONESIGNAL_APP_ID || "0da46499-22a0-4035-8dfa-49f4395367da";

    if (oneSignalApiKey) {
      try {
        const defaultAppIcon = "/icon-192.png";
        const effectiveIcon = (icon && icon.trim().length > 0) ? icon.trim() : defaultAppIcon;
        const effectiveBadge = (badge && badge.trim().length > 0) ? badge.trim() : "/icon-192.png";

        const payload: Record<string, any> = {
          app_id: oneSignalAppId,
          target_channel: "push",
          include_aliases: {
            external_id: [recipientId.toString()],
          },
          headings: { en: title },
          contents: { en: body },
          url: url ?? "/app",
          web_url: url ?? "/app",
          chrome_web_icon: effectiveIcon,
          firefox_icon: effectiveIcon,
          chrome_web_badge: effectiveBadge,
          data: {
            url: url ?? "/app",
            conversationId,
            messageId,
          },
        };

        if (tag) {
          payload.web_push_topic = tag;
        }

        const authHeader = oneSignalApiKey.startsWith("os_v2_")
          ? `Key ${oneSignalApiKey}`
          : oneSignalApiKey.startsWith("Basic ") || oneSignalApiKey.startsWith("Key ")
            ? oneSignalApiKey
            : `Key ${oneSignalApiKey}`;

        const res = await fetch("https://api.onesignal.com/notifications?c=push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json() as any;
        const recipientsCount = typeof json?.recipients === "number" ? json.recipients : 0;
        const hasInvalidAliases = Boolean(json?.errors?.invalid_aliases);

        if (res.ok && json?.id && recipientsCount > 0 && !hasInvalidAliases) {
          pushDelivered = true;
          console.log(`[push] Successfully dispatched via OneSignal: id=${json.id}, recipients=${recipientsCount}`);
        } else {
          console.warn(`[push] OneSignal did not reach any subscriber: id=${json?.id ?? "none"}, recipients=${recipientsCount}, errors=${JSON.stringify(json?.errors ?? null)}. Falling back to native push if available.`);
        }
      } catch (osErr) {
        console.error("[push] OneSignal dispatch error:", osErr);
      }
    }

    // If OneSignal successfully reached device(s), prevent duplicate notifications
    if (pushDelivered) return;

    let webPushDelivered = false;

    // 2. Native Web Push (VAPID)
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
          icon: icon ?? "/icon-192.png",
          badge: badge ?? "/icon-192.png",
          tag: tag ?? (conversationId ? `chat-${conversationId}` : undefined),
          data: {
            url: url ?? "/",
            conversationId,
            messageId,
          },
          actions: actions ?? undefined,
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
            webPushDelivered = true;
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

    // Web Push already reached at least one device: skip the FCM fallback so
    // the same device does not receive a duplicate notification.
    if (webPushDelivered) return;

    // 2. Fallback to legacy FCM if tokens exist
    // NOTE: the legacy /fcm/send endpoint is deprecated by Google and may be
    // rejected; migrate to FCM HTTP v1 when service-account credentials exist.
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

    // Also record in in-app notifications
    await ctx.runMutation(internal.push.recordSystemNotification, {
      recipientId: userId,
      title: "Lalao Test Notification",
      body: "Push notifications are working perfectly on your device!",
    });

    await ctx.runAction(internal.pushActions.dispatchPush, {
      recipientId: userId,
      title: "Lalao Test Notification",
      body: "Push notifications are working perfectly on your device!",
      url: "/app/notifications",
    });
  },
});

export const broadcastTestNotification = action({
  args: {
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title ?? "Lalao Platform Announcement";
    const body = args.body ?? "Test notification to all users across all platforms! 🚀";
    const url = args.url ?? "/app/notifications";

    const userIds: any[] = await ctx.runQuery(internal.push.getAllUserIds, {});

    let dispatchedCount = 0;
    for (const userId of userIds) {
      try {
        // 1. Record in-app notification so user sees it in their Notifications tab
        await ctx.runMutation(internal.push.recordSystemNotification, {
          recipientId: userId,
          title,
          body,
        });

        // 2. Dispatch push to Web Push & FCM (mobile)
        await ctx.runAction(internal.pushActions.dispatchPush, {
          recipientId: userId,
          title,
          body,
          url,
        });
        dispatchedCount++;
      } catch (err) {
        console.error(`[push] Failed to broadcast to user ${userId}:`, err);
      }
    }

    return {
      success: true,
      totalUsers: userIds.length,
      dispatchedCount,
    };
  },
});

