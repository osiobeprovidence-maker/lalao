import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getFeatureFlagsInternal } from "./platformSettings";

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

    const memberships = await ctx.db
      .query("pageMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pagesWithRoles = (await Promise.all(
      memberships.map(async (m) => {
        const page = await ctx.db.get(m.pageId);
        return page ? { page, role: m.role } : null;
      })
    )).filter((item): item is NonNullable<typeof item> => item !== null);

    const flags = await getFeatureFlagsInternal(ctx);

    const filteredItems = flags.communityEnabled 
      ? pagesWithRoles 
      : pagesWithRoles.filter(item => item.page.type !== "community");

    return Promise.all(filteredItems.map(async ({ page, role }) => {
      const events = await ctx.db
        .query("pageEvents")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .collect();

      return {
        id: page._id,
        ownerId: page.ownerId,
        name: page.name,
        username: page.username,
        type: page.type,
        badge: page.badge ?? (page.type === "organization" ? "ORG" : page.type === "business" ? "BIZ" : "COMMUNITY"),
        avatar: page.avatar ?? "",
        coverImage: page.coverImage ?? "",
        description: page.description ?? "",
        location: page.location ?? "",
        followersCount: page.followersCount ?? 0,
        isFollowing: true,
        isOwner: role === "owner",
        role: role,
        category: page.category ?? "",
        aboutInfo: page.aboutInfo ?? {},
        businessType: page.businessType,
        activeTools: page.activeTools,
        globalDiscoveryStatus: page.globalDiscoveryStatus ?? "global",
        serviceAreas: page.serviceAreas ?? [],
        isOnlineBusiness: page.isOnlineBusiness ?? false,
        events: events.map(e => ({
          id: e._id,
          pageId: e.pageId,
          organizationName: page.name,
          organizationAvatar: page.avatar ?? "",
          organizationBadge: page.badge ?? "ORG",
          title: e.title,
          type: e.type,
          coverImage: e.coverImage ?? "",
          date: e.date,
          time: e.time,
          location: e.location,
          isOnline: e.isOnline,
          registrationStatus: e.registrationStatus,
          isTournament: e.isTournament,
          isTicketed: e.isTicketed,
          ticketPrice: e.ticketPrice,
          prizePool: e.prizePool,
          prizeCurrency: e.prizeCurrency,
          description: e.description,
          availableTickets: e.availableTickets,
          totalTickets: e.totalTickets,
          rules: e.rules,
          schedule: e.schedule,
        })),
      };
    }));
  },
});

export const listDiscoverablePages = query({
  args: {},
  handler: async (ctx) => {
    const flags = await getFeatureFlagsInternal(ctx);
    const pages = await ctx.db.query("pages").collect();
    
    // Check viewer identity to mark isOwner and role accurately
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: any = null;
    let userMemberships: any[] = [];
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
      if (user) {
        currentUserId = user._id;
        userMemberships = await ctx.db
          .query("pageMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
      }
    }

    // Filter out community pages if disabled
    const filteredPages = flags.communityEnabled 
      ? pages 
      : pages.filter(p => p.type !== "community");

    return Promise.all(filteredPages.map(async (page) => {
      const events = await ctx.db
        .query("pageEvents")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .collect();

      const mem = userMemberships.find(m => m.pageId === page._id);
      const isOwner = Boolean(currentUserId && page.ownerId === currentUserId) || mem?.role === "owner";
      const role = mem?.role || (isOwner ? "owner" : undefined);

      return {
        id: page._id,
        ownerId: page.ownerId,
        name: page.name,
        username: page.username,
        type: page.type,
        badge: page.badge ?? (page.type === "organization" ? "ORG" : page.type === "business" ? "BIZ" : "COMMUNITY"),
        businessType: page.businessType,
        activeTools: page.activeTools ?? [],
        description: page.description ?? "",
        globalDiscoveryStatus: page.globalDiscoveryStatus,
        serviceAreas: page.serviceAreas ?? [],
        isOnlineBusiness: page.isOnlineBusiness,
        location: page.location,
        latitude: (page as any).latitude,
        longitude: (page as any).longitude,
        avatar: page.avatar,
        coverImage: page.coverImage,
        category: page.category,
        aboutInfo: page.aboutInfo,
        followersCount: page.followersCount ?? 0,
        isOwner,
        role,
        events: events.map(e => ({
          id: e._id,
          pageId: e.pageId,
          organizationName: page.name,
          organizationAvatar: page.avatar ?? "",
          organizationBadge: page.badge ?? "ORG",
          title: e.title,
          type: e.type,
          coverImage: e.coverImage ?? "",
          date: e.date,
          time: e.time,
          location: e.location,
          isOnline: e.isOnline,
          registrationStatus: e.registrationStatus,
          isTournament: e.isTournament,
          isTicketed: e.isTicketed,
          ticketPrice: e.ticketPrice,
          prizePool: e.prizePool,
          prizeCurrency: e.prizeCurrency,
          description: e.description,
          availableTickets: e.availableTickets,
          totalTickets: e.totalTickets,
          rules: e.rules,
          schedule: e.schedule,
        })),
      };
    }));
  },
});

export const getMyFollowedCommunities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const follows = await ctx.db
      .query("pageFollowers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (follows.length === 0) return [];

    const followedPageIds = follows.map((follow: any) => follow.pageId);

    const pages = await Promise.all(
      followedPageIds.map(async (pageId) => await ctx.db.get(pageId))
    );

    const flags = await getFeatureFlagsInternal(ctx);
    if (!flags.communityEnabled) return [];

    return pages
      .filter((page: any) => page && page.type === "community")
      .map((page: any) => ({
        _id: page._id,
        id: page._id,
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
        isOwner: false,
        category: page.category ?? "",
        aboutInfo: page.aboutInfo ?? {},
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
    globalDiscoveryStatus: v.optional(v.union(v.literal("global"), v.literal("national"), v.literal("regional"), v.literal("local"))),
    serviceAreas: v.optional(v.array(v.string())),
    isOnlineBusiness: v.optional(v.boolean()),
    activeTools: v.optional(v.array(v.string())),
    teamInvites: v.optional(v.array(v.object({
      username: v.string(),
      role: v.union(v.literal("admin"), v.literal("staff"), v.literal("editor")),
    }))),
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

    if (args.type === "community") {
      const flags = await getFeatureFlagsInternal(ctx);
      if (!flags.communityEnabled) {
        throw new Error("Community feature is currently disabled.");
      }
    }

    const now = Date.now();
    const newPageId = await ctx.db.insert("pages", {
      ownerId: user._id, // Legacy compatibility
      name: args.name,
      username: args.username.replace('@', ''),
      type: args.type,
      badge: badgeMap[args.type],
      description: args.description,
      location: args.location,
      avatar: args.avatar,
      coverImage: args.coverImage,
      category: args.category,
      activeTools: args.activeTools ?? [],
      globalDiscoveryStatus: args.globalDiscoveryStatus ?? "global",
      serviceAreas: args.serviceAreas ?? [],
      isOnlineBusiness: args.isOnlineBusiness ?? false,
      followersCount: 1, // Default followers (owner)
      createdAt: now,
      updatedAt: now,
    });

    // Add to pageMembers table
    await ctx.db.insert("pageMembers", {
      pageId: newPageId,
      userId: user._id,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    // Automatically make the owner a follower
    await ctx.db.insert("pageFollowers", {
      userId: user._id,
      pageId: newPageId,
      createdAt: now,
    });

    // Process team invitations
    if (args.teamInvites && args.teamInvites.length > 0) {
      for (const invite of args.teamInvites) {
        const invitedUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q: any) => q.eq("username", invite.username))
          .first();
        if (invitedUser) {
          await ctx.db.insert("pageMembers", {
            pageId: newPageId,
            userId: invitedUser._id,
            role: invite.role,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

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
    globalDiscoveryStatus: v.optional(v.union(v.literal("global"), v.literal("national"), v.literal("regional"), v.literal("local"))),
    serviceAreas: v.optional(v.array(v.string())),
    isOnlineBusiness: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("business"), v.literal("organization"), v.literal("club"), v.literal("community"))),
    badge: v.optional(v.union(v.literal("BIZ"), v.literal("ORG"), v.literal("CLUB"), v.literal("COMMUNITY"))),
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
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized: Only owners and admins can update the page");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.location !== undefined) updates.location = args.location;
    const isSystemManagedMedia = (page.username === "roomy" || page.username === "lalao") && user.role !== "super_admin";
    if (args.avatar !== undefined && !isSystemManagedMedia) updates.avatar = args.avatar;
    if (args.coverImage !== undefined && !isSystemManagedMedia) updates.coverImage = args.coverImage;
    if (args.type !== undefined) updates.type = args.type;
    if (args.badge !== undefined) updates.badge = args.badge;
    if (args.aboutInfo !== undefined) {
      updates.aboutInfo = {
        ...page.aboutInfo,
        ...args.aboutInfo,
      };
    }
    if (args.globalDiscoveryStatus !== undefined) updates.globalDiscoveryStatus = args.globalDiscoveryStatus;
    if (args.serviceAreas !== undefined) updates.serviceAreas = args.serviceAreas;
    if (args.isOnlineBusiness !== undefined) updates.isOnlineBusiness = args.isOnlineBusiness;

    await ctx.db.patch(args.pageId, updates);
  },
});

export const deletePage = mutation({
  args: {
    pageId: v.id("pages"),
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
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!membership || membership.role !== "owner") {
      throw new Error("Unauthorized: Only the owner can delete the page");
    }

    // We can just delete the page, related data deletion would be handled by cascades or cleanups
    await ctx.db.delete(args.pageId);
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
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized: Insufficient permissions to update business settings");
    }

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

// Location management for pages
export const getPageLocations = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pageLocations")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();
  }
});

export const addPageLocation = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.string(),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.boolean(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
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
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    // If setting as primary, we should probably clear other primaries, but skipping for simplicity unless needed
    return await ctx.db.insert("pageLocations", {
      pageId: args.pageId,
      name: args.name,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
      isPrimary: args.isPrimary,
      address: args.address,
      phone: args.phone,
      hours: args.hours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
});

export const updatePageLocation = mutation({
  args: {
    locationId: v.id("pageLocations"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.optional(v.boolean()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const locationDoc = await ctx.db.get(args.locationId);
    if (!locationDoc) throw new Error("Location not found");
    
    const page = await ctx.db.get(locationDoc.pageId);
    if (!page) throw new Error("Page not found");
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", page._id).eq("userId", user._id))
      .first();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.location !== undefined) updates.location = args.location;
    if (args.latitude !== undefined) updates.latitude = args.latitude;
    if (args.longitude !== undefined) updates.longitude = args.longitude;
    if (args.isPrimary !== undefined) updates.isPrimary = args.isPrimary;
    if (args.address !== undefined) updates.address = args.address;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.hours !== undefined) updates.hours = args.hours;

    await ctx.db.patch(args.locationId, updates);
  }
});

export const removePageLocation = mutation({
  args: {
    locationId: v.id("pageLocations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const locationDoc = await ctx.db.get(args.locationId);
    if (!locationDoc) throw new Error("Location not found");
    
    const page = await ctx.db.get(locationDoc.pageId);
    if (!page) throw new Error("Page not found");
    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", page._id).eq("userId", user._id))
      .first();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.locationId);
  }
});

// ========== PAGE MEMBERS ==========

export const getPageMembers = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("pageMembers")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    return Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          id: m._id,
          userId: m.userId,
          role: m.role,
          username: user?.username ?? "unknown",
          name: user?.name ?? "Unknown",
          avatar: (user as any)?.profileImage ?? "",
          createdAt: m.createdAt,
        };
      })
    );
  },
});

export const invitePageMember = mutation({
  args: {
    pageId: v.id("pages"),
    username: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff"), v.literal("editor")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    // Check caller is owner or admin
    const callerMembership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "admin")) {
      throw new Error("Unauthorized: Only owners and admins can invite members");
    }

    // Find the invited user by username
    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", args.username))
      .first();
    if (!invitedUser) throw new Error("User not found with that username");

    // Check they aren't already a member
    const existingMembership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", invitedUser._id))
      .first();
    if (existingMembership) throw new Error("User is already a member of this page");

    const now = Date.now();
    await ctx.db.insert("pageMembers", {
      pageId: args.pageId,
      userId: invitedUser._id,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const removePageMember = mutation({
  args: {
    pageId: v.id("pages"),
    memberId: v.id("pageMembers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const callerMembership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();
    if (!callerMembership || callerMembership.role !== "owner") {
      throw new Error("Unauthorized: Only owners can remove members");
    }

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");
    if (targetMember.role === "owner") throw new Error("Cannot remove the owner");

    await ctx.db.delete(args.memberId);
    return { success: true };
  },
});

/**
 * leavePageManagement
 * Allows a non-owner team member (admin, editor, moderator) to remove
 * themselves from a page's management team.
 * Owners cannot use this — they must transfer ownership or delete the page.
 */
export const leavePageManagement = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const membership = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId).eq("userId", user._id))
      .first();

    if (!membership) throw new Error("You are not a member of this page");
    if (membership.role === "owner") {
      throw new Error("Owners cannot leave a page. Transfer ownership or delete the page instead.");
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});

