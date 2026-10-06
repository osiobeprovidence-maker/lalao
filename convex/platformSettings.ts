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
      authLogoUrl: v.optional(v.string()),
      authWordmark: v.optional(v.string()),
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

// ─────────────────────────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────────────────────────

export const getFeatureFlagsInternal = async (ctx: any) => {
  const record = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q: any) => q.eq("key", "featureFlags"))
    .unique();

  const defaultFlags = { communityEnabled: false, roomyEnabled: true };

  if (!record) return defaultFlags;

  try {
    return { ...defaultFlags, ...JSON.parse(record.value) };
  } catch (e) {
    return defaultFlags;
  }
};

export const getFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    return await getFeatureFlagsInternal(ctx);
  },
});

export const updateFeatureFlags = mutation({
  args: {
    flags: v.object({
      communityEnabled: v.optional(v.boolean()),
      ralliesEnabled: v.optional(v.boolean()),
      cyclesEnabled: v.optional(v.boolean()),
      roomyEnabled: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "featureFlags"))
      .unique();

    let currentFlags = { communityEnabled: false, roomyEnabled: true };
    if (record) {
      try {
        currentFlags = { ...currentFlags, ...JSON.parse(record.value) };
      } catch (e) {}
    }

    const newFlags = { ...currentFlags, ...args.flags };
    const newValue = JSON.stringify(newFlags);

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
        key: "featureFlags",
        value: newValue,
        updatedAt: Date.now(),
        updatedBy: actorId,
      });
    }

    if (actorId) {
      await ctx.db.insert("auditLog", {
        actorId,
        action: "updated_feature_flags",
        target: "platformSettings:featureFlags",
        before: record ? record.value : "{}",
        after: newValue,
        createdAt: Date.now(),
      });
    }
  },
});

export const requireFeatureFlag = async (ctx: any, feature: string) => {
  const record = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q: any) => q.eq("key", "featureFlags"))
    .unique();
    
  let flags: Record<string, boolean> = { communityEnabled: false, roomyEnabled: true };
  if (record) {
    try {
      flags = { ...flags, ...JSON.parse(record.value) };
    } catch (e) {}
  }
  
  if (!flags[feature]) {
    throw new Error(`Feature disabled: ${feature}`);
  }
};

// ─────────────────────────────────────────────────────────────
// CREATOR ECOSYSTEM & VERIFICATION SETTINGS
// ─────────────────────────────────────────────────────────────

export const getCreatorSettings = query({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "creator_tier_settings"))
      .unique();

    const defaultSettings = {
      tier3Price: 800,
      tier4Price: 1700,
      tier5Price: 3500,
      priorityWeight: 1.15,
      risingFollowerCap: 5000,
    };

    if (!record) return defaultSettings;

    try {
      const parsed = JSON.parse(record.value);
      return {
        tier3Price: parsed.tier3Price ?? parsed.verifiedPrice ?? defaultSettings.tier3Price,
        tier4Price: parsed.tier4Price ?? parsed.priorityPrice ?? defaultSettings.tier4Price,
        tier5Price: parsed.tier5Price ?? parsed.creatorPrice ?? defaultSettings.tier5Price,
        priorityWeight: parsed.priorityWeight ?? defaultSettings.priorityWeight,
        risingFollowerCap: parsed.risingFollowerCap ?? defaultSettings.risingFollowerCap,
      };
    } catch (e) {
      return defaultSettings;
    }
  },
});

export const updateCreatorSettings = mutation({
  args: {
    settings: v.object({
      tier3Price: v.optional(v.number()),
      tier4Price: v.optional(v.number()),
      tier5Price: v.optional(v.number()),
      priorityWeight: v.optional(v.number()),
      risingFollowerCap: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "creator_tier_settings"))
      .unique();

    let currentSettings = {
      tier3Price: 800,
      tier4Price: 1700,
      tier5Price: 3500,
      priorityWeight: 1.15,
      risingFollowerCap: 5000,
    };

    if (record) {
      try {
        currentSettings = { ...currentSettings, ...JSON.parse(record.value) };
      } catch (e) {}
    }

    const newSettings = {
      ...currentSettings,
      ...args.settings,
      // Also map backward compatible keys for convex/creators.ts
      verifiedPrice: args.settings.tier3Price ?? currentSettings.tier3Price,
      priorityPrice: args.settings.tier4Price ?? currentSettings.tier4Price,
      creatorPrice: args.settings.tier5Price ?? currentSettings.tier5Price,
    };

    const newValue = JSON.stringify(newSettings);

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
        key: "creator_tier_settings",
        value: newValue,
        updatedAt: Date.now(),
        updatedBy: actorId,
      });
    }

    if (actorId) {
      await ctx.db.insert("auditLog", {
        actorId,
        action: "updated_creator_tier_settings",
        target: "platformSettings:creator_tier_settings",
        before: record ? record.value : "{}",
        after: newValue,
        createdAt: Date.now(),
      });
    }

    return newSettings;
  },
});
