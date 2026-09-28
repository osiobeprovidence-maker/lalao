import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthedUser } from "./social";

/**
 * Helper to check admin access
 */
async function requireAdmin(ctx: any) {
  const user = await getAuthedUser(ctx);
  if (!user) throw new Error("Unauthenticated");
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

// --------------------------------------------------
// ADMIN MUTATIONS
// --------------------------------------------------

export const addRecommendationSeed = mutation({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("user"), v.literal("page"), v.literal("community")),
    category: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Check if it already exists
    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        category: args.category,
        priority: args.priority,
        active: true,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("recommendations", {
      targetId: args.targetId,
      targetType: args.targetType,
      category: args.category,
      priority: args.priority,
      active: true,
      addedBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const removeRecommendationSeed = mutation({
  args: { targetId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        active: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// --------------------------------------------------
// USER QUERIES
// --------------------------------------------------

export const getOnboardingRecommendations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) return [];

    const limit = args.limit ?? 20;

    // Fetch active recommendations
    const activeRecs = await ctx.db
      .query("recommendations")
      .withIndex("by_active_priority", (q) => q.eq("active", true))
      .order("desc")
      .take(limit * 2); // Fetch extra to account for filtering

    if (activeRecs.length === 0) return [];

    // Get current user's follows to filter them out
    const userFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();
    const followedUserIds = new Set(userFollows.map((f) => f.followingId));

    // Get current user's page follows
    const pageFollows = await ctx.db
      .query("pageFollowers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const followedPageIds = new Set(pageFollows.map((f) => f.pageId));

    // Get dismissals
    const dismissals = await ctx.db
      .query("recommendationDismissals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const dismissedIds = new Set(dismissals.map((d) => d.targetId));

    const results = [];
    
    for (const rec of activeRecs) {
      if (results.length >= limit) break;

      if (dismissedIds.has(rec.targetId)) continue;

      if (rec.targetType === "user") {
        if (followedUserIds.has(rec.targetId as Id<"users">)) continue;
        if (rec.targetId === user._id) continue; // Don't recommend self

        const targetUser = await ctx.db.get(rec.targetId as Id<"users">);
        if (!targetUser || targetUser.suspended) continue;

        results.push({
          id: targetUser._id,
          type: "user",
          name: targetUser.name || "Unknown",
          username: targetUser.username || "unknown",
          avatar: targetUser.avatarUrl || "",
          description: targetUser.bio || "",
          followersCount: targetUser.followersCount || 0,
          category: rec.category,
        });
      } else if (rec.targetType === "page" || rec.targetType === "community") {
        if (followedPageIds.has(rec.targetId as Id<"pages">)) continue;

        const targetPage = await ctx.db.get(rec.targetId as Id<"pages">);
        if (!targetPage) continue;

        results.push({
          id: targetPage._id,
          type: rec.targetType,
          name: targetPage.name,
          username: targetPage.username,
          avatar: targetPage.avatar || "",
          description: targetPage.description || targetPage.category || "",
          followersCount: targetPage.followersCount || 0,
          category: rec.category,
        });
      }
    }

    return results;
  },
});

// --------------------------------------------------
// USER MUTATIONS
// --------------------------------------------------

export const dismissRecommendation = mutation({
  args: { targetId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    // Check if already dismissed
    const existing = await ctx.db
      .query("recommendationDismissals")
      .withIndex("by_user_target", (q) => 
        q.eq("userId", user._id).eq("targetId", args.targetId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("recommendationDismissals", {
        userId: user._id,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
    }
  },
});

// --------------------------------------------------
// ADMIN QUERIES
// --------------------------------------------------
export const getAllRecommendations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const recs = await ctx.db.query("recommendations").order("desc").collect();
    
    // Resolve names for easier admin view
    const resolved = await Promise.all(recs.map(async (rec) => {
      let name = "Unknown";
      let handle = "";
      if (rec.targetType === "user") {
        const user = await ctx.db.get(rec.targetId as Id<"users">);
        if (user) {
          name = user.name || "Unknown";
          handle = user.username || "";
        }
      } else {
        const page = await ctx.db.get(rec.targetId as Id<"pages">);
        if (page) {
          name = page.name;
          handle = page.username;
        }
      }
      return { ...rec, targetName: name, targetHandle: handle };
    }));
    return resolved;
  }
});
