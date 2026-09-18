import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyPages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const pages = await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return pages.map(page => ({
      id: page._id,
      ownerId: page.ownerId,
      name: page.name,
      username: page.username,
      type: page.type,
      badge: page.badge ?? "COMMUNITY",
      avatar: page.avatar ?? "",
      coverImage: page.coverImage ?? "",
      description: page.description ?? "",
      location: page.location ?? "",
      followersCount: page.followersCount ?? 0,
      isFollowing: true,
      isOwner: true,
      category: page.category ?? "",
    }));
  },
});

export const createPage = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.union(v.literal("business"), v.literal("organization"), v.literal("club"), v.literal("community")),
    location: v.string(),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const badgeMap: Record<string, "BIZ" | "ORG" | "CLUB" | "COMMUNITY"> = {
      business: "BIZ",
      organization: "ORG",
      club: "CLUB",
      community: "COMMUNITY",
    };

    const now = Date.now();
    const newPageId = await ctx.db.insert("pages", {
      ownerId: user._id,
      name: args.name,
      username: args.username.replace('@', ''),
      type: args.type,
      badge: badgeMap[args.type],
      description: args.description,
      location: args.location,
      avatar: args.avatar,
      coverImage: args.coverImage,
      category: args.category,
      followersCount: 1, // Default followers (owner)
      createdAt: now,
      updatedAt: now,
    });

    // Automatically make the owner a follower
    await ctx.db.insert("pageFollowers", {
      userId: user._id,
      pageId: newPageId,
      createdAt: now,
    });

    return newPageId;
  },
});
