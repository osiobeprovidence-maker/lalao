import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { getUserByAuthIdentity } from "./lib/authIdentity";
import { requireAdmin } from "./admin";
import { Id } from "./_generated/dataModel";

// ============================================
// LALAO EGG DEFAULTS & CONSTANTS
// ============================================

export const DEFAULT_EGG_CONFIG = {
  egg_enabled: "true",
  egg_daily_max_naira: "1000",          // ₦1,000 max daily reward ceiling
  egg_points_per_naira: "10",           // 10 points = ₦1 (so 10,000 points = ₦1,000)
  egg_qualifying_seconds_target: "14400", // 4 hours = 14,400 seconds
  egg_points_per_message: "5",          // 5 points per qualifying room message
  egg_points_per_reply: "8",            // 8 points per qualifying reply
  egg_points_per_new_conversation: "25",// 25 points for first conversation with a member today
  egg_points_per_social_connect: "20",  // 20 points for connecting/following a room member
  egg_points_per_referral: "250",       // 250 points (= ₦25) for qualifying referral
  egg_points_per_time_block: "15",      // 15 points per 5 minutes active participation
  egg_time_block_seconds: "300",        // 5-minute block
  egg_min_message_length: "4",          // Minimum 4 characters to count as genuine message
  egg_spam_cooldown_seconds: "12",      // Must wait at least 12 seconds between earning messages
  egg_max_daily_messages_rewarded: "80",// Max 80 messages rewarded per day
  egg_max_daily_replies_rewarded: "50", // Max 50 replies rewarded per day
  egg_heartbeat_interval_seconds: "60", // Client heartbeat every 60s
  egg_staging_mode: "true",             // Simulated redemptions by default until live VTU provider active
};

function getUtcTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

// Helper to read configuration key
export async function getEggConfig(ctx: any, key: string): Promise<string> {
  const row = await ctx.db
    .query("rewardConfiguration")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  if (row && row.value !== undefined) return row.value;
  return (DEFAULT_EGG_CONFIG as Record<string, string>)[key] || "";
}

// Seed default Egg configuration
export async function seedDefaultEggConfig(ctx: any) {
  for (const [key, value] of Object.entries(DEFAULT_EGG_CONFIG)) {
    const existing = await ctx.db
      .query("rewardConfiguration")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    if (!existing) {
      await ctx.db.insert("rewardConfiguration", {
        key,
        value,
        description: `LaLao Egg setting: ${key.replace(/_/g, " ")}`,
        updatedAt: Date.now(),
      });
    }
  }
}

// Pure read-only helper: fetches account without any writes.
// Safe to use inside queries. Returns null if no account exists yet.
export async function getEggAccount(ctx: any, userId: Id<"users">) {
  const account = await ctx.db
    .query("eggUserAccounts")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  return account ?? null;
}

// Mutation-safe helper: creates account if missing and rolls over daily counters.
// Use only inside mutations / internalMutations.
export async function getOrCreateEggAccount(ctx: any, userId: Id<"users">) {
  const today = getUtcTodayDate();
  let account = await ctx.db
    .query("eggUserAccounts")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!account) {
    const id = await ctx.db.insert("eggUserAccounts", {
      userId,
      availablePoints: 0,
      lifetimePoints: 0,
      todayPoints: 0,
      todayDate: today,
      todayQualifyingSeconds: 0,
      todayMessagesCount: 0,
      todayRepliesCount: 0,
      todayConversationsCount: 0,
      todayReferralsCount: 0,
      todayNairaEarned: 0,
      totalNairaRedeemed: 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return (await ctx.db.get(id))!;
  }

  // Reset daily counters if UTC day has changed
  if (account.todayDate !== today) {
    await ctx.db.patch(account._id, {
      todayDate: today,
      todayPoints: 0,
      todayQualifyingSeconds: 0,
      todayMessagesCount: 0,
      todayRepliesCount: 0,
      todayConversationsCount: 0,
      todayReferralsCount: 0,
      todayNairaEarned: 0,
      updatedAt: Date.now(),
    });
    account = (await ctx.db.get(account._id))!;
  }

  return account;
}

// ============================================
// PUBLIC & CLIENT QUERIES
// ============================================

/**
 * Get current user's Egg status, daily progress, and config
 */
export const getMyEggStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return null;

    // Pure read — if no account exists yet return a sensible default so the
    // frontend can render the "empty" state without crashing.
    const rawAccount = await getEggAccount(ctx, user._id);
    const today = getUtcTodayDate();

    // Build a safe account object (handles null for new users)
    const account = rawAccount ?? {
      availablePoints: 0,
      lifetimePoints: 0,
      todayPoints: 0,
      todayDate: today,
      todayQualifyingSeconds: 0,
      todayMessagesCount: 0,
      todayRepliesCount: 0,
      todayConversationsCount: 0,
      todayReferralsCount: 0,
      todayNairaEarned: 0,
      totalNairaRedeemed: 0,
      status: "active",
      flagReason: undefined,
    };

    // Read config
    const enabledStr = await getEggConfig(ctx, "egg_enabled");
    const isEnabled = enabledStr === "true";
    const dailyMaxNaira = parseFloat(await getEggConfig(ctx, "egg_daily_max_naira")) || 1000;
    const pointsPerNaira = parseFloat(await getEggConfig(ctx, "egg_points_per_naira")) || 10;
    const targetSeconds = parseInt(await getEggConfig(ctx, "egg_qualifying_seconds_target"), 10) || 14400; // 4 hours
    const dailyMaxPoints = dailyMaxNaira * pointsPerNaira;

    // Remaining daily allowance
    const remainingDailyNaira = Math.max(0, dailyMaxNaira - account.todayNairaEarned);
    const remainingDailyPoints = Math.max(0, dailyMaxPoints - account.todayPoints);

    // Percentage to daily max
    const progressPercent = Math.min(100, Math.round((account.todayNairaEarned / dailyMaxNaira) * 100));

    // Time progress (0 to 100%)
    const timeProgressPercent = Math.min(100, Math.round((account.todayQualifyingSeconds / targetSeconds) * 100));

    // Available points converted to Naira value
    const availableNairaValue = Math.floor(account.availablePoints / pointsPerNaira);

    // Current state: 'empty' | 'filling' | 'almost_full' | 'reward_ready'
    let eggState: 'empty' | 'filling' | 'almost_full' | 'reward_ready' = 'empty';
    if (account.todayPoints === 0 && account.availablePoints === 0) {
      eggState = 'empty';
    } else if (availableNairaValue >= 50) {
      eggState = 'reward_ready';
    } else if (progressPercent >= 75) {
      eggState = 'almost_full';
    } else {
      eggState = 'filling';
    }

    return {
      isEnabled,
      status: account.status,
      flagReason: account.flagReason,
      availablePoints: account.availablePoints,
      availableNairaValue,
      lifetimePoints: account.lifetimePoints,
      todayPoints: account.todayPoints,
      todayNairaEarned: account.todayNairaEarned,
      totalNairaRedeemed: account.totalNairaRedeemed,
      todayQualifyingSeconds: account.todayQualifyingSeconds,
      targetQualifyingSeconds: targetSeconds,
      timeProgressPercent,
      dailyMaxNaira,
      dailyMaxPoints,
      remainingDailyNaira,
      remainingDailyPoints,
      progressPercent,
      eggState,
      metrics: {
        messagesCount: account.todayMessagesCount,
        repliesCount: account.todayRepliesCount,
        conversationsCount: account.todayConversationsCount,
        referralsCount: account.todayReferralsCount,
      },
    };
  },
});

/**
 * Get user's Egg points activity / ledger history
 */
export const getMyEggTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return [];

    const limit = args.limit || 30;
    const txs = await ctx.db
      .query("eggTransactions")
      .withIndex("by_user_created", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return txs;
  },
});

/**
 * Get user's Egg redemptions
 */
export const getMyEggRedemptions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return [];

    const limit = args.limit || 20;
    const redemptions = await ctx.db
      .query("eggRedemptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return redemptions;
  },
});

// ============================================
// MUTATIONS & PARTICIPATION HANDLERS
// ============================================

/**
 * Called by the frontend when the user visits the Egg page.
 * Creates the account if it does not yet exist and rolls over daily counters.
 * This is the only place db.insert / db.patch are allowed for account bootstrap.
 */
export const ensureEggAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { created: false };

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return { created: false };

    await getOrCreateEggAccount(ctx, user._id);
    return { created: true };
  },
});

/**
 * Record user presence heartbeat in a room (called every 60s while room is active)
 */
export const recordRoomHeartbeat = mutation({
  args: {
    roomId: v.id("groupChats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { recorded: false, reason: "unauthenticated" };

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return { recorded: false, reason: "user_not_found" };

    const room = await ctx.db.get(args.roomId);
    if (!room || !room.isChatroom) return { recorded: false, reason: "not_a_chatroom" };

    // Confirm caller is a room member
    const isMember = room.memberIds.some((id: any) => id.toString() === user._id.toString());
    if (!isMember) return { recorded: false, reason: "not_member" };

    const enabled = (await getEggConfig(ctx, "egg_enabled")) === "true";
    if (!enabled) return { recorded: false, reason: "disabled" };

    const account = await getOrCreateEggAccount(ctx, user._id);
    if (account.status !== "active") return { recorded: false, reason: "account_not_active" };

    const today = getUtcTodayDate();
    const now = Date.now();

    // Fetch or create session
    let session = await ctx.db
      .query("eggActivitySessions")
      .withIndex("by_user_room_date", (q: any) =>
        q.eq("userId", user._id).eq("roomId", args.roomId).eq("sessionDate", today)
      )
      .first();

    const maxSeconds = parseInt(await getEggConfig(ctx, "egg_qualifying_seconds_target"), 10) || 14400;
    let addedSeconds = 0;

    if (!session) {
      addedSeconds = 60;
      await ctx.db.insert("eggActivitySessions", {
        userId: user._id,
        roomId: args.roomId,
        sessionDate: today,
        activeSeconds: 60,
        lastHeartbeatAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Validate elapsed time to prevent manipulation
      const elapsed = Math.floor((now - session.lastHeartbeatAt) / 1000);
      if (elapsed > 0 && elapsed <= 180) { // within reasonable threshold
        addedSeconds = Math.min(elapsed, 90);
        await ctx.db.patch(session._id, {
          activeSeconds: session.activeSeconds + addedSeconds,
          lastHeartbeatAt: now,
          updatedAt: now,
        });
      } else {
        // Gap too long, treat as new heartbeat tick
        addedSeconds = 60;
        await ctx.db.patch(session._id, {
          activeSeconds: session.activeSeconds + addedSeconds,
          lastHeartbeatAt: now,
          updatedAt: now,
        });
      }
    }

    // Update daily qualifying seconds in eggUserAccount
    const newTotalSeconds = Math.min(maxSeconds, account.todayQualifyingSeconds + addedSeconds);
    await ctx.db.patch(account._id, {
      todayQualifyingSeconds: newTotalSeconds,
      updatedAt: now,
    });

    return {
      recorded: true,
      todayQualifyingSeconds: newTotalSeconds,
      targetQualifyingSeconds: maxSeconds,
    };
  },
});

/**
 * Internal helper to credit points with ceiling & fraud check
 */
async function awardEggPoints(
  ctx: any,
  userId: Id<"users">,
  pointsToAdd: number,
  type:
    | "earn_chat"
    | "earn_reply"
    | "earn_conversation"
    | "earn_social_connection"
    | "earn_referral"
    | "earn_time_threshold",
  description: string,
  extra: {
    roomId?: Id<"groupChats">;
    relatedMessageId?: Id<"messages">;
    relatedReferralId?: Id<"referralRelationships">;
    metadata?: any;
  } = {}
) {
  const enabled = (await getEggConfig(ctx, "egg_enabled")) === "true";
  if (!enabled) return { awarded: false, reason: "disabled" };

  const account = await getOrCreateEggAccount(ctx, userId);
  if (account.status !== "active") return { awarded: false, reason: "account_not_active" };

  const dailyMaxNaira = parseFloat(await getEggConfig(ctx, "egg_daily_max_naira")) || 1000;
  const pointsPerNaira = parseFloat(await getEggConfig(ctx, "egg_points_per_naira")) || 10;
  const dailyMaxPoints = dailyMaxNaira * pointsPerNaira;

  // Enforce daily ceiling
  const remainingPoints = Math.max(0, dailyMaxPoints - account.todayPoints);
  if (remainingPoints <= 0) {
    return { awarded: false, reason: "daily_ceiling_reached" };
  }

  const actualPoints = Math.min(pointsToAdd, remainingPoints);
  if (actualPoints <= 0) return { awarded: false, reason: "zero_points" };

  const nairaValue = Math.floor(actualPoints / pointsPerNaira);
  const pointsBefore = account.availablePoints;
  const pointsAfter = pointsBefore + actualPoints;

  // Update account balance
  const patchData: any = {
    availablePoints: pointsAfter,
    lifetimePoints: account.lifetimePoints + actualPoints,
    todayPoints: account.todayPoints + actualPoints,
    todayNairaEarned: account.todayNairaEarned + nairaValue,
    updatedAt: Date.now(),
  };

  if (type === "earn_chat") patchData.todayMessagesCount = account.todayMessagesCount + 1;
  if (type === "earn_reply") patchData.todayRepliesCount = account.todayRepliesCount + 1;
  if (type === "earn_conversation") patchData.todayConversationsCount = account.todayConversationsCount + 1;
  if (type === "earn_referral") patchData.todayReferralsCount = account.todayReferralsCount + 1;

  await ctx.db.patch(account._id, patchData);

  // Record transaction in audit ledger
  await ctx.db.insert("eggTransactions", {
    userId,
    type,
    points: actualPoints,
    pointsBefore,
    pointsAfter,
    nairaValue,
    description,
    roomId: extra.roomId,
    relatedMessageId: extra.relatedMessageId,
    relatedReferralId: extra.relatedReferralId,
    metadata: extra.metadata,
    createdAt: Date.now(),
  });

  return {
    awarded: true,
    points: actualPoints,
    nairaValue,
    pointsAfter,
  };
}

/**
 * Internal mutation called by sendMessage when a message is posted to a chatroom
 */
export const onRoomMessageSent = internalMutation({
  args: {
    messageId: v.id("messages"),
    senderId: v.id("users"),
    groupId: v.id("groupChats"),
    text: v.string(),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.groupId);
    if (!room || !room.isChatroom) return;

    const minLen = parseInt(await getEggConfig(ctx, "egg_min_message_length"), 10) || 4;
    const cleanText = args.text.trim();
    if (cleanText.length < minLen) return;

    const today = getUtcTodayDate();
    const account = await getOrCreateEggAccount(ctx, args.senderId);

    // Spam cooldown check: fetch last chat transaction by this user
    const lastChatTx = await ctx.db
      .query("eggTransactions")
      .withIndex("by_user_created", (q: any) => q.eq("userId", args.senderId))
      .order("desc")
      .first();

    const cooldownSec = parseInt(await getEggConfig(ctx, "egg_spam_cooldown_seconds"), 10) || 12;
    if (lastChatTx && Date.now() - lastChatTx.createdAt < cooldownSec * 1000) {
      // Message came too fast (spam cooldown)
      return;
    }

    // Check repeated identical message
    if (lastChatTx && lastChatTx.metadata?.textHash === cleanText.toLowerCase()) {
      return;
    }

    // Check message limit
    const maxMessages = parseInt(await getEggConfig(ctx, "egg_max_daily_messages_rewarded"), 10) || 80;
    if (account.todayMessagesCount >= maxMessages) return;

    const isReply = Boolean(args.replyToMessageId);
    const ptsPerMsg = parseInt(await getEggConfig(ctx, "egg_points_per_message"), 10) || 5;
    const ptsPerReply = parseInt(await getEggConfig(ctx, "egg_points_per_reply"), 10) || 8;

    const points = isReply ? ptsPerReply : ptsPerMsg;
    const type = isReply ? "earn_reply" : "earn_chat";
    const desc = isReply
      ? `Room reply reward in ${room.name}`
      : `Room participation reward in ${room.name}`;

    await awardEggPoints(ctx, args.senderId, points, type, desc, {
      roomId: args.groupId,
      relatedMessageId: args.messageId,
      metadata: { textHash: cleanText.toLowerCase() },
    });

    // If it's a reply to someone else, check if it counts as a new unique conversation today
    if (args.replyToMessageId) {
      const origMsg = await ctx.db.get(args.replyToMessageId);
      if (origMsg && origMsg.senderId !== args.senderId) {
        const targetUserId = origMsg.senderId;
        const existingInteraction = await ctx.db
          .query("eggInteractions")
          .withIndex("by_user_target_date", (q: any) =>
            q.eq("userId", args.senderId).eq("targetUserId", targetUserId).eq("date", today)
          )
          .first();

        if (!existingInteraction) {
          await ctx.db.insert("eggInteractions", {
            userId: args.senderId,
            targetUserId,
            roomId: args.groupId,
            date: today,
            createdAt: Date.now(),
          });

          const convoPts = parseInt(await getEggConfig(ctx, "egg_points_per_new_conversation"), 10) || 25;
          await awardEggPoints(
            ctx,
            args.senderId,
            convoPts,
            "earn_conversation",
            `New member conversation in ${room.name}`,
            { roomId: args.groupId }
          );
        }
      }
    }
  },
});

/**
 * Internal mutation called when a user follows/connects with another room member
 */
export const onRoomMemberFollowed = internalMutation({
  args: {
    followerId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.targetUserId) return;

    const today = getUtcTodayDate();
    const existing = await ctx.db
      .query("eggInteractions")
      .withIndex("by_user_target_date", (q: any) =>
        q.eq("userId", args.followerId).eq("targetUserId", args.targetUserId).eq("date", today)
      )
      .first();

    if (existing) return; // Only once per pair per day

    await ctx.db.insert("eggInteractions", {
      userId: args.followerId,
      targetUserId: args.targetUserId,
      roomId: undefined as any,
      date: today,
      createdAt: Date.now(),
    });

    const pts = parseInt(await getEggConfig(ctx, "egg_points_per_social_connect"), 10) || 20;
    await awardEggPoints(
      ctx,
      args.followerId,
      pts,
      "earn_social_connection",
      "Room community connection reward",
      {}
    );
  },
});

/**
 * Internal mutation called when a referral completes onboarding
 */
export const onReferralQualified = internalMutation({
  args: {
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    referralRelationshipId: v.id("referralRelationships"),
  },
  handler: async (ctx, args) => {
    if (args.referrerId === args.referredUserId) return;

    const pts = parseInt(await getEggConfig(ctx, "egg_points_per_referral"), 10) || 250;
    await awardEggPoints(
      ctx,
      args.referrerId,
      pts,
      "earn_referral",
      "Successful room invite reward",
      { relatedReferralId: args.referralRelationshipId }
    );
  },
});

// ============================================
// WALLET REDEMPTION SYSTEM (AIRTIME & DATA)
// ============================================

export const REDEMPTION_PLANS = {
  airtime: [
    { id: "airtime_100", amountNaira: 100, pointsCost: 1000, label: "₦100 Airtime" },
    { id: "airtime_200", amountNaira: 200, pointsCost: 2000, label: "₦200 Airtime" },
    { id: "airtime_500", amountNaira: 500, pointsCost: 5000, label: "₦500 Airtime" },
    { id: "airtime_1000", amountNaira: 1000, pointsCost: 10000, label: "₦1,000 Airtime" },
  ],
  data: [
    { id: "data_100mb", amountNaira: 100, pointsCost: 1000, label: "100MB Daily Data", plan: "100MB Daily" },
    { id: "data_500mb", amountNaira: 250, pointsCost: 2500, label: "500MB 2-Day Data", plan: "500MB 2-Day" },
    { id: "data_1gb", amountNaira: 500, pointsCost: 5000, label: "1GB Weekly Data", plan: "1GB Weekly" },
    { id: "data_2gb", amountNaira: 1000, pointsCost: 10000, label: "2GB Monthly Data", plan: "2GB Monthly" },
  ],
};

/**
 * Redeem accumulated points for airtime or data
 */
export const redeemEggReward = mutation({
  args: {
    category: v.union(v.literal("airtime"), v.literal("data")),
    network: v.string(), // "MTN", "AIRTEL", "GLO", "9MOBILE"
    phoneNumber: v.string(),
    planId: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required to redeem rewards.");

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) throw new ConvexError("User account not found.");

    // Check duplicate idempotency
    const existing = await ctx.db
      .query("eggRedemptions")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { success: true, redemptionId: existing._id, status: existing.status };
    }

    // Validate phone number
    const phone = args.phoneNumber.trim().replace(/\s+/g, "");
    if (!/^(\+?234|0)[789]\d{9}$/.test(phone)) {
      throw new ConvexError("Please enter a valid Nigerian mobile phone number.");
    }

    // Lookup plan
    const catalog = args.category === "airtime" ? REDEMPTION_PLANS.airtime : REDEMPTION_PLANS.data;
    const plan = catalog.find((p) => p.id === args.planId);
    if (!plan) throw new ConvexError("Selected reward package is not available.");

    const account = await getEggAccount(ctx, user._id);
    if (account.status !== "active") {
      throw new ConvexError("Your rewards account is temporarily flagged or restricted. Please contact support.");
    }

    if (account.availablePoints < plan.pointsCost) {
      throw new ConvexError(`Insufficient points. You need ${plan.pointsCost.toLocaleString()} points to redeem this.`);
    }

    const pointsBefore = account.availablePoints;
    const pointsAfter = pointsBefore - plan.pointsCost;

    // Deduct points atomically
    await ctx.db.patch(account._id, {
      availablePoints: pointsAfter,
      totalNairaRedeemed: account.totalNairaRedeemed + plan.amountNaira,
      updatedAt: Date.now(),
    });

    const isStaging = (await getEggConfig(ctx, "egg_staging_mode")) === "true";
    const initialStatus = isStaging ? "completed" : "pending";

    // Insert redemption record
    const redemptionId = await ctx.db.insert("eggRedemptions", {
      userId: user._id,
      category: args.category,
      network: args.network.toUpperCase(),
      phoneNumber: phone,
      packagePlan: (plan as any).plan || plan.label,
      amountNaira: plan.amountNaira,
      pointsCost: plan.pointsCost,
      status: initialStatus,
      externalProviderRef: isStaging ? `STAGING-${Date.now()}` : undefined,
      idempotencyKey: args.idempotencyKey,
      auditNote: isStaging ? "Simulated test fulfillment (Staging Mode)" : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Record ledger transaction
    await ctx.db.insert("eggTransactions", {
      userId: user._id,
      type: args.category === "airtime" ? "redeem_airtime" : "redeem_data",
      points: -plan.pointsCost,
      pointsBefore,
      pointsAfter,
      nairaValue: plan.amountNaira,
      description: `Redeemed ${plan.label} (${args.network.toUpperCase()} - ${phone})`,
      relatedRedemptionId: redemptionId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      redemptionId,
      status: initialStatus,
      pointsDeducted: plan.pointsCost,
      remainingPoints: pointsAfter,
      isStaging,
    };
  },
});

// ============================================
// ADMIN MANAGEMENT & OVERSIGHT
// ============================================

export const getEggAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [accounts, redemptions, txs] = await Promise.all([
      ctx.db.query("eggUserAccounts").collect(),
      ctx.db.query("eggRedemptions").order("desc").take(50),
      ctx.db.query("eggTransactions").order("desc").take(50),
    ]);

    const totalUsers = accounts.length;
    const totalPointsInCirculation = accounts.reduce((sum: number, a: any) => sum + a.availablePoints, 0);
    const totalNairaRedeemed = accounts.reduce((sum: number, a: any) => sum + (a.totalNairaRedeemed || 0), 0);
    const flaggedAccounts = accounts.filter((a: any) => a.status === "flagged" || a.status === "suspended");

    // Config items
    const configs = await ctx.db.query("rewardConfiguration").collect();
    const eggConfigs = configs.filter((c: any) => c.key.startsWith("egg_"));

    return {
      totalUsers,
      totalPointsInCirculation,
      totalNairaRedeemed,
      flaggedCount: flaggedAccounts.length,
      recentRedemptions: redemptions,
      recentTransactions: txs,
      configurations: eggConfigs,
    };
  },
});

export const updateEggConfigAdmin = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("rewardConfiguration")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("rewardConfiguration", {
        key: args.key,
        value: args.value,
        description: `Config: ${args.key}`,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    }

    // Audit log
    await ctx.db.insert("rewardAdminAudit", {
      actorId: user._id,
      action: "UPDATE_EGG_CONFIG",
      target: args.key,
      before: existing ? existing.value : undefined,
      after: args.value,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const adjustUserEggPointsAdmin = mutation({
  args: {
    userId: v.id("users"),
    pointsDelta: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const account = await getOrCreateEggAccount(ctx, args.userId);
    const pointsBefore = account.availablePoints;
    const pointsAfter = Math.max(0, pointsBefore + args.pointsDelta);
    const pointsPerNaira = parseFloat(await getEggConfig(ctx, "egg_points_per_naira")) || 10;

    await ctx.db.patch(account._id, {
      availablePoints: pointsAfter,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("eggTransactions", {
      userId: args.userId,
      type: "admin_adjustment",
      points: args.pointsDelta,
      pointsBefore,
      pointsAfter,
      nairaValue: Math.floor(Math.abs(args.pointsDelta) / pointsPerNaira),
      description: `Admin adjustment: ${args.reason}`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("rewardAdminAudit", {
      actorId: user._id,
      action: "ADJUST_EGG_POINTS",
      target: args.userId.toString(),
      before: String(pointsBefore),
      after: String(pointsAfter),
      createdAt: Date.now(),
    });

    return { success: true, pointsBefore, pointsAfter };
  },
});
