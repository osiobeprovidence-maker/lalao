import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

export function formatCallDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0 sec";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs.toString().padStart(2, "0")} sec`;
}

/**
 * Internal query for actions to safely retrieve a call session.
 */
export const getCallInternal = internalQuery({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.callId);
  },
});

/**
 * Initiate an outgoing voice or video call.
 */
export const initiateCall = mutation({
  args: {
    recipientId: v.union(v.id("users"), v.string()),
    type: v.union(v.literal("voice"), v.literal("video")),
    conversationId: v.optional(v.id("conversations")),
    callerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.callerUserId) {
      const normCaller = ctx.db.normalizeId("users", args.callerUserId);
      if (normCaller) {
        currentUser = await ctx.db.get(normCaller);
      }
    }
    if (!currentUser) throw new Error("Not authenticated");

    const normRecipientId = ctx.db.normalizeId("users", args.recipientId);
    if (!normRecipientId) {
      throw new Error("Invalid recipient ID");
    }

    if (currentUser._id === normRecipientId) {
      throw new Error("You cannot call yourself");
    }

    const recipient = await ctx.db.get(normRecipientId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    const now = Date.now();

    // Clean up any stale ringing calls for recipient or caller (> 45s timeout)
    const staleCalls = await ctx.db
      .query("calls")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", normRecipientId).eq("status", "ringing")
      )
      .collect();

    for (const call of staleCalls) {
      if (now - call.startedAt > 45000) {
        await ctx.db.patch(call._id, {
          status: "missed",
          endedAt: now,
          endReason: "timeout_no_answer",
        });
      }
    }

    const callerStaleCalls = await ctx.db
      .query("calls")
      .withIndex("by_caller_status", (q) =>
        q.eq("callerId", currentUser._id).eq("status", "ringing")
      )
      .collect();

    for (const call of callerStaleCalls) {
      if (now - call.startedAt > 45000) {
        await ctx.db.patch(call._id, {
          status: "canceled",
          endedAt: now,
          endReason: "timeout_canceled",
        });
      }
    }

    // Check if recipient is in an active call
    const recipientActiveIncoming = await ctx.db
      .query("calls")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", normRecipientId).eq("status", "ringing")
      )
      .first();

    const recipientActiveConnected = await ctx.db
      .query("calls")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", normRecipientId).eq("status", "connected")
      )
      .first();

    const recipientActiveOutgoing = await ctx.db
      .query("calls")
      .withIndex("by_caller_status", (q) =>
        q.eq("callerId", normRecipientId).eq("status", "connected")
      )
      .first();

    if (recipientActiveIncoming || recipientActiveConnected || recipientActiveOutgoing) {
      return { success: false, reason: "busy", message: "User is currently in another call" };
    }

    // Check if caller is already in an active connected call
    const callerActive = await ctx.db
      .query("calls")
      .withIndex("by_caller_status", (q) =>
        q.eq("callerId", currentUser._id).eq("status", "connected")
      )
      .first();
    if (callerActive) {
      return { success: false, reason: "already_in_call", message: "You are already on a call" };
    }

    // Generate unique channel name and numeric UIDs (within safe 32-bit positive integer range)
    const callerUid = Math.floor(100000 + Math.random() * 899999);
    let recipientUid = Math.floor(100000 + Math.random() * 899999);
    if (recipientUid === callerUid) recipientUid += 1;

    const channelName = `lalao_call_${now}_${Math.floor(1000 + Math.random() * 9000)}`;

    const callId = await ctx.db.insert("calls", {
      callerId: currentUser._id,
      recipientId: normRecipientId,
      conversationId: args.conversationId,
      type: args.type,
      status: "ringing",
      channelName,
      callerUid,
      recipientUid,
      startedAt: now,
    });

    // Notify recipient of incoming call
    await ctx.db.insert("notifications", {
      recipientId: normRecipientId,
      actorId: currentUser._id,
      type: "incoming_call",
      conversationId: args.conversationId,
      targetExcerpt: `${args.type === "video" ? "Video" : "Voice"} call`,
      isRead: false,
      createdAt: now,
    });

    // Schedule background Web Push notification if recipient is offline / backgrounded
    try {
      await ctx.scheduler.runAfter(0, (internal as any).pushActions.dispatchPush, {
        recipientId: normRecipientId,
        title: `Incoming ${args.type === "video" ? "Video" : "Voice"} Call`,
        body: `${currentUser.name || "A Lalao user"} is calling you...`,
        url: `/app/messages`,
        icon: currentUser.avatarUrl || "/mascot.png",
      });
    } catch (_) {}

    return {
      success: true,
      callId,
      channelName,
      callerUid,
      recipientUid,
    };
  },
});

/**
 * Accept an incoming call.
 */
export const acceptCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.userId) {
      const norm = ctx.db.normalizeId("users", args.userId);
      if (norm) currentUser = await ctx.db.get(norm);
    }
    if (!currentUser) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("Call session not found");

    if (call.recipientId !== currentUser._id) {
      throw new Error("Not authorized to accept this call");
    }

    if (call.status !== "ringing" && call.status !== "calling") {
      return { success: false, message: `Call is already ${call.status}` };
    }

    const now = Date.now();
    await ctx.db.patch(args.callId, {
      status: "connected",
      connectedAt: now,
    });

    return { success: true };
  },
});

/**
 * Decline an incoming call.
 */
export const declineCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.userId) {
      const norm = ctx.db.normalizeId("users", args.userId);
      if (norm) currentUser = await ctx.db.get(norm);
    }
    if (!currentUser) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("Call session not found");

    if (call.recipientId !== currentUser._id && call.callerId !== currentUser._id) {
      throw new Error("Not authorized for this call");
    }

    if (["completed", "declined", "canceled", "missed"].includes(call.status)) {
      return { success: true };
    }

    const now = Date.now();
    await ctx.db.patch(args.callId, {
      status: "declined",
      endedAt: now,
      endReason: "declined_by_recipient",
    });

    // Persist system call record in conversation if linked
    if (call.conversationId) {
      const typeLabel = call.type === "video" ? "video" : "voice";
      await ctx.db.insert("messages", {
        conversationId: call.conversationId,
        senderId: call.callerId,
        text: `Declined ${typeLabel} call`,
        type: "call",
        callId: call._id,
        callType: call.type,
        callStatus: "declined",
        isRead: false,
        createdAt: now,
      });

      await ctx.db.patch(call.conversationId, {
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Cancel an outgoing call before it is answered.
 */
export const cancelCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.userId) {
      const norm = ctx.db.normalizeId("users", args.userId);
      if (norm) currentUser = await ctx.db.get(norm);
    }
    if (!currentUser) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("Call session not found");

    if (call.callerId !== currentUser._id) {
      throw new Error("Only the caller can cancel this call");
    }

    if (["completed", "declined", "canceled", "missed"].includes(call.status)) {
      return { success: true };
    }

    const now = Date.now();
    await ctx.db.patch(args.callId, {
      status: "canceled",
      endedAt: now,
      endReason: "canceled_by_caller",
    });

    // Persist missed call record in conversation
    if (call.conversationId) {
      const icon = call.type === "video" ? "📹" : "📞";
      const typeLabel = call.type === "video" ? "video" : "voice";
      await ctx.db.insert("messages", {
        conversationId: call.conversationId,
        senderId: call.callerId,
        text: `${icon} Missed ${typeLabel} call`,
        type: "call",
        callId: call._id,
        callType: call.type,
        callStatus: "missed",
        isRead: false,
        createdAt: now,
      });

      await ctx.db.patch(call.conversationId, {
        updatedAt: now,
      });
    }

    // Add missed call notification for recipient
    await ctx.db.insert("notifications", {
      recipientId: call.recipientId,
      actorId: currentUser._id,
      type: "missed_call",
      conversationId: call.conversationId,
      targetExcerpt: `Missed ${call.type} call`,
      isRead: false,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * End an ongoing or active call session.
 */
export const endCall = mutation({
  args: {
    callId: v.id("calls"),
    reason: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.userId) {
      const norm = ctx.db.normalizeId("users", args.userId);
      if (norm) currentUser = await ctx.db.get(norm);
    }
    if (!currentUser) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("Call session not found");

    if (call.callerId !== currentUser._id && call.recipientId !== currentUser._id) {
      throw new Error("Not authorized to end this call");
    }

    if (["completed", "declined", "canceled", "missed"].includes(call.status)) {
      return { success: true, duration: call.duration || 0 };
    }

    const now = Date.now();
    let duration = 0;
    if (call.connectedAt) {
      duration = Math.max(1, Math.round((now - call.connectedAt) / 1000));
    }

    await ctx.db.patch(args.callId, {
      status: "completed",
      endedAt: now,
      duration,
      endReason: args.reason || "user_hung_up",
    });

    // Record call log message in the conversation
    if (call.conversationId) {
      const icon = call.type === "video" ? "📹" : "📞";
      const typeLabel = call.type === "video" ? "Video call" : "Voice call";
      const durText = formatCallDuration(duration);

      await ctx.db.insert("messages", {
        conversationId: call.conversationId,
        senderId: call.callerId,
        text: `${icon} ${typeLabel} · ${durText}`,
        type: "call",
        callId: call._id,
        callType: call.type,
        callDuration: duration,
        callStatus: "completed",
        isRead: false,
        createdAt: now,
      });

      await ctx.db.patch(call.conversationId, {
        updatedAt: now,
      });
    }

    return { success: true, duration };
  },
});

/**
 * Handle call ringing timeout (e.g. caller rang for > 45s with no answer).
 */
export const checkCallTimeout = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return { timedOut: false };

    const now = Date.now();
    if ((call.status === "ringing" || call.status === "calling") && now - call.startedAt > 45000) {
      await ctx.db.patch(args.callId, {
        status: "missed",
        endedAt: now,
        endReason: "timeout_no_answer",
      });

      if (call.conversationId) {
        const icon = call.type === "video" ? "📹" : "📞";
        const typeLabel = call.type === "video" ? "video" : "voice";
        await ctx.db.insert("messages", {
          conversationId: call.conversationId,
          senderId: call.callerId,
          text: `${icon} Missed ${typeLabel} call`,
          type: "call",
          callId: call._id,
          callType: call.type,
          callStatus: "missed",
          isRead: false,
          createdAt: now,
        });

        await ctx.db.patch(call.conversationId, {
          updatedAt: now,
        });
      }

      await ctx.db.insert("notifications", {
        recipientId: call.recipientId,
        actorId: call.callerId,
        type: "missed_call",
        conversationId: call.conversationId,
        targetExcerpt: `Missed ${call.type} call`,
        isRead: false,
        createdAt: now,
      });

      return { timedOut: true };
    }

    return { timedOut: false };
  },
});

/**
 * Reactive query for the current user's active call session.
 * Used for real-time signaling, incoming call alerts, and active call overlays.
 */
export const getActiveCall = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.userId) {
      const normUser = ctx.db.normalizeId("users", args.userId);
      if (normUser) {
        currentUser = await ctx.db.get(normUser);
      }
    }
    if (!currentUser) return null;

    const now = Date.now();

    // 1. Look for incoming call that is actively ringing (< 45s)
    const incomingCalls = await ctx.db
      .query("calls")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", currentUser._id).eq("status", "ringing")
      )
      .collect();

    let incoming = null;
    incomingCalls.sort((a, b) => b.startedAt - a.startedAt);
    for (const call of incomingCalls) {
      if (now - call.startedAt <= 45000) {
        incoming = call;
        break;
      }
    }

    // 2. Look for active connected call as recipient
    const connectedAsRecipient = await ctx.db
      .query("calls")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", currentUser._id).eq("status", "connected")
      )
      .order("desc")
      .first();

    // 3. Look for outgoing call as caller (actively ringing < 45s)
    const outgoingRingingCalls = await ctx.db
      .query("calls")
      .withIndex("by_caller_status", (q) =>
        q.eq("callerId", currentUser._id).eq("status", "ringing")
      )
      .collect();

    let outgoingRinging = null;
    outgoingRingingCalls.sort((a, b) => b.startedAt - a.startedAt);
    for (const call of outgoingRingingCalls) {
      if (now - call.startedAt <= 45000) {
        outgoingRinging = call;
        break;
      }
    }

    // 4. Look for outgoing connected call as caller
    const outgoingConnected = await ctx.db
      .query("calls")
      .withIndex("by_caller_status", (q) =>
        q.eq("callerId", currentUser._id).eq("status", "connected")
      )
      .order("desc")
      .first();

    // 5. Look for recently ended calls (within last 3.5s) to allow clients to receive final status
    let recentEnded = null;
    if (!incoming && !connectedAsRecipient && !outgoingConnected && !outgoingRinging) {
      const recentAsCaller = await ctx.db
        .query("calls")
        .withIndex("by_caller", (q) => q.eq("callerId", currentUser._id))
        .order("desc")
        .first();

      const recentAsRecipient = await ctx.db
        .query("calls")
        .withIndex("by_recipient", (q) => q.eq("recipientId", currentUser._id))
        .order("desc")
        .first();

      const candidates = [recentAsCaller, recentAsRecipient].filter(
        (c): c is any =>
          !!c &&
          !!c.endedAt &&
          now - c.endedAt < 3500 &&
          ["declined", "canceled", "completed", "missed"].includes(c.status)
      );
      if (candidates.length > 0) {
        candidates.sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
        recentEnded = candidates[0];
      }
    }

    const activeCall = incoming || connectedAsRecipient || outgoingConnected || outgoingRinging || recentEnded;
    if (!activeCall) return null;

    const caller: any = await ctx.db.get(activeCall.callerId);
    const recipient: any = await ctx.db.get(activeCall.recipientId);

    const isCaller = activeCall.callerId === currentUser._id;
    const otherUser = isCaller ? recipient : caller;

    return {
      ...activeCall,
      isCaller,
      myUid: isCaller ? activeCall.callerUid : activeCall.recipientUid,
      targetUid: isCaller ? activeCall.recipientUid : activeCall.callerUid,
      caller: caller
        ? {
            id: caller._id,
            name: caller.name,
            username: caller.username,
            avatar: caller.avatarUrl || caller.avatar,
            verified: (caller as any).verified,
          }
        : null,
      recipient: recipient
        ? {
            id: recipient._id,
            name: recipient.name,
            username: recipient.username,
            avatar: recipient.avatarUrl || recipient.avatar,
            verified: (recipient as any).verified,
          }
        : null,
      otherUser: otherUser
        ? {
            id: otherUser._id,
            name: otherUser.name,
            username: otherUser.username,
            avatar: otherUser.avatarUrl || otherUser.avatar,
            verified: (otherUser as any).verified,
          }
        : null,
    };
  },
});

/**
 * Get call details by ID with participant authorization.
 */
export const getCallById = query({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return null;

    const call = await ctx.db.get(args.callId);
    if (!call) return null;

    if (call.callerId !== currentUser._id && call.recipientId !== currentUser._id) {
      throw new Error("Not authorized to view this call");
    }

    const caller: any = await ctx.db.get(call.callerId);
    const recipient: any = await ctx.db.get(call.recipientId);

    return {
      ...call,
      caller: caller
        ? {
            id: caller._id,
            name: caller.name,
            username: caller.username,
            avatar: caller.avatarUrl || caller.avatar,
          }
        : null,
      recipient: recipient
        ? {
            id: recipient._id,
            name: recipient.name,
            username: recipient.username,
            avatar: recipient.avatarUrl || recipient.avatar,
          }
        : null,
    };
  },
});

/**
 * Get call history for a conversation or user.
 */
export const getCallHistory = query({
  args: {
    conversationId: v.optional(v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    let callsQuery;
    if (args.conversationId) {
      callsQuery = await ctx.db
        .query("calls")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .order("desc")
        .take(args.limit || 20);
    } else {
      // Calls as caller or recipient
      const callerCalls = await ctx.db
        .query("calls")
        .withIndex("by_caller", (q) => q.eq("callerId", currentUser._id))
        .order("desc")
        .take(args.limit || 20);

      const recipientCalls = await ctx.db
        .query("calls")
        .withIndex("by_recipient", (q) => q.eq("recipientId", currentUser._id))
        .order("desc")
        .take(args.limit || 20);

      const all = [...callerCalls, ...recipientCalls];
      all.sort((a, b) => b.startedAt - a.startedAt);
      callsQuery = all.slice(0, args.limit || 20);
    }

    return Promise.all(
      callsQuery.map(async (call: any) => {
        const caller: any = await ctx.db.get(call.callerId);
        const recipient: any = await ctx.db.get(call.recipientId);
        const isCaller = call.callerId === currentUser._id;
        const otherUser = isCaller ? recipient : caller;

        return {
          ...call,
          isCaller,
          durationFormatted: formatCallDuration(call.duration),
          otherUser: otherUser
            ? {
                id: otherUser._id,
                name: otherUser.name,
                username: otherUser.username,
                avatar: otherUser.avatarUrl || otherUser.avatar,
              }
            : null,
        };
      })
    );
  },
});
