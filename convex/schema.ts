import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Lalao database schema.
 *
 * We store our own `users` table that stores profile + onboarding state.
 */
export default defineSchema({
  users: defineTable({
    // ── Identity ────────────────────────────
    tokenIdentifier: v.string(),
    email:  v.optional(v.string()),
    phone:  v.optional(v.string()),
    name:   v.optional(v.string()),
    username: v.optional(v.string()),

    // ── Profile ──────────────────────────────────────────────────────────
    avatarUrl:  v.optional(v.string()),
    bio:        v.optional(v.string()),
    pronouns:   v.optional(v.string()),
    userType:   v.optional(
      v.union(
        v.literal("person"),
        v.literal("business"),
        v.literal("organization"),
        v.literal("club"),
        v.literal("community"),
      )
    ),

    // ── Location ─────────────────────────────────────────────────────────
    locationName:   v.optional(v.string()),
    locationSub:    v.optional(v.string()),   // e.g. "Delta State"
    latitude:       v.optional(v.number()),
    longitude:      v.optional(v.number()),
    radiusKm:       v.optional(v.number()),

    // ── Interests ────────────────────────────────────────────────────────
    interests: v.optional(v.array(v.string())),

    // ── Onboarding state ─────────────────────────────────────────────────
    onboardingStep: v.union(
      v.literal("pending"),     // just signed up
      v.literal("name"),        // completed name step
      v.literal("profile"),     // completed profile photo step
      v.literal("pronouns"),    // completed pronouns step
      v.literal("location"),    // completed location step
      v.literal("interests"),   // completed interests step
      v.literal("complete"),    // fully onboarded
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email",    ["email"])
    .index("by_username", ["username"]),
});
