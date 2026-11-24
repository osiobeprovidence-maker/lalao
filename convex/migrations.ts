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
import { requireMaintenanceOff } from "./internal/maintenance";

/**
 * Migration helper to insert documents into target tables while preserving original IDs
 */
export const insertTableBatch = mutation({
  args: {
    table: v.string(),
    documents: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    await requireMaintenanceOff(ctx);
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

export const mergeAndSetMainAccount = mutation({
  args: {
    mainUsername: v.string(),
    secondaryUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMaintenanceOff(ctx);
    const mainUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.mainUsername))
      .unique();
    const secondaryUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.secondaryUsername))
      .unique();

    if (!mainUser) throw new Error(`Main user @${args.mainUsername} not found`);

    // Ensure main user has super_admin role and normalized email
    await ctx.db.patch(mainUser._id, {
      role: "super_admin",
      email: "riderezzy@gmail.com",
      emailNormalized: "riderezzy@gmail.com",
      updatedAt: Date.now(),
    });

    let updatedIdentities = 0;
    // Map any authIdentities pointing to secondaryUser to mainUser
    if (secondaryUser) {
      const identities = await ctx.db
        .query("authIdentities")
        .withIndex("by_user", (q) => q.eq("userId", secondaryUser._id))
        .collect();

      for (const identity of identities) {
        await ctx.db.patch(identity._id, { userId: mainUser._id });
        updatedIdentities++;
      }

      // Also ensure any posts, followers, follows pointing to secondary point to main
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", secondaryUser._id))
        .collect();
      for (const post of posts) {
        await ctx.db.patch(post._id, { authorId: mainUser._id });
      }

      // Mark secondary user as merged/archived so username won't conflict
      await ctx.db.patch(secondaryUser._id, {
        username: `${args.secondaryUsername}_merged_${Date.now()}`,
        role: "user",
        email: undefined,
        emailNormalized: undefined,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      mainUserId: mainUser._id,
      mainUsername: args.mainUsername,
      updatedIdentities,
    };
  },
});

/**
 * Idempotently seed the first 5 General Demo Chatrooms.
 */
export const seedDemoChatrooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find or create a designated system/demo administrator identity
    let systemUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", "lalao"))
      .first();

    if (!systemUser) {
      systemUser = await ctx.db
        .query("users")
        .withIndex("by_role", (q: any) => q.eq("role", "super_admin"))
        .first();
    }

    if (!systemUser) {
      // Find the first user or create a system demo owner
      const firstUser = await ctx.db.query("users").first();
      if (firstUser) {
        systemUser = firstUser;
      } else {
        const now = Date.now();
        const sysId = await ctx.db.insert("users", {
          tokenIdentifier: "system|lalao_chatrooms_demo",
          name: "LaLao Community",
          username: "lalao_official",
          role: "admin",
          onboardingStep: "complete",
          createdAt: now,
          updatedAt: now,
        });
        systemUser = await ctx.db.get(sysId);
      }
    }

    const demoRooms: Array<any> = [];

    const results = [];
    const now = Date.now();

    for (const room of demoRooms) {
      // Idempotency check: see if groupChat with this username already exists
      let existing = await ctx.db
        .query("groupChats")
        .withIndex("by_username", (q: any) => q.eq("username", room.username))
        .first();

      if (existing) {
        // Ensure isChatroom flag, roomIcon, and allowPublicPreview are set
        await ctx.db.patch(existing._id, {
          isChatroom: true,
          allowPublicPreview: true,
          roomIcon: room.roomIcon,
          category: room.category,
          rules: room.rules,
          visibility: "public",
          coverImage: existing.coverImage || room.coverImage,
          avatarUrl: existing.avatarUrl || room.avatarUrl,
        });

        // Ensure shared core conversation exists
        let convo = await ctx.db
          .query("conversations")
          .withIndex("by_group_chat", (q: any) => q.eq("groupChatId", existing._id))
          .first();

        if (!convo) {
          await ctx.db.insert("conversations", {
            userA: existing.creatorId,
            groupChatId: existing._id,
            updatedAt: now,
          });
        }

        results.push({ id: existing._id, name: existing.name, status: "updated" });
      } else {
        const creatorId = systemUser!._id;
        const groupId = await ctx.db.insert("groupChats", {
          name: room.name,
          username: room.username,
          description: room.description,
          category: room.category,
          avatarUrl: room.avatarUrl,
          coverImage: room.coverImage,
          roomIcon: room.roomIcon,
          isChatroom: true,
          allowPublicPreview: true,
          creatorId,
          memberIds: [creatorId],
          interests: [room.category.toLowerCase()],
          rules: room.rules,
          visibility: "public",
          communityEnabled: true,
          communityFeatures: {
            posts: true,
            replies: true,
            media: true,
            rallies: false,
          },
          publishingPermissions: {
            canPost: "all_members",
            canReply: "all_members",
            canUploadMedia: "all_members",
            canCreateRallies: "admins_only",
          },
          createdAt: now,
          updatedAt: now,
        });

        // Seed owner member record
        await ctx.db.insert("groupMembers", {
          groupId,
          userId: creatorId,
          role: "owner",
          joinedAt: now,
        });

        // Seed linked core conversation for real-time messaging
        await ctx.db.insert("conversations", {
          userA: creatorId,
          groupChatId: groupId,
          updatedAt: now,
        });

        results.push({ id: groupId, name: room.name, status: "created" });
      }
    }

    return {
      success: true,
      seededRooms: results,
    };
  },
});


