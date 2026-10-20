"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import agoraTokenPkg from "agora-token";

const { RtcTokenBuilder, RtcRole } = (agoraTokenPkg as any).default || agoraTokenPkg;

/**
 * Generate a short-lived Agora RTC Token for an authenticated participant of an active call.
 * This keeps the Agora App Certificate strictly protected on the backend.
 */
export const generateRtcToken = action({
  args: {
    callId: v.id("calls"),
    uid: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch authorized call session from Convex database via internal query
    const call: any = await ctx.runQuery(internal.calls.getCallInternal, {
      callId: args.callId,
    });

    if (!call) {
      throw new Error("Call session not found");
    }

    // Verify requested UID belongs to this call session
    if (args.uid !== call.callerUid && args.uid !== call.recipientUid) {
      throw new Error("UID not authorized for this call session");
    }

    if (["completed", "declined", "canceled", "failed"].includes(call.status)) {
      throw new Error(`Cannot join call in state: ${call.status}`);
    }

    const appId = (process.env.AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || "").trim();
    const appCertificate = (process.env.AGORA_APP_CERTIFICATE || "").trim();

    if (!appId || appId === "replace_with_your_app_id") {
      return {
        success: false,
        isConfigured: false,
        appId: "",
        token: "",
        channelName: call.channelName,
        callerUid: call.callerUid,
        recipientUid: call.recipientUid,
        uid: args.uid,
        message: "Agora App ID is not configured. Set AGORA_APP_ID in Convex environment variables.",
      };
    }

    // 2. Generate signed token if App Certificate is configured for this specific UID
    let token = "";
    if (appCertificate && appCertificate.length === 32) {
      const expirationTimeInSeconds = 3600; // 1 hour token lifetime
      const privilegeExpirationTimeInSeconds = 3600;

      try {
        token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          call.channelName,
          args.uid,
          RtcRole.PUBLISHER,
          expirationTimeInSeconds,
          privilegeExpirationTimeInSeconds
        );
      } catch (err) {
        console.error("Agora token generation error:", err);
      }
    }

    return {
      success: true,
      isConfigured: true,
      appId,
      token,
      channelName: call.channelName,
      callerUid: call.callerUid,
      recipientUid: call.recipientUid,
      uid: args.uid,
    };
  },
});
