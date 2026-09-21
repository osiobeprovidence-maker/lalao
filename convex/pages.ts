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
      aboutInfo: page.aboutInfo ?? {},
      businessType: page.businessType,
      activeTools: page.activeTools,
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

export const updatePage = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    aboutInfo: v.optional(v.object({
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string()),
      hours: v.optional(v.string()),
      founded: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");
    if (page.ownerId !== user._id) throw new Error("Unauthorized: Only the owner can update the page");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.location !== undefined) updates.location = args.location;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.aboutInfo !== undefined) {
      updates.aboutInfo = {
        ...page.aboutInfo,
        ...args.aboutInfo,
      };
    }

    await ctx.db.patch(args.pageId, updates);
  },
});

export const updatePageBusinessSettings = mutation({
  args: {
    pageId: v.id("pages"),
    businessType: v.union(v.literal("commerce"), v.literal("subscription"), v.literal("hybrid")),
    activeTools: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");
    if (page.ownerId !== user._id) throw new Error("Unauthorized: Only the owner can update the page");

    await ctx.db.patch(args.pageId, {
      businessType: args.businessType,
      activeTools: args.activeTools,
      updatedAt: Date.now(),
    });
  }
});

export const getPageRelationship = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isFollowing: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) return { isFollowing: false };

    const existing = await ctx.db
      .query("pageFollowers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .unique();

    return { isFollowing: !!existing };
  }
});

export const toggleFollowPage = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, { pageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
      
    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId === user._id) {
      throw new Error("Cannot follow your own page");
    }

    const existing = await ctx.db
      .query("pageFollowers")
      .withIndex("by_page_user", (q) => q.eq("pageId", pageId).eq("userId", user._id))
      .unique();

    if (existing) {
      // Unfollow
      await ctx.db.delete(existing._id);
      await ctx.db.patch(pageId, {
        followersCount: Math.max(0, (page.followersCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
      return { isFollowing: false };
    }

    // Follow
    await ctx.db.insert("pageFollowers", {
      userId: user._id,
      pageId: pageId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(pageId, {
      followersCount: (page.followersCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Notify the page owner
    await ctx.db.insert("notifications", {
      recipientId: page.ownerId,
      actorId: user._id,
      type: "follow",
      targetExcerpt: `followed your page ${page.name}`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { isFollowing: true };
  }
});
