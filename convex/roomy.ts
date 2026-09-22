import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────
// ROOMY PAGE BOOTSTRAP
// ─────────────────────────────────────────────────────────────

export const bootstrapRoomyPage = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new ConvexError("User not found");

    // Check if Roomy page already exists
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_username", (q) => q.eq("username", "roomy"))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create Roomy Page
    const pageId = await ctx.db.insert("pages", {
      ownerId: user._id,
      name: "Roomy",
      username: "roomy",
      type: "community",
      description: "The official Lalao housing and roommate marketplace. Find rooms, find roommates, and list properties for free.",
      location: "Global",
      activeTools: ["roomy"], // Special active tool flag to trigger the Roomy UI tab
      followersCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return pageId;
  },
});

// ─────────────────────────────────────────────────────────────
// ROOMY PROFILES
// ─────────────────────────────────────────────────────────────

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    return await ctx.db
      .query("roomyProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    university: v.optional(v.string()),
    campus: v.optional(v.string()),
    preferredLocation: v.optional(v.string()),
    preferredAreas: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    roomType: v.optional(v.string()),
    moveInPeriod: v.optional(v.string()),
    roommatePreferences: v.optional(v.string()),
    roommatesWanted: v.optional(v.number()),
    lifestyle: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const existing = await ctx.db
      .query("roomyProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("roomyProfiles", {
        userId: user._id,
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────
// ROOMY LISTINGS
// ─────────────────────────────────────────────────────────────

export const createListing = mutation({
  args: {
    type: v.union(v.literal("room_offered"), v.literal("room_wanted"), v.literal("roommate_wanted")),
    title: v.optional(v.string()),
    description: v.string(),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    location: v.string(),
    university: v.optional(v.string()),
    campus: v.optional(v.string()),
    area: v.optional(v.string()),
    roomType: v.optional(v.string()),
    availabilityDate: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    photos: v.optional(v.array(v.string())),
    roommatesNeeded: v.optional(v.number()),
    preferences: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const listingId = await ctx.db.insert("roomyListings", {
      userId: user._id,
      status: "active",
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return listingId;
  },
});

export const updateListingStatus = mutation({
  args: {
    listingId: v.id("roomyListings"),
    status: v.union(v.literal("active"), v.literal("filled"), v.literal("inactive"), v.literal("removed")),
  },
  handler: async (ctx, { listingId, status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new ConvexError("Listing not found");

    // Only owner or admin can update
    if (listing.userId !== user._id && user.role !== "super_admin" && user.role !== "admin") {
      throw new ConvexError("Unauthorized");
    }

    await ctx.db.patch(listingId, { status, updatedAt: Date.now() });
  },
});

export const getListings = query({
  args: {
    type: v.optional(v.union(v.literal("room_offered"), v.literal("room_wanted"), v.literal("roommate_wanted"))),
    locationQuery: v.optional(v.string()),
  },
  handler: async (ctx, { type, locationQuery }) => {
    let query = ctx.db.query("roomyListings").withIndex("by_status", (q) => q.eq("status", "active"));

    const listings = await query.order("desc").collect();

    // In-memory filter for now for simplicity, can be optimized later with searchIndex
    let filtered = listings;
    
    if (type) {
      filtered = filtered.filter(l => l.type === type);
    }

    if (locationQuery) {
      const q = locationQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.location.toLowerCase().includes(q) || 
        (l.university && l.university.toLowerCase().includes(q)) || 
        (l.campus && l.campus.toLowerCase().includes(q)) ||
        (l.area && l.area.toLowerCase().includes(q))
      );
    }

    // Join user info
    return Promise.all(
      filtered.map(async (l) => {
        const owner = await ctx.db.get(l.userId);
        return {
          ...l,
          owner: {
            _id: owner?._id,
            name: owner?.name,
            username: owner?.username,
            avatarUrl: owner?.avatarUrl,
            avatarStorageId: owner?.avatarStorageId,
          }
        };
      })
    );
  },
});

export const getListing = query({
  args: { listingId: v.id("roomyListings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;

    const owner = await ctx.db.get(listing.userId);
    const ownerProfile = await ctx.db.query("roomyProfiles").withIndex("by_user", (q) => q.eq("userId", listing.userId)).unique();

    return {
      ...listing,
      owner: {
        _id: owner?._id,
        name: owner?.name,
        username: owner?.username,
        avatarUrl: owner?.avatarUrl,
        avatarStorageId: owner?.avatarStorageId,
      },
      ownerProfile,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SAVED LISTINGS
// ─────────────────────────────────────────────────────────────

export const toggleSaveListing = mutation({
  args: { listingId: v.id("roomyListings") },
  handler: async (ctx, { listingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const existing = await ctx.db
      .query("roomySaves")
      .withIndex("by_user_listing", (q) => q.eq("userId", user._id).eq("listingId", listingId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("roomySaves", {
        userId: user._id,
        listingId,
        createdAt: Date.now(),
      });
      return true;
    }
  },
});

export const getSavedListings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const saves = await ctx.db
      .query("roomySaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const listings = await Promise.all(
      saves.map(async (save) => {
        const listing = await ctx.db.get(save.listingId);
        if (!listing) return null;

        const owner = await ctx.db.get(listing.userId);
        return {
          ...listing,
          owner: {
            _id: owner?._id,
            name: owner?.name,
            username: owner?.username,
            avatarUrl: owner?.avatarUrl,
          }
        };
      })
    );

    return listings.filter((l) => l !== null);
  },
});

export const isListingSaved = query({
  args: { listingId: v.id("roomyListings") },
  handler: async (ctx, { listingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return false;

    const existing = await ctx.db
      .query("roomySaves")
      .withIndex("by_user_listing", (q) => q.eq("userId", user._id).eq("listingId", listingId))
      .unique();

    return !!existing;
  },
});

// ─────────────────────────────────────────────────────────────
// INSPECTIONS
// ─────────────────────────────────────────────────────────────

export const requestInspection = mutation({
  args: {
    listingId: v.id("roomyListings"),
    proposedDate: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { listingId, proposedDate, message }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new ConvexError("Listing not found");

    if (listing.userId === user._id) {
      throw new ConvexError("Cannot request inspection on your own listing");
    }

    const inspectionId = await ctx.db.insert("roomyInspections", {
      requesterId: user._id,
      ownerId: listing.userId,
      listingId,
      status: "pending",
      proposedDate,
      message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return inspectionId;
  },
});

export const getMyInspections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { requested: [], received: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return { requested: [], received: [] };

    const requested = await ctx.db
      .query("roomyInspections")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .order("desc")
      .collect();

    const received = await ctx.db
      .query("roomyInspections")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();

    const enrich = async (inspection: any) => {
      const listing = await ctx.db.get(inspection.listingId);
      const otherUserId = inspection.requesterId === user._id ? inspection.ownerId : inspection.requesterId;
      const otherUser = await ctx.db.get(otherUserId as Id<"users">);
      return {
        ...inspection,
        listing,
        otherUser: {
          _id: otherUser?._id,
          name: otherUser?.name,
          username: otherUser?.username,
          avatarUrl: otherUser?.avatarUrl,
        }
      };
    };

    return {
      requested: await Promise.all(requested.map(enrich)),
      received: await Promise.all(received.map(enrich)),
    };
  },
});

export const updateInspectionStatus = mutation({
  args: {
    inspectionId: v.id("roomyInspections"),
    status: v.union(v.literal("accepted"), v.literal("declined"), v.literal("rescheduled")),
    newDate: v.optional(v.string()),
  },
  handler: async (ctx, { inspectionId, status, newDate }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");

    const inspection = await ctx.db.get(inspectionId);
    if (!inspection) throw new ConvexError("Inspection not found");

    // Only the owner can accept/decline
    if (inspection.ownerId !== user._id) {
      throw new ConvexError("Unauthorized");
    }

    const updates: any = { status, updatedAt: Date.now() };
    if (status === "rescheduled" && newDate) {
      updates.proposedDate = newDate;
    }

    await ctx.db.patch(inspectionId, updates);
  },
});
