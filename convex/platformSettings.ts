import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// ─────────────────────────────────────────────────────────────
// BRANDING SETTINGS
// ─────────────────────────────────────────────────────────────

export const getBrandingSettings = query({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "branding"))
      .unique();

    if (!record) return null;

    try {
      return JSON.parse(record.value);
    } catch (e) {
      return null;
    }
  },
});

export const updateBrandingSettings = mutation({
  args: {
    branding: v.object({
      platformName: v.optional(v.string()),
      shortName: v.optional(v.string()),
      wordmarkUrl: v.optional(v.string()),
      appIconUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      browserTitle: v.optional(v.string()),
      browserDescription: v.optional(v.string()),
      pwaName: v.optional(v.string()),
      pwaShortName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Only admins can update platform branding
    await requireAdmin(ctx);

    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "branding"))
      .unique();

    const newValue = JSON.stringify(args.branding);

    // We can fetch the real user ID if needed
    const identity = await ctx.auth.getUserIdentity();
    let actorId = undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
      actorId = user?._id;
    }

    if (record) {
      await ctx.db.patch(record._id, {
        value: newValue,
        updatedAt: Date.now(),
        updatedBy: actorId,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "branding",
        value: newValue,
        updatedAt: Date.now(),
        updatedBy: actorId,
      });
    }

    if (actorId) {
      await ctx.db.insert("auditLog", {
        actorId,
        action: "updated_platform_branding",
        target: "platformSettings:branding",
        before: record ? record.value : "{}",
        after: newValue,
        createdAt: Date.now(),
      });
    }
  },
});
