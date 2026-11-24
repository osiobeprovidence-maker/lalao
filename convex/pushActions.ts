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
    category: v.optional(v.string()),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      type: v.optional(v.string()),
      placeholder: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, { recipientId, title, body, url, icon, badge, conversationId, messageId, tag, category, actions }) => {
    // Check recipient user existence and notification preferences
    const recipient: any = await ctx.runQuery(internal.push.getRecipientForPush, {
      userId: recipientId,
    });
    if (!recipient) return;

    const prefs = recipient.notificationPrefs;
    if (prefs) {
      if (prefs.desktop === false) {
        return; // User disabled all push/desktop notifications
      }
      const cat = category || (conversationId ? 'messages' : undefined);
      if (cat && (prefs as any)[cat] === false) {
        return; // Specific category (messages, follows, likes, etc.) disabled by user
      }
    }

    let pushDelivered = false;

    // 1. OneSignal REST API dispatch (preferred when ONESIGNAL_REST_API_KEY is configured)
    const oneSignalApiKey = process.env.ONESIGNAL_REST_API_KEY;
    const oneSignalAppId = process.env.ONESIGNAL_APP_ID;

    if (oneSignalApiKey && oneSignalAppId) {
      try {
        const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website";
        const defaultAppIcon = `${baseUrl}/icon-192.png`;
        const makeAbsoluteUrl = (pathOrUrl?: string) => {
          if (!pathOrUrl) return undefined;
          const trimmed = pathOrUrl.trim();
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
          return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
        };

        const effectiveIcon = icon ? makeAbsoluteUrl(icon) : defaultAppIcon;
        const effectiveBadge = badge ? makeAbsoluteUrl(badge) : `${baseUrl}/icon-192.png`;
        const targetFullUrl = makeAbsoluteUrl(url ?? "/app");

        const payload: Record<string, any> = {
          app_id: oneSignalAppId,
          target_channel: "push",
          include_aliases: {
            external_id: [recipientId.toString()],
          },
          headings: { en: title },
          contents: { en: body },
          url: targetFullUrl,
          web_url: targetFullUrl,
          chrome_web_icon: effectiveIcon,
          firefox_icon: effectiveIcon,
          chrome_web_badge: effectiveBadge,
          data: {
            url: url ?? "/app",
            conversationId,
            messageId,
          },
        };

        const effectiveTag = tag ?? (messageId ? `msg-${messageId}` : conversationId ? `chat-${conversationId}-${Date.now()}` : undefined);

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

        // Unique tag ensures every incoming message gets its own OS notification popup/slot,
        // preventing subsequent messages from replacing prior visible popups.
        const uniqueNotificationTag = tag ?? (messageId ? `msg-${messageId}` : conversationId ? `chat-${conversationId}-${Date.now()}` : undefined);

        const payload = JSON.stringify({
          title,
          body,
          url: url ?? "/",
          icon: icon ?? "/icon-192.png",
          badge: badge ?? "/icon-192.png",
          tag: uniqueNotificationTag,
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

    // 2. Deliver via Firebase Cloud Messaging HTTP v1 API
    const fcmTokens: any[] = await ctx.runQuery(internal.push.getFcmTokensForUser, {
      userId: recipientId,
    });

    if (fcmTokens && fcmTokens.length > 0) {
      const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountRaw) {
        console.warn("[push] FCM tokens exist, but FIREBASE_SERVICE_ACCOUNT_JSON is not configured on Convex.");
        return;
      }

      let accessToken: string | null = null;
      let projectId = "uselalaoapp";
      try {
        const sa = JSON.parse(serviceAccountRaw) as {
          project_id?: string;
          client_email: string;
          private_key: string;
        };
        if (sa.project_id) projectId = sa.project_id;

        const nowSec = Math.floor(Date.now() / 1000);
        const toBase64Url = (input: string | Buffer) =>
          Buffer.from(input)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");

        const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const claimSet = toBase64Url(
          JSON.stringify({
            iss: sa.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token",
            iat: nowSec,
            exp: nowSec + 3600,
          })
        );
        const unsignedJwt = `${header}.${claimSet}`;
        const { createSign } = await import("crypto");
        const signer = createSign("RSA-SHA256");
        signer.update(unsignedJwt);
        signer.end();
        const signature = toBase64Url(signer.sign(sa.private_key));
        const assertion = `${unsignedJwt}.${signature}`;

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
          }),
        });
        const tokenJson = (await tokenRes.json()) as { access_token?: string };
        accessToken = tokenJson.access_token ?? null;
      } catch (err) {
        console.error("[push] Failed to mint FCM HTTP v1 OAuth2 token:", err);
        return;
      }

      if (!accessToken) return;

      const staleIds: string[] = [];
      const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      for (const row of fcmTokens) {
        try {
          const payload = {
            message: {
              token: row.token,
              notification: {
                title,
                body,
              },
              data: {
                url: url ?? "/app",
              },
              webpush: {
                notification: {
                  icon: icon ?? "/icon-192.png",
                  badge: "/icon-192.png",
                },
                fcm_options: {
                  link: url ?? "/app",
                },
              },
            },
          };

          const res = await fetch(fcmEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errJson = (await res.json().catch(() => ({}))) as any;
            const errCode = errJson?.error?.details?.[0]?.errorCode || errJson?.error?.status;
            if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT" || res.status === 404) {
              staleIds.push(row._id);
            } else {
              console.error("[push] FCM HTTP v1 send failed:", res.status, errJson);
            }
          }
        } catch (err) {
          console.error("[push] Error sending FCM HTTP v1 push:", err);
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

