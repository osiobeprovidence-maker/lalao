import { mutation } from "./_generated/server";
import { v } from "convex/values";

const KNOWN_TABLES = ["users"] as const;

export const previewDemoCleanup = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, { dryRun = true }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) {
      throw new Error("No user record found for this account.");
    }

    const tableSummary: Record<string, number> = {};
    for (const tableName of KNOWN_TABLES) {
      const rows = await (ctx.db as any).query(tableName).collect();
      tableSummary[tableName] = rows.length;
    }

    return {
      dryRun,
      currentUserId: currentUser._id,
      tables: KNOWN_TABLES,
      tableSummary,
      note:
        "This deployment currently contains only the users table. The wallet/team/payment/demo content you were seeing is app-local state stored in browser localStorage, not Convex.",
    };
  },
});

export const cleanupDemoData = mutation({
  args: {
    confirm: v.boolean(),
    dryRun: v.optional(v.boolean()),
    deleteOtherUsers: v.optional(v.boolean()),
  },
  handler: async (ctx, { confirm, dryRun = false, deleteOtherUsers = false }) => {
    if (!confirm) {
      throw new Error("Set confirm to true before deleting anything.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) {
      throw new Error("No user record found for this account.");
    }

    const deleted: Record<string, number> = {};

    for (const tableName of KNOWN_TABLES) {
      const rows = await (ctx.db as any).query(tableName).collect();

      const rowsToDelete =
        tableName === "users"
          ? rows.filter((row: any) => (deleteOtherUsers ? row._id !== currentUser._id : false))
          : [];

      if (dryRun) {
        deleted[tableName] = rowsToDelete.length;
        continue;
      }

      for (const row of rowsToDelete) {
        await ctx.db.delete(row._id);
      }

      deleted[tableName] = rowsToDelete.length;
    }

    return {
      dryRun,
      keptCurrentUser: currentUser._id,
      deleted,
      note:
        "There are no additional content tables in the current Convex schema. The wallet/team/tournament/demo data you saw is stored in localStorage and must be cleared in the browser app state.",
    };
  },
});
