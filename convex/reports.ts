import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

export const createReport = mutation({
  args: {
    targetType: v.union(
      v.literal("post"),
      v.literal("user"),
      v.literal("page"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("product"),
      v.literal("event"),
      v.literal("message"),
      v.literal("other")
    ),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("User not found");

    const reportId = await ctx.db.insert("reports", {
      reporterId: user._id,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      description: args.description,
      priority: args.priority || "normal",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return reportId;
  }
});

export const listReports = query({
  args: {
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    targetType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let q = ctx.db.query("reports").order("desc");

    // We can't chain multiple index filters natively without breaking the order if we use .withIndex()
    // but we can filter in memory since this is a basic implementation. For production, we'd use index.
    const allReports = await q.take(args.limit || 100);

    return allReports.filter(r => {
      if (args.status && args.status !== "all" && r.status !== args.status) return false;
      if (args.priority && args.priority !== "all" && r.priority !== args.priority) return false;
      if (args.targetType && args.targetType !== "all" && r.targetType !== args.targetType) return false;
      return true;
    });
  }
});

export const getReportDetails = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    const reporter = await ctx.db.get(report.reporterId);
    
    let targetData = null;

    if (report.targetType === "post") {
      const post = await ctx.db.get(report.targetId as any);
      if (post) {
        const author = await ctx.db.get((post as any).authorId);
        targetData = {
          ...post,
          authorName: (author as any)?.name || (author as any)?.username,
          authorUsername: (author as any)?.username,
          authorAvatar: (author as any)?.avatarUrl,
        };
      }
    } else if (report.targetType === "user") {
      const u = await ctx.db.get(report.targetId as any);
      targetData = u;
    }

    return {
      ...report,
      reporterName: reporter?.name || reporter?.username,
      reporterUsername: reporter?.username,
      targetData
    };
  }
});

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("dismissed"),
      v.literal("escalated")
    ),
    resolution: v.optional(v.string()),
    resolutionNote: v.optional(v.string()),
    moderationReasonId: v.optional(v.id("moderationReasons")),
    violationLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdmin(ctx);

    const updateFields: any = {
      status: args.status,
      updatedAt: Date.now()
    };

    if (args.status === "resolved" || args.status === "dismissed") {
      updateFields.resolvedAt = Date.now();
      updateFields.resolvedBy = adminUser._id;
      if (args.resolution) updateFields.resolution = args.resolution;
      if (args.resolutionNote) updateFields.resolutionNote = args.resolutionNote;
      if (args.violationLevel) updateFields.violationLevel = args.violationLevel;

      if (args.moderationReasonId) {
        const reasonDoc = await ctx.db.get(args.moderationReasonId);
        if (reasonDoc) {
          updateFields.moderationReasonId = args.moderationReasonId;
          updateFields.moderationReasonCode = reasonDoc.code;
          updateFields.userNotificationMessage = reasonDoc.userMessage;
        }
      }
    } else if (args.status === "under_review") {
      // Just record the admin note if supplied, or severity if we want to store it early
      if (args.resolutionNote) updateFields.resolutionNote = args.resolutionNote;
    }

    await ctx.db.patch(args.reportId, updateFields);
  }
});
