import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a subscription plan (Admin only)
export const createPlan = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    billingInterval: v.union(v.literal("monthly"), v.literal("yearly")),
    benefits: v.array(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to createPlan");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Only the page owner can create subscription plans");
    }

    const planId = await ctx.db.insert("subscriptionPlans", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return planId;
  },
});

// Update a subscription plan (Admin only)
export const updatePlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingInterval: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    benefits: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to updatePlan");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    const page = await ctx.db.get(plan.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Only the page owner can update subscription plans");
    }

    const { planId, ...updates } = args;

    await ctx.db.patch(planId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Get plans for a specific page (Public)
export const getPlansByPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();
      
    return plans.sort((a, b) => a.price - b.price);
  },
});

// Subscribe to a plan (Customer)
export const subscribeToPlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to subscribeToPlan");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (!plan.active) throw new Error("Cannot subscribe to an inactive plan");

    // Check if user already has an active or pending subscription for this plan
    const existingSub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_page", (q) => q.eq("userId", user._id).eq("pageId", plan.pageId))
      .filter((q) => q.eq(q.field("planId"), plan._id))
      .first();

    if (existingSub && (existingSub.status === "active" || existingSub.status === "pending")) {
      throw new Error(`You already have an ${existingSub.status} subscription to this plan`);
    }

    const now = Date.now();
    const subscriptionId = await ctx.db.insert("userSubscriptions", {
      userId: user._id,
      pageId: plan.pageId,
      planId: plan._id,
      status: "pending", // Payment needs to be confirmed first
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    return subscriptionId;
  },
});

// Cancel a subscription (Customer)
export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("userSubscriptions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to cancelSubscription");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) throw new Error("Subscription not found");

    if (sub.userId !== user._id) {
      throw new Error("You can only cancel your own subscriptions");
    }

    await ctx.db.patch(args.subscriptionId, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
      // status: "cancelled", // In a real system, status becomes cancelled at period end, but for simplicity here we just flag it
    });
  },
});

// Get authenticated user's subscriptions
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

    const subscriptions = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Hydrate with plan and page data
    const hydratedSubs = [];
    for (const sub of subscriptions) {
      const plan = await ctx.db.get(sub.planId);
      const page = await ctx.db.get(sub.pageId);
      
      if (plan && page) {
        hydratedSubs.push({
          ...sub,
          plan,
          page: {
            id: page._id,
            name: page.name,
            avatar: page.avatar,
            username: page.username,
          }
        });
      }
    }

    return hydratedSubs;
  },
});
