import { internalMutation } from "./_generated/server";

/**
 * Migration to populate the `pageMembers` table from existing `pages.ownerId`.
 */
export const migratePageOwnersToMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect();
    let migratedCount = 0;

    for (const page of pages) {
      if (!page.ownerId) continue;

      // Check if a member record already exists
      const existingMember = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", page._id).eq("userId", page.ownerId)
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("pageMembers", {
          pageId: page._id,
          userId: page.ownerId,
          role: "owner",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        migratedCount++;
      }
    }

    return { success: true, migratedCount, totalPages: pages.length };
  },
});


/**
 * Migration to safely audit historical posts for Nearby eligibility.
 * Historical posts without trustworthy, verified coordinates are marked nearbyEnabled: false
 * to prevent legacy posts or profile-location inferences from polluting the Nearby feed.
 * Posts with explicit coordinates and valid coordinates retain their status safely.
 */
export const migrateHistoricalPostsNearbyStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    let updatedCount = 0;

    for (const post of posts) {
      // If nearbyEnabled is already explicitly set, skip
      if (post.nearbyEnabled !== undefined) continue;

      const hasCoords =
        typeof post.latitude === "number" &&
        typeof post.longitude === "number" &&
        !isNaN(post.latitude) &&
        !isNaN(post.longitude) &&
        (post.latitude !== 0 || post.longitude !== 0);

      // Only qualify if the audience was explicitly nearby or had legitimate coordinates
      const isNearbyAudience = post.audience === "nearby";
      const shouldEnableNearby = hasCoords && isNearbyAudience;

      await ctx.db.patch(post._id, {
        nearbyEnabled: shouldEnableNearby,
        locationStatus: hasCoords ? (isNearbyAudience ? "verified" : "approximate") : "unverified",
      });
      updatedCount++;
    }

    return { success: true, updatedCount, totalPosts: posts.length };
  },
});

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration helper to insert documents into target tables while preserving original IDs
 */
export const insertTableBatch = mutation({
  args: {
    table: v.string(),
    documents: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    const idMap: Record<string, string> = {};
    const errors: string[] = [];

    for (const doc of args.documents) {
      try {
        const originalId = doc._id;
        const cleanDoc = { ...doc };
        delete cleanDoc._id;
        delete cleanDoc._creationTime;

        const newId = await ctx.db.insert(args.table as any, cleanDoc);
        if (originalId) {
          idMap[originalId] = newId;
        }
        inserted++;
      } catch (err: any) {
        errors.push(err?.message || String(err));
      }
    }
    return { table: args.table, inserted, total: args.documents.length, idMap, errors };
  },
});

