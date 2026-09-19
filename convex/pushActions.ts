"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api.js";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   FCM DISPATCH  (internal — called from social.ts / subscriptions.ts)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Send a native push notification to all FCM-registered devices for a user.
 *
 * Called via: ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, { ... })
 *
 * Requires the following Convex environment variable:
 *   FIREBASE_SERVER_KEY  — legacy server key from Firebase console
 *                          (Project Settings → Cloud Messaging → Server key)
 */
export const dispatchPush = internalAction({
  args: {
    recipientId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { recipientId, title, body, url }) => {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      console.warn("[push] FIREBASE_SERVER_KEY not set — skipping push dispatch.");
      return;
    }

    // Fetch tokens using internal query
    const tokenRows: any[] = await ctx.runQuery(internal.push.getTokensForUser, {
      userId: recipientId,
    });

    if (!tokenRows || tokenRows.length === 0) return;

    const staleIds: string[] = [];

    for (const row of tokenRows) {
      try {
        const payload = {
          to: row.token,
          notification: {
            title,
            body,
            icon: "/mascot.png",
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

        // Handle stale tokens
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
        console.error("[push] Error sending push to token", row.token, err);
      }
    }

    // Clean up stale tokens
    for (const id of staleIds) {
      await ctx.runMutation(internal.push.deleteStaleToken, { tokenId: id as any });
    }
  },
});
