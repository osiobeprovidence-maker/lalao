import { getUserByAuthIdentity } from "./lib/authIdentity";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdmin } from "./admin";

/**
 * Helper to authenticate user from context
 */
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const user = await getUserByAuthIdentity(ctx, identity);

  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Validate URL to prevent dangerous schemes and javascript execution
 */
export function validateDestinationUrl(url: string): boolean {
  if (!url) return false;
  // Allow internal Lalao routes
  if (url.startsWith("/") || url.startsWith("https://lalao.website") || url.startsWith("https://www.lalao.website")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Automated policy check for spam and suspicious patterns
 */
export function automatedContentScreening(text: string): { flagged: boolean; reason?: string } {
  if (!text) return { flagged: false };
  const lower = text.toLowerCase();
  const prohibitedPatterns = [
    /\b(free money|ponzi|get rich quick|doubler|send btc|send eth|crypto scheme)\b/i,
    /\b(casino|viagra|porn|betting fixed|100% fixed match)\b/i,
    /(\+?234\d{10}.*){3,}/, // Excessive phone number dumping
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(lower)) {
      return {
        flagged: true,
        reason: "Content flagged by automated safety screening for potentially high-risk or prohibited commercial patterns.",
      };
    }
  }

  return { flagged: false };
}

// ==========================================
// ADVERTISER QUERIES & MUTATIONS
// ==========================================

/**
 * Get campaigns owned by the current authenticated user
 */
export const getMyCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) return [];

    const campaigns = await ctx.db
      .query("adCampaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return await Promise.all(campaigns.map(async (campaign) => {
      const payments = await ctx.db.query("adPayments").withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id)).collect();
      const successfulPayment = payments.find((payment) => payment.status === "successful");
      return { ...campaign, paymentStatus: successfulPayment ? "successful" : payments.some((payment) => payment.status === "pending") ? "pending" : "unpaid", paymentProvider: successfulPayment?.paymentProvider };
    }));
  },
});

/** Rooms available to the signed-in advertiser for room campaign placement. */
export const getAdvertisableRooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const rooms = await ctx.db.query("groupChats").withIndex("by_is_chatroom", (q) => q.eq("isChatroom", true)).collect();
    return rooms.filter((room) => room.chatroomStatus !== "inactive" && (room.creatorId === user._id || room.memberIds.some((id: any) => id === user._id)))
      .map((room) => ({ _id: room._id, name: room.name, category: room.category, memberCount: room.memberIds.length }));
  },
});

/** Automatic scheduled activation and expiration; also used by the existing cron. */
export const maintainCampaignLifecycle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const campaigns = await ctx.db.query("adCampaigns").collect();
    let activated = 0;
    let completed = 0;
    for (const campaign of campaigns) {
      if (!["active", "scheduled", "approved"].includes(campaign.status)) continue;
      if (campaign.schedule.endDate <= now) {
        await ctx.db.patch(campaign._id, { status: "completed", updatedAt: now });
        completed++;
        continue;
      }
      if (campaign.moderationStatus !== "approved") continue;
      const successfulPayment = await ctx.db.query("adPayments").withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id)).filter((q) => q.eq(q.field("status"), "successful")).first();
      if (!successfulPayment) continue;
      const nextStatus = campaign.schedule.startDate <= now ? "active" : "scheduled";
      if (campaign.status !== nextStatus) {
        await ctx.db.patch(campaign._id, { status: nextStatus, updatedAt: now });
        if (nextStatus === "active") activated++;
      }
    }
    return { activated, completed };
  },
});

/** Room timeline placement for room members only. */
export const getRoomSponsoredPlacement = query({
  args: { roomId: v.id("groupChats") },
  handler: async (ctx, { roomId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await getUserByAuthIdentity(ctx, identity);
    const room = await ctx.db.get(roomId);
    if (!user || !room?.isChatroom || room.chatroomStatus === "inactive") return null;
    if (room.creatorId !== user._id && !room.memberIds.some((memberId: any) => memberId === user._id)) return null;
    const now = Date.now();
    const candidates = await ctx.db.query("adCampaigns").withIndex("by_room_status", (q) => q.eq("roomId", roomId).eq("status", "active")).collect();
    const eligible = candidates.filter((campaign) => campaign.moderationStatus === "approved" && campaign.schedule.startDate <= now && campaign.schedule.endDate > now && campaign.budget.spentKobo < campaign.budget.totalBudgetKobo);
    eligible.sort((a, b) => a.budget.spentKobo / a.budget.totalBudgetKobo - b.budget.spentKobo / b.budget.totalBudgetKobo);
    const campaign = eligible[0];
    if (!campaign) return null;
    const advertiser = await ctx.db.get(campaign.userId);
    return { campaignId: campaign._id, placement: "room" as const, roomId, format: campaign.format, headline: campaign.creative.headline, description: campaign.creative.description, mediaUrl: campaign.creative.mediaUrl, mediaType: campaign.creative.mediaType, ctaLabel: campaign.creative.ctaLabel, destinationUrl: campaign.creative.destinationUrl, advertiser: { id: advertiser?._id, name: advertiser?.name || "Sponsored Partner", username: advertiser?.username, avatarUrl: advertiser?.avatarUrl, isVerified: true } };
  },
});

/**
 * Get single campaign by ID (must be owner or admin)
 */
export const getCampaignById = query({
  args: { campaignId: v.id("adCampaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) return null;

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    if (campaign.userId !== user._id && user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Unauthorized to access this campaign");
    }

    // Include payment history for this campaign
    const payments = await ctx.db
      .query("adPayments")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Include moderation audit logs
    const auditLogs = await ctx.db
      .query("adModerationLogs")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return {
      ...campaign,
      payments,
      auditLogs,
    };
  },
});

/**
 * Create a new advertising campaign
 */
export const createCampaign = mutation({
  args: {
    name: v.string(),
    objective: v.union(
      v.literal("reach"),
      v.literal("website_visits"),
      v.literal("engagement"),
      v.literal("local_discovery")
    ),
    format: v.union(
      v.literal("sponsored_post"),
      v.literal("promoted_post"),
      v.literal("image_ad"),
      v.literal("video_ad")
    ),
    pageId: v.optional(v.id("pages")),
    placement: v.optional(v.union(v.literal("feed"), v.literal("room"))),
    roomId: v.optional(v.id("groupChats")),
    promotedPostId: v.optional(v.id("posts")),
    creative: v.object({
      headline: v.string(),
      description: v.optional(v.string()),
      mediaUrl: v.optional(v.string()),
      mediaStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
      ctaLabel: v.union(
        v.literal("Learn More"),
        v.literal("Sign Up"),
        v.literal("Shop Now"),
        v.literal("Contact Us"),
        v.literal("Visit Profile"),
        v.literal("Order Now"),
        v.literal("Book Now"),
        v.literal("View Post")
      ),
      destinationUrl: v.string(),
    }),
    targeting: v.object({
      targetType: v.union(v.literal("local_radius"), v.literal("city_state"), v.literal("broad_nation")),
      locationName: v.optional(v.string()),
      subArea: v.optional(v.string()),
      radiusKm: v.optional(v.number()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      stateOrRegion: v.optional(v.string()),
      country: v.string(),
    }),
    budget: v.object({
      currency: v.string(),
      totalBudgetKobo: v.number(),
      dailyLimitKobo: v.optional(v.number()),
    }),
    schedule: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const placement = args.placement ?? "feed";

    if (placement === "room") {
      if (!args.roomId) throw new Error("Choose a chatroom for this advertisement.");
      const room = await ctx.db.get(args.roomId);
      if (!room?.isChatroom || room.chatroomStatus === "inactive") throw new Error("Selected chatroom is unavailable.");
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const isMember = room.creatorId === user._id || room.memberIds.some((id: any) => id === user._id);
      if (!isAdmin && !isMember) throw new Error("Join this chatroom before creating an advertisement for it.");
    } else if (args.roomId) {
      throw new Error("A room can only be selected for room advertisements.");
    }

    // 1. Validate destination URL
    if (!validateDestinationUrl(args.creative.destinationUrl)) {
      throw new Error("Invalid destination URL. URL must use HTTPS or be a valid internal Lalao path.");
    }

    // 2. Validate Budget (Minimum ₦1,000 = 100,000 kobo)
    const minBudgetKobo = 100000;
    if (args.budget.totalBudgetKobo < minBudgetKobo) {
      throw new Error("Minimum campaign budget is ₦1,000 (100,000 kobo).");
    }

    // 3. Validate Schedule
    const now = Date.now();
    if (args.schedule.endDate <= args.schedule.startDate || args.schedule.endDate - args.schedule.startDate > 90 * 24 * 60 * 60 * 1000) {
      throw new Error("Campaign end date must be after start date.");
    }
    if (args.schedule.endDate <= now) {
      throw new Error("Campaign end date cannot be in the past.");
    }

    // 4. Promoted Post Ownership & Verification
    if (args.format === "promoted_post") {
      if (!args.promotedPostId) {
        throw new Error("A post must be selected for promoted post campaigns.");
      }
      const post = await ctx.db.get(args.promotedPostId);
      if (!post) throw new Error("Selected post does not exist.");
      if (post.authorId !== user._id) {
        throw new Error("You can only promote posts that you authored.");
      }
    }

    // 5. Image & Video Ad Media Verification & Blob Protection
    if (args.format === "image_ad" && !args.creative.mediaUrl && !args.creative.mediaStorageId) {
      throw new Error("An image creative is required for image advertisements.");
    }
    if (args.format === "video_ad" && !args.creative.mediaUrl && !args.creative.mediaStorageId) {
      throw new Error("A video creative is required for video advertisements.");
    }
    if (args.creative.mediaUrl && args.creative.mediaUrl.startsWith("blob:")) {
      throw new Error("Invalid media reference: temporary local blob URLs cannot be persisted.");
    }

    // 6. Automated Screening
    const screening = automatedContentScreening(`${args.creative.headline} ${args.creative.description || ""}`);
    const moderationStatus = screening.flagged ? "auto_flagged" : "pending_admin";

    const campaignId = await ctx.db.insert("adCampaigns", {
      userId: user._id,
      pageId: args.pageId,
      name: args.name.trim(),
      objective: args.objective,
      format: args.format,
      status: "pending_payment", // Initial state waiting for funding
      moderationStatus,
      moderationReason: screening.reason,
      durationMs: args.schedule.endDate - args.schedule.startDate,
      promotedPostId: args.promotedPostId,
      placement,
      roomId: placement === "room" ? args.roomId : undefined,
      creative: {
        headline: args.creative.headline.trim(),
        description: args.creative.description?.trim(),
        mediaUrl: args.creative.mediaUrl,
        mediaStorageId: args.creative.mediaStorageId,
        mediaType: args.creative.mediaType,
        ctaLabel: args.creative.ctaLabel,
        destinationUrl: args.creative.destinationUrl.trim(),
      },
      targeting: args.targeting,
      budget: {
        currency: args.budget.currency || "NGN",
        totalBudgetKobo: Math.round(args.budget.totalBudgetKobo),
        dailyLimitKobo: args.budget.dailyLimitKobo ? Math.round(args.budget.dailyLimitKobo) : undefined,
        spentKobo: 0,
      },
      schedule: args.schedule,
      impressionsCount: 0,
      clicksCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (screening.flagged) {
      await ctx.db.insert("adModerationLogs", {
        campaignId,
        reviewerId: user._id,
        action: "auto_flag",
        reason: screening.reason,
        timestamp: now,
      });
    }

    return campaignId;
  },
});

/**
 * Toggle Pause / Resume campaign by advertiser
 */
export const togglePauseCampaign = mutation({
  args: {
    campaignId: v.id("adCampaigns"),
    pause: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.userId !== user._id) throw new Error("Unauthorized");

    const now = Date.now();

    if (args.pause) {
      if (campaign.status !== "active" && campaign.status !== "approved" && campaign.status !== "scheduled") {
        throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
      }
      await ctx.db.patch(args.campaignId, {
        status: "paused",
        updatedAt: now,
      });
    } else {
      if (campaign.status !== "paused") {
        throw new Error("Campaign is not paused");
      }
      // Re-evaluate whether it should be active or scheduled
      let newStatus: "active" | "scheduled" | "completed" = "active";
      if (campaign.schedule.startDate > now) {
        newStatus = "scheduled";
      } else if (campaign.schedule.endDate <= now || campaign.budget.spentKobo >= campaign.budget.totalBudgetKobo) {
        newStatus = "completed";
      }

      await ctx.db.patch(args.campaignId, {
        status: newStatus,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Cancel a campaign
 */
export const cancelCampaign = mutation({
  args: { campaignId: v.id("adCampaigns") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.userId !== user._id) throw new Error("Unauthorized");

    if (campaign.status === "completed" || campaign.status === "cancelled") {
      throw new Error("Campaign is already finished or cancelled");
    }

    await ctx.db.patch(args.campaignId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ==========================================
// ADMIN ADS MANAGEMENT
// ==========================================

/**
 * Admin: Get all campaigns with filters
 */
export const adminGetCampaigns = query({
  args: {
    status: v.optional(v.string()),
    moderationStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let campaigns = await ctx.db.query("adCampaigns").order("desc").collect();

    if (args.status && args.status !== "all") {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }
    if (args.moderationStatus && args.moderationStatus !== "all") {
      campaigns = campaigns.filter((c) => c.moderationStatus === args.moderationStatus);
    }

    // Enrich with advertiser profile
    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          ...c,
          advertiser: user
            ? {
                name: user.name || "Anonymous",
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Admin: Get Ad Platform Global Financials & Metrics
 */
export const adminGetAdOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allCampaigns = await ctx.db.query("adCampaigns").collect();
    const payments = await ctx.db
      .query("adPayments")
      .withIndex("by_reference")
      .collect();

    const successfulPayments = payments.filter((p) => p.status === "successful");
    const totalVerifiedPaymentsKobo = successfulPayments.reduce((acc, p) => acc + p.amountKobo, 0);

    const pendingReviewCount = allCampaigns.filter(
      (c) => c.moderationStatus === "pending_admin" || c.moderationStatus === "auto_flagged"
    ).length;

    const activeCount = allCampaigns.filter((c) => c.status === "active").length;
    const pausedCount = allCampaigns.filter((c) => c.status === "paused").length;
    const rejectedCount = allCampaigns.filter((c) => c.moderationStatus === "rejected").length;

    const totalImpressions = allCampaigns.reduce((acc, c) => acc + (c.impressionsCount || 0), 0);
    const totalClicks = allCampaigns.reduce((acc, c) => acc + (c.clicksCount || 0), 0);
    const totalDeliverySpentKobo = allCampaigns.reduce((acc, c) => acc + (c.budget.spentKobo || 0), 0);

    return {
      totalCampaigns: allCampaigns.length,
      pendingReviewCount,
      activeCount,
      pausedCount,
      rejectedCount,
      totalVerifiedPaymentsKobo,
      totalDeliverySpentKobo,
      totalImpressions,
      totalClicks,
    };
  },
});

/**
 * Admin: Review Campaign (Approve, Reject, or Suspend)
 */
export const adminReviewCampaign = mutation({
  args: {
    campaignId: v.id("adCampaigns"),
    decision: v.union(v.literal("approve"), v.literal("reject"), v.literal("suspend")),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const now = Date.now();
    let newStatus = campaign.status;
    let newModeration: "approved" | "rejected" | "suspended" = "approved";

    if (args.decision === "approve") {
      newModeration = "approved";
      // If paid, transition to active or scheduled
      if (campaign.status === "pending_review" || campaign.status === "draft" || campaign.status === "payment_failed") {
        const payment = await ctx.db.query("adPayments").withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId)).filter((q) => q.eq(q.field("status"), "successful")).first();
        if (!payment) throw new Error("Campaign must be paid before it can be approved for delivery.");
        if (campaign.placement === "room" || (campaign.schedule.startDate <= now && campaign.schedule.endDate > now)) {
          newStatus = "active";
        } else if (campaign.schedule.startDate > now) {
          newStatus = "scheduled";
        } else {
          newStatus = "approved";
        }
      }
    } else if (args.decision === "reject") {
      newModeration = "rejected";
      newStatus = "rejected";
      if (!args.reason) throw new Error("A rejection reason is required.");
    } else if (args.decision === "suspend") {
      newModeration = "suspended";
      newStatus = "paused";
      if (!args.reason) throw new Error("A suspension reason is required.");
    }

    const schedule = campaign.placement === "room" && args.decision === "approve"
      ? { startDate: now, endDate: now + (campaign.durationMs || campaign.schedule.endDate - campaign.schedule.startDate) }
      : campaign.schedule;
    await ctx.db.patch(args.campaignId, {
      status: newStatus,
      schedule,
      moderationStatus: newModeration,
      moderationReason: args.reason,
      reviewNote: args.note,
      reviewedBy: admin._id,
      reviewedAt: now,
      updatedAt: now,
    });

    // Record audit log
    await ctx.db.insert("adModerationLogs", {
      campaignId: args.campaignId,
      reviewerId: admin._id,
      action: args.decision === "approve" ? "approved" : args.decision === "reject" ? "rejected" : "suspended",
      reason: args.reason,
      note: args.note,
      timestamp: now,
    });

    // Dispatch Notification to Advertiser
    const notifType = args.decision === "approve" ? "ad_approved" : "ad_rejected";
    const excerpt =
      args.decision === "approve"
        ? `Your ad campaign "${campaign.name}" was approved and is now active.`
        : `Your ad campaign "${campaign.name}" was rejected: ${args.reason}`;

    await ctx.db.insert("notifications", {
      recipientId: campaign.userId,
      actorId: admin._id,
      type: notifType,
      targetExcerpt: excerpt,
      isRead: false,
      createdAt: now,
    });

    return { success: true, status: newStatus, moderationStatus: newModeration };
  },
});

// ==========================================
// FEED AD SELECTION & TRACKING
// ==========================================

/**
 * Ad Delivery Query: Fetches eligible sponsored post matching user context
 */
export const getSponsoredPlacement = query({
  args: {
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationName: v.optional(v.string()),
    placement: v.optional(v.union(v.literal("feed"), v.literal("room"))),
    roomId: v.optional(v.id("groupChats")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Query candidates that are active and approved
    const activeCandidates = await ctx.db
      .query("adCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter strictly by moderation, schedule, and remaining budget
    const placement = args.placement ?? "feed";
    const eligible = activeCandidates.filter((c) => {
      if ((c.placement ?? "feed") !== placement) return false;
      if (placement === "room" && c.roomId !== args.roomId) return false;
      if (c.moderationStatus !== "approved") return false;
      if (c.schedule.startDate > now || c.schedule.endDate <= now) return false;
      if (c.budget.spentKobo >= c.budget.totalBudgetKobo) return false;

      // Geographic matching
      if (c.targeting.targetType === "local_radius") {
        if (c.targeting.locationName && args.locationName) {
          const match = c.targeting.locationName.toLowerCase() === args.locationName.toLowerCase();
          if (!match && c.targeting.latitude && c.targeting.longitude && args.latitude && args.longitude) {
            // Approx radius check
            const distKm = getDistanceKm(
              c.targeting.latitude,
              c.targeting.longitude,
              args.latitude,
              args.longitude
            );
            return distKm <= (c.targeting.radiusKm || 25);
          }
          return match;
        }
      }
      return true; // Broader or matched
    });

    if (eligible.length === 0) return null;

    // Pick candidate with lowest delivery ratio to ensure fair pacing
    eligible.sort((a, b) => {
      const ratioA = a.budget.spentKobo / a.budget.totalBudgetKobo;
      const ratioB = b.budget.spentKobo / b.budget.totalBudgetKobo;
      return ratioA - ratioB;
    });

    const chosen = eligible[0];
    const advertiser = await ctx.db.get(chosen.userId);

    // If promoted organic post, fetch original post
    let originalPost = null;
    if (chosen.format === "promoted_post" && chosen.promotedPostId) {
      originalPost = await ctx.db.get(chosen.promotedPostId);
    }

    return {
      campaignId: chosen._id,
      placement: chosen.placement ?? "feed",
      roomId: chosen.roomId,
      format: chosen.format,
      headline: chosen.creative.headline,
      description: chosen.creative.description,
      mediaUrl: chosen.creative.mediaUrl,
      mediaType: chosen.creative.mediaType,
      ctaLabel: chosen.creative.ctaLabel,
      destinationUrl: chosen.creative.destinationUrl,
      advertiser: {
        id: advertiser?._id,
        name: advertiser?.name || "Sponsored Partner",
        username: advertiser?.username,
        avatarUrl: advertiser?.avatarUrl,
        isVerified: true,
      },
      originalPost,
    };
  },
});

/**
 * Record an impression idempotently
 */
export const recordAdImpression = mutation({
  args: {
    campaignId: v.id("adCampaigns"),
    sessionId: v.string(), // Fingerprint / session
    locationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    const now = Date.now();
    if (!campaign || campaign.status !== "active" || campaign.moderationStatus !== "approved" || campaign.schedule.startDate > now || campaign.schedule.endDate <= now || campaign.budget.spentKobo >= campaign.budget.totalBudgetKobo) return { recorded: false };

    const dateBucket = new Date(now).toISOString().split("T")[0]; // YYYY-MM-DD

    // Check deduplication (1 impression per session per campaign per day)
    const existing = await ctx.db
      .query("adEvents")
      .withIndex("by_campaign_dedup", (q) =>
        q
          .eq("campaignId", args.campaignId)
          .eq("eventType", "impression")
          .eq("viewerSessionId", args.sessionId)
          .eq("dateBucket", dateBucket)
      )
      .first();

    if (existing) {
      return { recorded: false, deduplicated: true };
    }

    let viewerUserId: any = undefined;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await getUserByAuthIdentity(ctx, identity);
      if (user) viewerUserId = user._id;
    }

    // Pricing model: ₦2.00 per impression (200 kobo CPM = ₦2,000 / 1000)
    const impressionCostKobo = 200;
    const newSpent = Math.min(campaign.budget.spentKobo + impressionCostKobo, campaign.budget.totalBudgetKobo);

    // Record Event
    await ctx.db.insert("adEvents", {
      campaignId: args.campaignId,
      eventType: "impression",
      viewerUserId,
      viewerSessionId: args.sessionId,
      chargeKobo: impressionCostKobo,
      timestamp: now,
      dateBucket,
      locationName: args.locationName,
    });

    // Update campaign metrics & budget
    const isCompleted = newSpent >= campaign.budget.totalBudgetKobo;
    await ctx.db.patch(args.campaignId, {
      impressionsCount: (campaign.impressionsCount || 0) + 1,
      budget: {
        ...campaign.budget,
        spentKobo: newSpent,
      },
      status: isCompleted ? "completed" : campaign.status,
      updatedAt: now,
    });

    return { recorded: true, newSpentKobo: newSpent };
  },
});

/**
 * Record a click on a sponsored creative
 */
export const recordAdClick = mutation({
  args: {
    campaignId: v.id("adCampaigns"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    const now = Date.now();
    if (!campaign || campaign.status !== "active" || campaign.moderationStatus !== "approved" || campaign.schedule.startDate > now || campaign.schedule.endDate <= now || campaign.budget.spentKobo >= campaign.budget.totalBudgetKobo) return { recorded: false };
    const dateBucket = new Date(now).toISOString().split("T")[0];

    let viewerUserId: any = undefined;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await getUserByAuthIdentity(ctx, identity);
      if (user) viewerUserId = user._id;
    }

    // Pricing model: ₦10.00 per verified click (1,000 kobo)
    const clickCostKobo = 1000;
    const existingClick = await ctx.db.query("adEvents").withIndex("by_campaign_dedup", (q) => q.eq("campaignId", args.campaignId).eq("eventType", "click").eq("viewerSessionId", args.sessionId).eq("dateBucket", dateBucket)).first();
    if (existingClick) return { recorded: false, deduplicated: true, destinationUrl: campaign.creative.destinationUrl };
    const newSpent = Math.min(campaign.budget.spentKobo + clickCostKobo, campaign.budget.totalBudgetKobo);

    await ctx.db.insert("adEvents", {
      campaignId: args.campaignId,
      eventType: "click",
      viewerUserId,
      viewerSessionId: args.sessionId,
      chargeKobo: clickCostKobo,
      timestamp: now,
      dateBucket,
    });

    const isCompleted = newSpent >= campaign.budget.totalBudgetKobo;
    await ctx.db.patch(args.campaignId, {
      clicksCount: (campaign.clicksCount || 0) + 1,
      budget: {
        ...campaign.budget,
        spentKobo: newSpent,
      },
      status: isCompleted ? "completed" : campaign.status,
      updatedAt: now,
    });

    return {
      recorded: true,
      destinationUrl: campaign.creative.destinationUrl,
    };
  },
});

/**
 * Helper to calculate haversine distance in km
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
