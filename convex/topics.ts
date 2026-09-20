import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

export const listActiveTopics = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_active_order", (q) => q.eq("active", true))
      .collect();

    return topics;
  },
});

export const updateUserHomePreference = mutation({
  args: {
    slug: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const preferences = user.homeFeedPreferences || {};
    preferences[args.slug] = args.enabled;

    let interests = user.interests || [];
    if (args.enabled) {
      if (!interests.includes(args.slug)) {
        interests.push(args.slug);
      }
    } else {
      interests = interests.filter((i: string) => i !== args.slug);
    }

    await ctx.db.patch(user._id, {
      homeFeedPreferences: preferences,
      interests: interests,
    });
  },
});

export const seedTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("topics").collect();
    if (existing.length > 0) {
      return "Topics already seeded";
    }

    const initialTopics = [
      {
        slug: "anime",
        displayName: "Anime",
        description: "Anime, manga, manhwa, anime recommendations, discussions, edits, creators and related content.",
        displayOrder: 10,
        defaultEnabled: false,
        userSelectable: true,
        homeEnabled: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        slug: "gaming",
        displayName: "Gaming",
        description: "Gaming, gameplay, game clips, esports, reviews, recommendations and gaming creators.",
        displayOrder: 20,
        defaultEnabled: false,
        userSelectable: true,
        homeEnabled: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        slug: "stem",
        displayName: "STEM",
        description: "Science, technology, engineering, mathematics, educational content and learning.",
        displayOrder: 30,
        defaultEnabled: false,
        userSelectable: true,
        homeEnabled: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        slug: "drama",
        displayName: "Drama",
        description: "Drama, storytelling, entertainment and related community content.",
        displayOrder: 40,
        defaultEnabled: true,
        userSelectable: false, // Handled automatically
        homeEnabled: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];

    for (const topic of initialTopics) {
      await ctx.db.insert("topics", topic);
    }

    return "Successfully seeded topics";
  },
});
