import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a subscription listing and its slots (Admin only)
export const createListing = mutation({
  args: {
    pageId: v.id("pages"),
    platformId: v.optional(v.id("subscriptionPlatforms")),
    platformName: v.optional(v.string()),
    platformLogo: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    totalAccountCost: v.number(),
    currency: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    totalCapacity: v.number(),
    defaultSlotPrice: v.number(),
    allowDifferentSlotPrices: v.boolean(),
    accountEmail: v.optional(v.string()),
    providerTag: v.optional(v.string()),
    privateNotes: v.optional(v.string()),
    memberInstructions: v.optional(v.string()),
    benefits: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Only the page owner can create subscriptions");
    }

    const listingId = await ctx.db.insert("subscriptionListings", {
      ...args,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Generate the slots
    for (let i = 1; i <= args.totalCapacity; i++) {
      await ctx.db.insert("subscriptionSlots", {
        subscriptionId: listingId,
        pageId: args.pageId,
        slotNumber: i,
        status: "available",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return listingId;
  },
});

// Get public subscription listings for a page
export const getListingsByPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
      
    // Fetch slots for each listing to determine availability
    const results = await Promise.all(
      listings.map(async (listing) => {
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
          .collect();
          
        const availableSlots = slots.filter(s => s.status === "available").length;
        
        return {
          ...listing,
          // Do not return private fields
          accountEmail: undefined,
          providerTag: undefined,
          privateNotes: undefined,
          availableSlots,
          slotsCount: slots.length,
        };
      })
    );

    return results;
  },
});

// Atomic Slot Purchase (Join)
export const joinSlot = mutation({
  args: {
    subscriptionId: v.id("subscriptionListings"),
    role: v.union(v.literal("Head of Family"), v.literal("Member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || !subscription.active) {
      throw new Error("Subscription not found or inactive");
    }

    // 1. Check if user already has an active membership for this subscription
    const existingMembership = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user_subscription", (q) => 
        q.eq("userId", user._id).eq("subscriptionId", args.subscriptionId)
      )
      .filter(q => q.neq(q.field("status"), "cancelled"))
      .first();
      
    if (existingMembership) {
      throw new Error("You already have an active membership for this subscription");
    }

    // 2. Find an available slot
    const slot = await ctx.db
      .query("subscriptionSlots")
      .withIndex("by_subscription_status", (q) => 
        q.eq("subscriptionId", subscription._id).eq("status", "available")
      )
      .first();
      
    if (!slot) {
      throw new Error("No slots available");
    }

    // 3. Check wallet balance
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
      
    if (!wallet) {
      throw new Error("Wallet not initialized");
    }
    
    const price = slot.priceOverride ?? subscription.defaultSlotPrice;
    if (wallet.balance < price) {
      throw new Error("Insufficient wallet balance");
    }

    // 4. Atomically execute all updates

    // Deduct wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - price,
      updatedAt: Date.now(),
    });

    // Create wallet transaction
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: price,
      type: "subscription_payment",
      status: "completed",
      description: `Payment for ${subscription.name} - Slot ${slot.slotNumber}`,
      createdAt: Date.now(),
    });

    // Reserve slot
    await ctx.db.patch(slot._id, {
      status: "occupied",
      currentMemberId: user._id,
      role: args.role,
      updatedAt: Date.now(),
    });

    // Calculate billing cycle dates
    const now = Date.now();
    let nextRenewal = now;
    if (subscription.billingCycle === "monthly") {
      nextRenewal += 30 * 24 * 60 * 60 * 1000;
    } else if (subscription.billingCycle === "quarterly") {
      nextRenewal += 90 * 24 * 60 * 60 * 1000;
    } else if (subscription.billingCycle === "yearly") {
      nextRenewal += 365 * 24 * 60 * 60 * 1000;
    }

    // Create membership
    const membershipId = await ctx.db.insert("subscriptionMemberships", {
      userId: user._id,
      pageId: subscription.pageId,
      subscriptionId: subscription._id,
      slotId: slot._id,
      role: args.role,
      status: "active",
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: nextRenewal,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
    
    // Fire Notification
    const page = await ctx.db.get(subscription.pageId);
    if (page) {
      // Notify the customer
      await ctx.db.insert("notifications", {
        recipientId: user._id,
        actorId: page.ownerId, // Business owner
        type: "follow", // Resuing an existing valid type for the prototype, ideally we'd add 'subscription_joined'
        targetExcerpt: `You're now a member of ${subscription.name}.`,
        isRead: false,
        createdAt: now,
      });
      
      // Notify the business owner
      await ctx.db.insert("notifications", {
        recipientId: page.ownerId,
        actorId: user._id, 
        type: "follow",
        targetExcerpt: `${user.name} joined ${subscription.name} (Slot ${slot.slotNumber}).`,
        isRead: false,
        createdAt: now,
      });
    }

    return membershipId;
  },
});

// Get user's subscriptions
export const getMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return [];

    const memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (mem) => {
        const subscription = await ctx.db.get(mem.subscriptionId);
        const page = await ctx.db.get(mem.pageId);
        const slot = await ctx.db.get(mem.slotId);
        return {
          ...mem,
          subscription,
          page,
          slot,
        };
      })
    );

    return results;
  },
});

// Cancel membership
export const cancelMembership = mutation({
  args: { membershipId: v.id("subscriptionMemberships") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");

    if (membership.userId !== user._id) {
      throw new Error("Unauthorized to cancel this membership");
    }

    await ctx.db.patch(membership._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });
  },
});

// CRM: Get Subscriptions for a Page (Admin)
export const getCRMData = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page || page.ownerId !== user._id) throw new Error("Unauthorized");

    const listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();
      
    let totalRevenue = 0;
    
    const detailedListings = await Promise.all(
      listings.map(async (listing) => {
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
          .collect();
          
        const activeMembers = slots.filter(s => s.status === "occupied");
        
        let listingRevenue = 0;
        const slotsWithMembers = await Promise.all(slots.map(async (s) => {
          let member = null;
          let membership = null;
          if (s.currentMemberId) {
            member = await ctx.db.get(s.currentMemberId);
            membership = await ctx.db
              .query("subscriptionMemberships")
              .withIndex("by_slot", (q) => q.eq("slotId", s._id))
              .filter(q => q.eq(q.field("status"), "active"))
              .first();
              
            listingRevenue += s.priceOverride ?? listing.defaultSlotPrice;
          }
          return {
            ...s,
            member,
            membership,
          };
        }));
        
        totalRevenue += listingRevenue;

        return {
          ...listing,
          slots: slotsWithMembers,
          stats: {
            totalCapacity: listing.totalCapacity,
            occupied: activeMembers.length,
            available: listing.totalCapacity - activeMembers.length,
            currentRevenue: listingRevenue,
            potentialRevenue: listing.totalCapacity * listing.defaultSlotPrice,
            potentialMargin: (listing.totalCapacity * listing.defaultSlotPrice) - listing.totalAccountCost,
          }
        };
      })
    );

    return {
      listings: detailedListings,
      summary: {
        totalSubscriptions: listings.length,
        totalActiveMembers: detailedListings.reduce((acc, l) => acc + l.stats.occupied, 0),
        totalAvailableSlots: detailedListings.reduce((acc, l) => acc + l.stats.available, 0),
        monthlyRevenue: totalRevenue,
      }
    };
  }
});

// Get Public Subscriptions for a Page (Customers)
export const getPageSubscriptions = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const result = await Promise.all(
      listings.map(async (listing) => {
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
          .collect();

        const occupied = slots.filter(s => s.status === "occupied").length;
        return {
          ...listing,
          slotsCount: slots.length,
          availableSlots: slots.length - occupied,
        };
      })
    );
    return result;
  }
});

export const getMyMemberships = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return [];

    const memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const detailed = await Promise.all(
      memberships.map(async (m) => {
        const page = await ctx.db.get(m.pageId);
        const listing = await ctx.db.get(m.subscriptionId);
        const slot = await ctx.db.get(m.slotId);

        return {
          ...m,
          page,
          plan: listing,
          slot,
        };
      })
    );

    return detailed;
  }
});
