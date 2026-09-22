import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthedUser } from "./social";
import { Id } from "./_generated/dataModel";

/* ─────────────────────────────────────────────────────────────────────────────
   COMMUNITY SUGGESTIONS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Submit a community suggestion. This does NOT create a community — it creates
 * a pending suggestion record for Admin review.
 */
export const submitSuggestion = mutation({
  args: {
    communityName: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    reason: v.optional(v.string()),
    additionalInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("You must be logged in to suggest a community.");

    if (!args.communityName.trim()) {
      throw new ConvexError("Community name is required.");
    }
    if (!args.description.trim()) {
      throw new ConvexError("A description of the community is required.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("communitySuggestions", {
      suggestedByUserId: user._id,
      communityName: args.communityName.trim(),
      description: args.description.trim(),
      category: args.category?.trim() || undefined,
      location: args.location?.trim() || undefined,
      website: args.website?.trim() || undefined,
      reason: args.reason?.trim() || undefined,
      additionalInfo: args.additionalInfo?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Get the current user's submitted suggestions.
 */
export const getMySuggestions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return [];

    const suggestions = await ctx.db
      .query("communitySuggestions")
      .withIndex("by_user", (q: any) => q.eq("suggestedByUserId", user._id))
      .order("desc")
      .collect();

    return suggestions;
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN: COMMUNITY SUGGESTION REVIEW
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * List all community suggestions. Admin-only.
 */
export const listSuggestions = query({
  args: {
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const role = user.role ?? "user";
    if (!["admin", "super_admin"].includes(role)) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    let suggestions;
    if (args.statusFilter && ["pending", "under_review", "approved", "rejected"].includes(args.statusFilter)) {
      suggestions = await ctx.db
        .query("communitySuggestions")
        .withIndex("by_status", (q: any) => q.eq("status", args.statusFilter))
        .order("desc")
        .collect();
    } else {
      suggestions = await ctx.db
        .query("communitySuggestions")
        .order("desc")
        .collect();
    }

    // Resolve suggester profiles
    const detailed = await Promise.all(
      suggestions.map(async (s) => {
        const suggester = await ctx.db.get(s.suggestedByUserId as Id<"users">);
        return {
          ...s,
          suggester: suggester
            ? {
                id: suggester._id,
                name: suggester.name ?? "User",
                username: suggester.username ?? "user",
                avatar: suggester.avatarUrl || "",
              }
            : null,
        };
      })
    );

    return detailed;
  },
});

/**
 * Review a community suggestion. Admin-only.
 * Updates status and writes to auditLog.
 */
export const reviewSuggestion = mutation({
  args: {
    suggestionId: v.id("communitySuggestions"),
    newStatus: v.union(
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const role = user.role ?? "user";
    if (!["admin", "super_admin"].includes(role)) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new ConvexError("Suggestion not found");

    const oldStatus = suggestion.status;
    const now = Date.now();

    let publishedPageId = suggestion.publishedPageId;

    // Idempotent community creation on approval
    if (args.newStatus === "approved" && !publishedPageId) {
      const slugBase = suggestion.communityName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const username = slugBase.length > 0 ? slugBase : `community${Date.now()}`;
      
      publishedPageId = await ctx.db.insert("pages", {
        ownerId: suggestion.suggestedByUserId,
        name: suggestion.communityName,
        username: username,
        type: "community",
        badge: "COMMUNITY",
        description: suggestion.description,
        category: suggestion.category,
        location: suggestion.location || "Global",
        followersCount: 1,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("pageFollowers", {
        userId: suggestion.suggestedByUserId,
        pageId: publishedPageId,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.suggestionId, {
      status: args.newStatus,
      reviewedAt: now,
      reviewedBy: user._id,
      adminNotes: args.adminNotes ?? suggestion.adminNotes,
      updatedAt: now,
      publishedPageId,
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      actorId: user._id,
      action: "review_community_suggestion",
      target: `communitySuggestion:${args.suggestionId}`,
      before: JSON.stringify({ status: oldStatus }),
      after: JSON.stringify({ status: args.newStatus, adminNotes: args.adminNotes }),
      createdAt: now,
    });

    // Notify the suggester
    try {
      const statusLabel =
        args.newStatus === "approved"
          ? "approved"
          : args.newStatus === "rejected"
          ? "not approved"
          : "under review";

      await ctx.db.insert("notifications", {
        recipientId: suggestion.suggestedByUserId,
        actorId: user._id,
        type: "system_alert" as any,
        targetExcerpt: `Your community suggestion "${suggestion.communityName}" has been ${statusLabel}.`,
        isRead: false,
        createdAt: now,
      });
    } catch (e) {
      console.error("Failed to insert notification", e);
      // Non-critical — don't fail the mutation if notification insert fails
    }

    return { success: true };
  },
});
