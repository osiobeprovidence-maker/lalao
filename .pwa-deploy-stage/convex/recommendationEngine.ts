import { v } from "convex/values";
import { mutation, query, action, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthedUser, resolveUserVerification } from "./social";

export const trackInteraction = mutation({
  args: {
    targetId: v.string(),
    recommendationType: v.string(),
    action: v.union(v.literal("shown"), v.literal("clicked"), v.literal("dismissed"), v.literal("followed"), v.literal("liked"), v.literal("opened")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) return;

    await ctx.db.insert("recommendationInteractions", {
      userId: user._id,
      recommendationType: args.recommendationType,
      targetId: args.targetId,
      action: args.action,
      createdAt: Date.now(),
    });
    
    // Also add to dismissals if action is "dismissed" for legacy support
    if (args.action === "dismissed") {
      const existingDismissal = await ctx.db
        .query("recommendationDismissals")
        .withIndex("by_user_target", (q) => 
          q.eq("userId", user._id).eq("targetId", args.targetId)
        )
        .first();

      if (!existingDismissal) {
        await ctx.db.insert("recommendationDismissals", {
          userId: user._id,
          targetId: args.targetId,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const getSuggestedForYou = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()), // simple pagination 
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const limit = args.limit || 20;
    
    let recommendations: any[] = [];
    let dismissedIds = new Set<string>();
    let followedUserIds = new Set<string>();
    let followedPageIds = new Set<string>();

    if (user) {
      // Get dismissals
      const dismissals = await ctx.db
        .query("recommendationInteractions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter(q => q.eq(q.field("action"), "dismissed"))
        .collect();
      
      const legacyDismissals = await ctx.db
        .query("recommendationDismissals")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
        
      dismissals.forEach(d => dismissedIds.add(d.targetId));
      legacyDismissals.forEach(d => dismissedIds.add(d.targetId));

      // Get Follows
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .collect();
      follows.forEach(f => followedUserIds.add(f.followingId));

      const pageFollows = await ctx.db
        .query("pageFollowers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      pageFollows.forEach(f => followedPageIds.add(f.pageId));
    }

    // 1. PEOPLE RECOMMENDATIONS (Phase 2)
    const recentUsers = await ctx.db.query("users").order("desc").take(50);
    for (const u of recentUsers) {
      if (!user || (u._id !== user._id && !followedUserIds.has(u._id) && !dismissedIds.has(u._id) && !u.suspended)) {
        let userAvatar = u.avatarUrl || "";
        if (!userAvatar && (u as any).avatarStorageId) {
          try {
            const signed = await ctx.storage.getUrl((u as any).avatarStorageId);
            if (signed) userAvatar = signed;
          } catch (_) {}
        }
        if (!userAvatar && (u as any).avatar) {
          userAvatar = (u as any).avatar;
        }

        recommendations.push({
          type: "person",
          targetId: u._id,
          score: u.followersCount || 0, // Fallback popularity score
          reason: "Popular among people with similar interests",
          data: {
            id: u._id,
            name: u.name || "Unknown",
            username: u.username || "unknown",
            ...resolveUserVerification(u),
            avatar: userAvatar,
            description: u.bio || "",
            followersCount: u.followersCount || 0,
            isFollowing: false,
          }
        });
      }
    }

    // 2. POST RECOMMENDATIONS (Phase 3)
    const recentPosts = await ctx.db.query("posts").order("desc").take(50);
    for (const p of recentPosts) {
      if (p.moderationStatus === "removed" || p.moderationStatus === "flagged") continue;
      if (dismissedIds.has(p._id)) continue;
      if (user && p.authorId === user._id) continue;
      if (p.audience && p.audience !== "everyone" && p.audience !== "nearby") continue; // simplified access check

      let postMedia = p.mediaUrl;
      if (!postMedia && p.mediaStorageId) {
        try {
          const signed = await ctx.storage.getUrl(p.mediaStorageId);
          if (signed) postMedia = signed;
        } catch (_) {}
      }

      recommendations.push({
        type: "post",
        targetId: p._id,
        score: (p.likesCount || 0) + (p.commentsCount || 0) * 2, // Simple trending score
        reason: "Because you may like this",
        data: {
          id: p._id,
          authorId: p.authorId,
          text: p.text,
          mediaUrl: postMedia,
          mediaType: p.mediaType,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          repostsCount: p.repostsCount,
          createdAt: p.createdAt,
        }
      });
    }

    // 3. PAGE RECOMMENDATIONS (Phase 4)
    const recentPages = await ctx.db.query("pages").order("desc").take(50);
    for (const page of recentPages) {
      if (user && (followedPageIds.has(page._id) || page.ownerId === user._id)) continue;
      if (dismissedIds.has(page._id)) continue;

      recommendations.push({
        type: "page",
        targetId: page._id,
        score: page.followersCount || 0,
        reason: "Pages you may like",
        data: {
          id: page._id,
          name: page.name,
          username: page.username,
          avatar: page.avatar || "",
          description: page.description || page.category || "",
          followersCount: page.followersCount || 0,
          isFollowing: false,
        }
      });
    }

    // Sort by score (mixing feeds intelligently later)
    recommendations.sort((a, b) => b.score - a.score);

    // Limit and return
    return recommendations.slice(0, limit);
  }
});
