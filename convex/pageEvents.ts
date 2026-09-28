import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

export const createPageEvent = mutation({
  args: {
    pageId: v.id("pages"),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
    registrationStatus: v.optional(v.string()),
    isTournament: v.optional(v.boolean()),
    isTicketed: v.optional(v.boolean()),
    ticketPrice: v.optional(v.number()),
    prizePool: v.optional(v.number()),
    prizeCurrency: v.optional(v.string()),
    description: v.optional(v.string()),
    availableTickets: v.optional(v.number()),
    totalTickets: v.optional(v.number()),
    rules: v.optional(v.string()),
    schedule: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Unauthorized to create events for this page");
    }

    const eventId = await ctx.db.insert("pageEvents", {
      pageId: args.pageId,
      title: args.title || 'New Community Event',
      type: args.type || 'community',
      coverImage: args.coverImage || page.coverImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
      date: args.date || 'Upcoming',
      time: args.time || 'TBD',
      location: args.location || page.location || '',
      isOnline: args.isOnline ?? false,
      registrationStatus: args.registrationStatus || 'open',
      isTournament: args.isTournament ?? false,
      isTicketed: args.isTicketed ?? false,
      ticketPrice: args.ticketPrice,
      prizePool: args.prizePool,
      prizeCurrency: args.prizeCurrency || 'NGN',
      description: args.description || '',
      availableTickets: args.availableTickets || 100,
      totalTickets: args.totalTickets || 100,
      rules: args.rules,
      schedule: args.schedule,
      createdAt: Date.now(),
    });

    return eventId;
  },
});

export const listPageEvents = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("pageEvents")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .collect();
      
    return events;
  },
});
