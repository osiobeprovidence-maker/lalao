import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

export const createRally = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    location: v.string(),
    timeDate: v.string(),
    category: v.union(
      v.literal("Sports"),
      v.literal("Help"),
      v.literal("Meetup"),
      v.literal("Initiative"),
      v.literal("Civic"),
      v.literal("General")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const now = Date.now();
    const rallyId = await ctx.db.insert("rallies", {
      creatorId: user._id,
      title: args.title,
      description: args.description,
      location: args.location,
      latitude: user.latitude,
      longitude: user.longitude,
      distanceMeters: 0,
      timeDate: args.timeDate,
      category: args.category,
      status: "active",
      tags: [args.category, "LocalRally"],
      createdAt: now,
    });

    // Automatically join the creator
    await ctx.db.insert("rallyParticipants", {
      userId: user._id,
      rallyId,
      createdAt: now,
    });

    // Create a broadcast post for this rally
    await ctx.db.insert("posts", {
      authorId: user._id,
      text: `⚡ RALLY: ${args.title} — ${args.description}`,
      location: args.location,
      latitude: user.latitude,
      longitude: user.longitude,
      createdAt: now,
      likesCount: 1, // Auto-like by creator conceptually
      commentsCount: 0,
      repostsCount: 0,
      rallyRefId: rallyId,
    });

    return rallyId;
  },
});

export const toggleJoinRally = mutation({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("rallyId"), args.rallyId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // Left rally
    } else {
      await ctx.db.insert("rallyParticipants", {
        userId: user._id,
        rallyId: args.rallyId,
        createdAt: Date.now(),
      });
      return true; // Joined rally
    }
  },
});

export const listActiveRallies = query({
  args: {},
  handler: async (ctx) => {
    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(20);

    const results = await Promise.all(
      rallies.map(async (rally) => {
        const creator = await ctx.db.get(rally.creatorId);
        
        // Count participants
        const participants = await ctx.db
          .query("rallyParticipants")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();

        // Get interested users (up to 3 for preview)
        const interestedUsers = await Promise.all(
          participants.slice(0, 3).map(async (p) => {
            const u = await ctx.db.get(p.userId);
            return u ? {
              id: u._id,
              name: u.name || "Unknown",
              username: u.username || "unknown",
              avatar: u.avatarUrl || "",
              userType: u.userType || "person",
              followersCount: u.followersCount || 0,
              followingCount: u.followingCount || 0,
              isFollowing: false,
              isVerified: false,
            } : null;
          })
        );

        let isJoined = false;
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
          if (user) {
            isJoined = participants.some((p) => p.userId === user._id);
          }
        }

        return {
          id: rally._id,
          creator: creator ? {
            id: creator._id,
            name: creator.name || "Unknown",
            username: creator.username || "unknown",
            avatar: creator.avatarUrl || "",
            userType: creator.userType || "person",
            followersCount: creator.followersCount || 0,
            followingCount: creator.followingCount || 0,
            isFollowing: false,
            isVerified: false,
          } : null,
          title: rally.title,
          description: rally.description,
          location: rally.location,
          latitude: rally.latitude,
          longitude: rally.longitude,
          distanceMeters: rally.distanceMeters,
          timeDate: rally.timeDate,
          category: rally.category,
          status: rally.status,
          maxNeeded: rally.maxNeeded,
          urgency: rally.urgency,
          tags: rally.tags,
          joinedUsersCount: participants.length,
          isJoined,
          interestedUsers: interestedUsers.filter(Boolean),
        };
      })
    );

    return results;
  },
});
