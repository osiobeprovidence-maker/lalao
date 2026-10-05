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
