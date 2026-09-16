import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

async function getAuthUserId(ctx: any): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
    
  return user?._id ?? null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUERIES
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * getCurrentUser
 * Returns the full user profile for the currently authenticated session,
 * or null when not signed in.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * getUserByUsername
 * Looks up a public profile by username (for profile pages, etc.).
 */
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   MUTATIONS — called from onboarding pages
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * createUserRecord
 * Called automatically after Firebase sign-up/sign-in.
 */
export const createUserRecord = mutation({
  args: {
    email:  v.optional(v.string()),
    phone:  v.optional(v.string()),
  },
  handler: async (ctx, { email, phone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
      
    if (existing) return existing._id;
    
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email,
      phone,
      onboardingStep: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);
  },
});

/**
 * updateName
 * Onboarding step 1 — save name + username.
 */
export const updateName = mutation({
  args: {
    name:     v.string(),
    username: v.string(),
  },
  handler: async (ctx, { name, username }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (existing && existing._id !== userId) {
      throw new Error("Username already taken");
    }

    await ctx.db.patch(userId, {
      name,
      username,
      onboardingStep: "name",
      updatedAt: Date.now(),
    });
  },
});

/**
 * updateProfile
 * Onboarding step 2 — save avatar URL and bio.
 */
export const updateProfile = mutation({
  args: {
    avatarUrl: v.optional(v.string()),
    bio:       v.optional(v.string()),
  },
  handler: async (ctx, { avatarUrl, bio }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, {
      avatarUrl,
      bio,
      onboardingStep: "profile",
      updatedAt: Date.now(),
    });
  },
});

/**
 * updatePronouns
 * Onboarding step 3 — save pronouns.
 */
export const updatePronouns = mutation({
  args: { pronouns: v.string() },
  handler: async (ctx, { pronouns }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, {
      pronouns,
      onboardingStep: "pronouns",
      updatedAt: Date.now(),
    });
  },
});

/**
 * updateLocation
 * Onboarding step 4 — save location.
 */
export const updateLocation = mutation({
  args: {
    locationName: v.string(),
    locationSub:  v.optional(v.string()),
    latitude:     v.optional(v.number()),
    longitude:    v.optional(v.number()),
    radiusKm:     v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, {
      ...args,
      onboardingStep: "location",
      updatedAt: Date.now(),
    });
  },
});

/**
 * updateInterests
 * Onboarding step 5 — save interests and mark onboarding complete.
 */
export const updateInterests = mutation({
  args: { interests: v.array(v.string()) },
  handler: async (ctx, { interests }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, {
      interests,
      onboardingStep: "complete",
      updatedAt: Date.now(),
    });
  },
});
