import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

/**
 * Standard Seed Topics with Categories and Sensitivity Safeguards
 */
export const DEFAULT_PLATFORM_TOPICS = [
  {
    slug: "lgbtq_queer",
    displayName: "LGBTQ+ and Queer Community",
    description: "Discussions, stories, and culture from LGBTQ+ and queer creators and allies",
    category: "Identity & Community",
    icon: "🌈",
    isSensitive: true,
    requiresExplicitOptIn: true,
    requiresCreatorConfirmation: true,
    allowAutoSuggestion: false,
    allowPublicAnalytics: false,
    active: true,
    displayOrder: 1,
  },
  {
    slug: "anime_manga",
    displayName: "Anime and Manga",
    description: "Series discussions, fanart, recommendations, and manga releases",
    category: "Entertainment",
    icon: "🎌",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 2,
  },
  {
    slug: "gaming",
    displayName: "Gaming",
    description: "Esports, game launches, gameplay clips, hardware, and tips",
    category: "Entertainment",
    icon: "🎮",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 3,
  },
  {
    slug: "technology_ai",
    displayName: "Technology and Artificial Intelligence",
    description: "Software engineering, gadgets, AI tools, tech startups, and coding",
    category: "Tech & Science",
    icon: "💻",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 4,
  },
  {
    slug: "music",
    displayName: "Music",
    description: "Afrobeats, playlists, production, artists, music videos, and concerts",
    category: "Creative Arts",
    icon: "🎵",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 5,
  },
  {
    slug: "fashion_lifestyle",
    displayName: "Fashion and Lifestyle",
    description: "Outfits, street style, beauty, home decor, wellness, and grooming",
    category: "Lifestyle",
    icon: "👗",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 6,
  },
  {
    slug: "education",
    displayName: "Education",
    description: "Study tips, tutorials, scholarships, learning materials, and research",
    category: "Learning",
    icon: "📚",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 7,
  },
  {
    slug: "business_entrepreneurship",
    displayName: "Business and Entrepreneurship",
    description: "Marketing, freelancing, commerce, funding, and career growth",
    category: "Business",
    icon: "💼",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 8,
  },
  {
    slug: "sports",
    displayName: "Sports",
    description: "Football, basketball, athletics, fitness, workouts, and sports news",
    category: "Lifestyle",
    icon: "⚽",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 9,
  },
  {
    slug: "religion_spirituality",
    displayName: "Religion and Spirituality",
    description: "Faith, inspirational reflections, spiritual growth, and devotional practices",
    category: "Beliefs & Society",
    icon: "🕊️",
    isSensitive: true,
    requiresExplicitOptIn: true,
    requiresCreatorConfirmation: true,
    allowAutoSuggestion: false,
    allowPublicAnalytics: false,
    active: true,
    displayOrder: 10,
  },
  {
    slug: "politics_civic",
    displayName: "Politics and Civic Discussions",
    description: "Current affairs, governance, public policy, and social advocacy",
    category: "Beliefs & Society",
    icon: "🏛️",
    isSensitive: true,
    requiresExplicitOptIn: true,
    requiresCreatorConfirmation: true,
    allowAutoSuggestion: false,
    allowPublicAnalytics: false,
    active: true,
    displayOrder: 11,
  },
  {
    slug: "entertainment",
    displayName: "Entertainment",
    description: "Movies, Nollywood, celebrity news, comedy skits, and pop culture",
    category: "Entertainment",
    icon: "🎬",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 12,
  },
  {
    slug: "relationships_social",
    displayName: "Relationships and Social Issues",
    description: "Dating stories, friendships, family dynamics, and social commentary",
    category: "Lifestyle",
    icon: "💬",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 13,
  },
  {
    slug: "art_creativity",
    displayName: "Art and Creativity",
    description: "Digital illustration, graphic design, photography, poetry, and craft",
    category: "Creative Arts",
    icon: "🎨",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    active: true,
    displayOrder: 14,
  },
  {
    slug: "local_community",
    displayName: "Communities and Local Discussions",
    description: "Neighborhood updates, city events, local food spots, and neighborhood happenings",
    category: "Community & Identity",
    icon: "📍",
    isSensitive: false,
    requiresExplicitOptIn: false,
    requiresCreatorConfirmation: false,
    allowAutoSuggestion: true,
    allowPublicAnalytics: true,
    displayOrder: 15,
    defaultEnabled: false,
    userSelectable: true,
    homeEnabled: true,
    active: true,
  },
];

/**
 * Seed or retrieve all active platform topics
 */
export const listPlatformTopics = query({
  args: {
    includeSensitive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if topics are seeded in database
    const dbTopics = await ctx.db
      .query("topics")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    if (dbTopics.length > 0) {
      return dbTopics.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
    }

    // Fallback to in-memory defaults if not yet seeded
    return DEFAULT_PLATFORM_TOPICS;
  },
});

/**
 * Alias for backward-compat with PostComposer
 */
export const listActiveTopics = listPlatformTopics;

async function applyTopicPreference(ctx: any, topicSlug: string, preference: "interested" | "reduced" | "excluded" | "none") {
  const user = await getAuthedUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const existing = await ctx.db
    .query("userTopicPreferences")
    .withIndex("by_user_topic", (q: any) => q.eq("userId", user._id).eq("topicSlug", topicSlug))
    .first();

  const now = Date.now();

  if (preference === "none") {
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true, topicSlug, preference: "none" };
  }

  if (existing) {
    await ctx.db.patch(existing._id, {
      preference,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("userTopicPreferences", {
      userId: user._id,
      topicSlug,
      preference,
      updatedAt: now,
    });
  }

  return { success: true, topicSlug, preference };
}

/**
 * Backward-compatible mutation name used by the app before the topic API was renamed.
 */
export const updateUserHomePreference = mutation({
  args: {
    slug: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, { slug, enabled }) => {
    return applyTopicPreference(ctx, slug, enabled ? "interested" : "none");
  },
});

/**
 * Seed default platform topics (Idempotent mutation)
 */
export const seedDefaultTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    for (const t of DEFAULT_PLATFORM_TOPICS) {
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_slug", (q) => q.eq("slug", t.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("topics", {
          ...t,
          defaultEnabled: false,
          userSelectable: true,
          homeEnabled: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return { success: true, count: DEFAULT_PLATFORM_TOPICS.length };
  },
});

/**
 * Get current authenticated user's content topic preferences
 * Protected endpoint: Returns private preferences strictly for the caller
 */
export const getMyContentPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) {
      return {
        isAuthenticated: false,
        interestedSlugs: [],
        reducedSlugs: [],
        excludedSlugs: [],
      };
    }

    const prefs = await ctx.db
      .query("userTopicPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const interestedSlugs: string[] = [];
    const reducedSlugs: string[] = [];
    const excludedSlugs: string[] = [];

    for (const p of prefs) {
      if (p.preference === "interested") interestedSlugs.push(p.topicSlug);
      else if (p.preference === "reduced") reducedSlugs.push(p.topicSlug);
      else if (p.preference === "excluded") excludedSlugs.push(p.topicSlug);
    }

    return {
      isAuthenticated: true,
      userId: user._id,
      interestedSlugs,
      reducedSlugs,
      excludedSlugs,
    };
  },
});

/**
 * Update a single topic preference for the authenticated user
 */
export const setTopicPreference = mutation({
  args: {
    topicSlug: v.string(),
    preference: v.union(
      v.literal("interested"),
      v.literal("reduced"),
      v.literal("excluded"),
      v.literal("none") // Remove preference
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userTopicPreferences")
      .withIndex("by_user_topic", (q) =>
        q.eq("userId", user._id).eq("topicSlug", args.topicSlug)
      )
      .first();

    const now = Date.now();

    if (args.preference === "none") {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return { success: true, topicSlug: args.topicSlug, preference: "none" };
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        preference: args.preference,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userTopicPreferences", {
        userId: user._id,
        topicSlug: args.topicSlug,
        preference: args.preference,
        updatedAt: now,
      });
    }

    return { success: true, topicSlug: args.topicSlug, preference: args.preference };
  },
});

/**
 * Bulk save/update content preferences for user
 */
export const saveBulkContentPreferences = mutation({
  args: {
    interestedSlugs: v.array(v.string()),
    reducedSlugs: v.array(v.string()),
    excludedSlugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Retrieve existing preferences
    const existing = await ctx.db
      .query("userTopicPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Map existing by topicSlug
    const existingMap = new Map(existing.map((p) => [p.topicSlug, p]));
    const now = Date.now();

    // Desired map
    const targetMap = new Map<string, "interested" | "reduced" | "excluded">();
    for (const slug of args.interestedSlugs) targetMap.set(slug, "interested");
    for (const slug of args.reducedSlugs) targetMap.set(slug, "reduced");
    for (const slug of args.excludedSlugs) targetMap.set(slug, "excluded");

    // Update or insert
    for (const [slug, pref] of targetMap.entries()) {
      const current = existingMap.get(slug);
      if (current) {
        if (current.preference !== pref) {
          await ctx.db.patch(current._id, { preference: pref, updatedAt: now });
        }
      } else {
        await ctx.db.insert("userTopicPreferences", {
          userId: user._id,
          topicSlug: slug,
          preference: pref,
          updatedAt: now,
        });
      }
    }

    // Delete records no longer in targetMap
    for (const [slug, record] of existingMap.entries()) {
      if (!targetMap.has(slug)) {
        await ctx.db.delete(record._id);
      }
    }

    return { success: true };
  },
});

/**
 * Clear all content preferences for user (Reset to platform default)
 */
export const resetContentPreferences = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userTopicPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    return { success: true, clearedCount: existing.length };
  },
});

import { requireAdmin } from "./admin";

/**
 * Admin: Add or update a topic
 */
export const upsertTopic = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    icon: v.optional(v.string()),
    isSensitive: v.boolean(),
    requiresExplicitOptIn: v.boolean(),
    requiresCreatorConfirmation: v.boolean(),
    allowAutoSuggestion: v.boolean(),
    allowPublicAnalytics: v.boolean(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Admin authorization check
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName.trim(),
        description: args.description?.trim(),
        category: args.category.trim(),
        icon: args.icon,
        isSensitive: args.isSensitive,
        requiresExplicitOptIn: args.requiresExplicitOptIn,
        requiresCreatorConfirmation: args.requiresCreatorConfirmation,
        allowAutoSuggestion: args.allowAutoSuggestion,
        allowPublicAnalytics: args.allowPublicAnalytics,
        active: args.active,
        updatedAt: now,
      });
      return { success: true, topicId: existing._id };
    } else {
      const topicId = await ctx.db.insert("topics", {
        slug: args.slug,
        displayName: args.displayName.trim(),
        description: args.description?.trim() || "",
        category: args.category.trim(),
        icon: args.icon,
        isSensitive: args.isSensitive,
        requiresExplicitOptIn: args.requiresExplicitOptIn,
        requiresCreatorConfirmation: args.requiresCreatorConfirmation,
        allowAutoSuggestion: args.allowAutoSuggestion,
        allowPublicAnalytics: args.allowPublicAnalytics,
        active: args.active,
        displayOrder: 99,
        defaultEnabled: false,
        userSelectable: true,
        homeEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, topicId };
    }
  },
});

/**
 * Add or register a custom topic for users (self-service from Manage Topics drawer)
 */
export const addCustomTopic = mutation({
  args: {
    topicName: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.userId) {
      const normId = ctx.db.normalizeId("users", args.userId);
      if (normId) {
        user = await ctx.db.get(normId);
      }
    }
    if (!user) throw new Error("Please sign in to add a custom topic");

    const trimmed = args.topicName.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new Error("Topic name must be at least 2 characters");
    }

    // Generate safe slug
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50);

    if (!slug) {
      throw new Error("Invalid topic name");
    }

    // Check if topic already exists in database
    const existing = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("topics", {
        slug,
        displayName: trimmed,
        description: `Custom topic: ${trimmed}`,
        category: "Custom & Community",
        icon: "🏷️",
        isSensitive: false,
        requiresExplicitOptIn: false,
        requiresCreatorConfirmation: false,
        allowAutoSuggestion: true,
        allowPublicAnalytics: true,
        active: true,
        displayOrder: 100,
        defaultEnabled: false,
        userSelectable: true,
        homeEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, slug, displayName: trimmed };
  },
});

