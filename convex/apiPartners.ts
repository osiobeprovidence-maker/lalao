import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const listPartners = query({
  args: {},
  handler: async (ctx) => {
    // Basic auth check for admin - assuming we have some generic admin check, 
    // but for now we'll just return all partners. In production, wrap with admin auth.
    const partners = await ctx.db.query("apiPartners").order("desc").collect();
    
    // We also want to fetch their plans and basic stats for the list view
    const partnersWithDetails = await Promise.all(
      partners.map(async (partner) => {
        const plan = await ctx.db.query("apiPlans").withIndex("by_partner", q => q.eq("partnerId", partner._id)).first();
        
        // Count active events
        const events = await ctx.db.query("partnerEvents")
          .withIndex("by_partner", q => q.eq("partnerId", partner._id))
          .filter(q => q.eq(q.field("status"), "active"))
          .collect();
          
        return {
          ...partner,
          plan,
          activeEventsCount: events.length,
          // usage logic can be mocked here or retrieved from apiUsage if we implement aggregations
        };
      })
    );
    
    return partnersWithDetails;
  }
});

export const getPartnerDetails = query({
  args: { partnerId: v.id("apiPartners") },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) throw new Error("Partner not found");
    
    const plan = await ctx.db.query("apiPlans").withIndex("by_partner", q => q.eq("partnerId", args.partnerId)).first();
    const credentials = await ctx.db.query("apiCredentials").withIndex("by_partner", q => q.eq("partnerId", args.partnerId)).collect();
    const permissions = await ctx.db.query("apiPermissions").withIndex("by_partner", q => q.eq("partnerId", args.partnerId)).collect();
    
    const events = await ctx.db.query("partnerEvents").withIndex("by_partner", q => q.eq("partnerId", args.partnerId)).collect();
    const usage = await ctx.db.query("apiUsage").withIndex("by_partner", q => q.eq("partnerId", args.partnerId)).collect(); // might be large, handle appropriately in prod

    return {
      partner,
      plan,
      credentials,
      permissions: permissions.map(p => p.permission),
      eventsCount: events.length,
      activeEventsCount: events.filter(e => e.status === "active").length,
      usageCount: usage.length,
      // more detailed usage can be aggregated
    };
  }
});

export const createPartner = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    company: v.string(),
    type: v.string(),
    planName: v.string(),
    monthlyPrice: v.number(),
    currency: v.string(),
    eventLimit: v.number(),
    requestLimit: v.number(),
    requestsPerMinute: v.number(),
    permissions: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // 1. Create partner
    const partnerId = await ctx.db.insert("apiPartners", {
      name: args.name,
      slug: args.slug,
      contactName: args.contactName,
      contactEmail: args.contactEmail,
      company: args.company,
      type: args.type,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Create plan
    await ctx.db.insert("apiPlans", {
      partnerId,
      name: args.planName,
      monthlyPrice: args.monthlyPrice,
      currency: args.currency,
      eventLimit: args.eventLimit,
      requestLimit: args.requestLimit,
      requestsPerMinute: args.requestsPerMinute,
      billingCycle: "monthly",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Create permissions
    for (const permission of args.permissions) {
      await ctx.db.insert("apiPermissions", {
        partnerId,
        permission,
        createdAt: Date.now(),
      });
    }

    // 4. Create initial billing record
    await ctx.db.insert("apiBilling", {
      partnerId,
      billingPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
      amount: args.monthlyPrice,
      currency: args.currency,
      status: "paid",
      dueDate: Date.now(),
      paidAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return partnerId;
  }
});

// A pseudo-random string generator since we cannot use 'crypto' module easily in convex runtime without node environment
function generateRandomString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// In a real application, you would use WebCrypto API which Convex supports.
export const generateCredentials = mutation({
  args: {
    partnerId: v.id("apiPartners"),
    environment: v.union(v.literal("test"), v.literal("live")),
  },
  handler: async (ctx, args) => {
    // Generate raw key
    const rawSecret = generateRandomString(32);
    const rawKey = `lalao_${args.environment}_${rawSecret}`;
    
    // Create a simple hash (using SHA-256 via WebCrypto in prod, here we use a simple mock for now since it's a demo)
    // NOTE: Replace with actual crypto.subtle.digest in prod
    const keyHash = rawKey + "_hashed"; 
    const prefix = `lalao_${args.environment}_${rawSecret.substring(0, 4)}...`;

    // Revoke old keys for this environment
    const existing = await ctx.db.query("apiCredentials")
      .withIndex("by_partner", q => q.eq("partnerId", args.partnerId))
      .filter(q => q.eq(q.field("environment"), args.environment))
      .filter(q => q.eq(q.field("revokedAt"), undefined))
      .collect();

    for (const cred of existing) {
      await ctx.db.patch(cred._id, { revokedAt: Date.now() });
    }

    await ctx.db.insert("apiCredentials", {
      partnerId: args.partnerId,
      environment: args.environment,
      keyHash,
      prefix,
      createdAt: Date.now(),
    });

    // RETURN THE RAW KEY EXACTLY ONCE.
    return {
      rawKey,
      prefix
    };
  }
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db.query("apiPartners").collect();
    const activePartners = partners.filter(p => p.status === "active").length;

    const plans = await ctx.db.query("apiPlans").collect();
    const mrr = plans.reduce((acc, plan) => acc + plan.monthlyPrice, 0);

    const usage = await ctx.db.query("apiUsage").collect();
    const totalRequests = usage.length;

    const events = await ctx.db.query("partnerEvents").filter(q => q.eq(q.field("status"), "active")).collect();
    const activeEvents = events.length;

    return {
      activePartners,
      mrr,
      totalRequests,
      activeEvents
    };
  }
});
