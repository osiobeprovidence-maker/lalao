import { getUserByAuthIdentity } from "./lib/authIdentity";
import { internalAction, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { isSupabaseRecentSearchShadowEnabled, recentSearchShadowRetryDelayMs, SupabaseAdminRestClient, SupabaseRestError } from "./lib/supabaseAdminRest";
import { deleteRecentSearchShadowRevision, nextRecentSearchShadowRevision } from "./lib/recentSearchShadowRevision";
import { resolveUserVerification } from "./social";

// Helper to get authed user
async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await getUserByAuthIdentity(ctx, identity);
}

function formatRelativeTime(ms: number | undefined | null): string {
  if (!ms) return "Just now";
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1 || isNaN(minutes)) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return "Just now";
  }
}

// Basic post resolution to match frontend expectations
async function resolvePost(ctx: any, postDoc: any, currentUser: any) {
  const authorDoc = await ctx.db.get(postDoc.authorId);
  if (!authorDoc) return null;

  // Enforce privacy
  if (postDoc.audience === "closeFriends" || postDoc.audience === "community") {
    // For now, if it's restricted and not by the current user, hide it
    if (!currentUser || currentUser._id !== postDoc.authorId) {
      return null;
    }
  }

  let isLiked = false;
  if (currentUser) {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q: any) =>
        q.eq("userId", currentUser._id).eq("targetType", "post").eq("targetId", postDoc._id)
      )
      .unique();
    isLiked = !!like;
  }

  let isFollowing = false;
  if (currentUser && currentUser._id !== authorDoc._id) {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q: any) =>
        q.eq("followerId", currentUser._id).eq("followingId", authorDoc._id)
      )
      .unique();
    isFollowing = !!follow;
  }

  return {
    id: postDoc._id,
    text: postDoc.text,
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    location: postDoc.location,
    createdAt: formatRelativeTime(postDoc.createdAt),
    likesCount: postDoc.likesCount ?? 0,
    commentsCount: postDoc.commentsCount ?? 0,
    repostsCount: postDoc.repostsCount ?? 0,
    isLiked,
    isReposted: false,
    audience: postDoc.audience ?? "everyone",
    replyPermission: postDoc.replyPermission ?? "everyone",
    gifUrl: postDoc.gifUrl,
    poll: postDoc.pollQuestion
      ? { question: postDoc.pollQuestion, options: postDoc.pollOptions || [] }
      : undefined,
    rallyRefId: postDoc.rallyRefId,
    pageRefId: postDoc.pageRefId,
    author: {
      id: authorDoc._id,
      name: authorDoc.name || "Unknown",
      username: authorDoc.username || "unknown",
      ...resolveUserVerification(authorDoc),
      avatar: authorDoc.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
      userType: authorDoc.userType || "person",
      followersCount: authorDoc.followersCount ?? 0,
      followingCount: authorDoc.followingCount ?? 0,
      isFollowing,
    },
    comments: [], // Don't deeply resolve comments for search results to save DB reads
  };
}


async function getRelationshipSets(ctx: any, currentUser: any) {
  const followingIds = new Set<string>();
  const followerIds = new Set<string>();
  if (currentUser) {
    const followsOut = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q: any) => q.eq("followerId", currentUser._id))
      .collect();
    followsOut.forEach((f: any) => followingIds.add(f.followingId));
    
    const followsIn = await ctx.db
      .query("follows")
      .withIndex("by_following", (q: any) => q.eq("followingId", currentUser._id))
      .collect();
    followsIn.forEach((f: any) => followerIds.add(f.followerId));
  }
  return { followingIds, followerIds };
}

function resolveRelationship(userId: string, sets: { followingIds: Set<string>, followerIds: Set<string> }): "none" | "following" | "follower" | "friends" {
  const isFollowing = sets.followingIds.has(userId);
  const isFollower = sets.followerIds.has(userId);
  if (isFollowing && isFollower) return "friends";
  if (isFollowing) return "following";
  if (isFollower) return "follower";
  return "none";
}

export const globalSearch = query({
  args: {
    query: v.string(),
    filter: v.optional(v.string()), // 'all', 'people', 'pages', 'video', 'content'
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const relSets = await getRelationshipSets(ctx, currentUser);
    const q = args.query.trim();
    if (!q) {
      return { people: [], content: [], pages: [], isEmpty: true };
    }

    const filter = args.filter || 'all';
    
    let peopleResults: any[] = [];
    let contentResults: any[] = [];
    let pageResults: any[] = [];

    // PEOPLE SEARCH
    if (filter === 'all' || filter === 'people') {
      const byName = await ctx.db.query("users").withSearchIndex("search_name", (q2: any) => q2.search("name", q)).take(10);
      const byUsername = await ctx.db.query("users").withSearchIndex("search_username", (q2: any) => q2.search("username", q)).take(10);
      const byEmail = await ctx.db.query("users").withSearchIndex("search_email", (q2: any) => q2.search("email", q)).take(5);
      const byPhone = await ctx.db.query("users").withSearchIndex("search_phone", (q2: any) => q2.search("phone", q)).take(5);

      const uniqueUsers = new Map();
      [...byName, ...byUsername, ...byEmail, ...byPhone].forEach(u => {
        if (!uniqueUsers.has(u._id)) {
          uniqueUsers.set(u._id, u);
        }
      });

      // Resolve follow status and strip private info
      for (const u of uniqueUsers.values()) {
        let isFollowing = false;
        if (currentUser && currentUser._id !== u._id) {
          const follow = await ctx.db
            .query("follows")
            .withIndex("by_follower_following", (fQ: any) =>
              fQ.eq("followerId", currentUser._id).eq("followingId", u._id)
            )
            .unique();
          isFollowing = !!follow;
        }

        peopleResults.push({
          id: u._id,
          name: u.name || "Unknown",
          username: u.username || "unknown",
          ...resolveUserVerification(u),
          avatar: u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
          userType: u.userType || "person",
          location: u.locationName || "",
          latitude: u.latitude,
          longitude: u.longitude,
          bio: u.bio,
          followersCount: u.followersCount ?? 0,
          followingCount: u.followingCount ?? 0,
          isFollowing,
          publicIdentityType: (u.publicIdentityType as "display_name" | "username") ?? "display_name",
          // Intentionally omitting email and phone for privacy
        });
      }
    }

    // CONTENT / VIDEO SEARCH
    if (filter === 'all' || filter === 'content' || filter === 'video' || filter === 'videos') {
      const rawPosts = await ctx.db.query("posts").withSearchIndex("search_text", (q2: any) => q2.search("text", q)).take(20);
      
      for (const p of rawPosts) {
        if (p.moderationStatus === "removed") continue;
        const isVideo = p.mediaType === 'video' || Boolean(p.muxPlaybackId); if ((filter === 'video' || filter === 'videos') && !isVideo) continue;
        
        const resolved = await resolvePost(ctx, p, currentUser);
        if (resolved) {
          contentResults.push(resolved);
        }
      }
    }

    // PAGES SEARCH
    if (filter === 'all' || filter === 'pages' || filter === 'shop') {
      const byName = await ctx.db.query("pages").withSearchIndex("search_name", (q2: any) => q2.search("name", q)).take(10);
      const byCategory = await ctx.db.query("pages").withSearchIndex("search_category", (q2: any) => q2.search("category", q)).take(10);

      const uniquePages = new Map();
      [...byName, ...byCategory].forEach(p => {
        if (!uniquePages.has(p._id)) {
          uniquePages.set(p._id, p);
        }
      });

      for (const p of uniquePages.values()) {
        if (filter === 'pages' && p.type === 'business') continue;
        if (filter === 'shop' && p.type !== 'business') continue;
        let isFollowing = false;
        if (currentUser) {
          const follow = await ctx.db
            .query("pageFollowers")
            .withIndex("by_page_user", (fQ: any) => fQ.eq("pageId", p._id).eq("userId", currentUser._id))
            .unique();
          isFollowing = !!follow;
        }

        pageResults.push({
          id: p._id,
          ownerId: p.ownerId,
          name: p.name,
          username: p.username,
          type: p.type,
          badge: p.badge,
          description: p.description,
          location: p.location,
          avatar: p.avatar,
          coverImage: p.coverImage,
          category: p.category,
          followersCount: p.followersCount ?? 0,
          isFollowing,
          globalDiscoveryStatus: p.globalDiscoveryStatus ?? "global",
          serviceAreas: p.serviceAreas ?? [],
          isOnlineBusiness: p.isOnlineBusiness ?? false,
        });
      }
    }

    return {
      people: peopleResults,
      content: contentResults,
      pages: pageResults,
      isEmpty: false,
    };
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   RECENT SEARCHES API
   ───────────────────────────────────────────────────────────────────────────── */

export const getUserForSupabaseMirror = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      tokenIdentifier: user.tokenIdentifier,
      onboardingStep: user.onboardingStep,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

function getRecentSearchShadowClient() {
  if (!isSupabaseRecentSearchShadowEnabled(process.env)) return null;
  return new SupabaseAdminRestClient({
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });
}

/**
 * Internal, durable mirror worker. The Convex mutation passes an immutable row
 * snapshot plus a strictly increasing per-row revision. PostgreSQL's RPC
 * serializes these operations and preserves delete revisions as tombstones.
 */
/** Atomically enqueue a server-authorized shadow operation from a Convex mutation. */
async function scheduleRecentSearchShadow(
  ctx: any,
  record: any,
  deleted = false,
  revision = record.timestamp,
) {
  if (!isSupabaseRecentSearchShadowEnabled(process.env)) return;
  await ctx.scheduler.runAfter(0, internal.search.applyRecentSearchShadow, {
    id: record._id,
    userId: record.userId,
    revision,
    deleted,
    ...(!deleted ? { record } : {}),
    attempt: 0,
  });
}

export const applyRecentSearchShadow = internalAction({
  args: {
    id: v.id("recentSearches"),
    userId: v.id("users"),
    revision: v.number(),
    deleted: v.boolean(),
    record: v.optional(v.any()),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    const supabase = getRecentSearchShadowClient();
    if (!supabase) return { status: "disabled" as const };

    try {
      if (!args.deleted) {
        if (!args.record || args.record._id !== args.id || args.record.userId !== args.userId || args.record.timestamp !== args.revision) {
          throw new Error("Invalid internal recent-search shadow event.");
        }
        const user = await ctx.runQuery(internal.search.getUserForSupabaseMirror, { userId: args.userId });
        if (!user) return { status: "user_not_found" as const };
        await supabase.upsert("users", [user], "_id");
      }

      await supabase.applyRecentSearchShadow({
        id: args.id,
        userId: args.userId,
        revision: args.revision,
        deleted: args.deleted,
        record: args.record,
      });
      return { status: args.deleted ? "deleted" as const : "mirrored" as const };
    } catch (error) {
      const delay = error instanceof SupabaseRestError && error.retryable
        ? recentSearchShadowRetryDelayMs(args.attempt)
        : null;
      if (delay !== null) {
        await ctx.scheduler.runAfter(delay, internal.search.applyRecentSearchShadow, {
          ...args,
          attempt: args.attempt + 1,
        });
        return { status: "retry_scheduled" as const };
      }
      throw error;
    }
  },
});

/**
 * Fetch the authenticated user's recent searches, sorted newest to oldest.
 */
export const getRecentSearches = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const limit = args.limit ?? 30;

    const searches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user_time", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(limit);

    // Enrich live user data if target entity is a person or page
    const enriched = await Promise.all(
      searches.map(async (item) => {
        if (item.type === "person" && item.entityId) {
          try {
            const userDoc = await ctx.db.get(item.entityId as Id<"users">);
            if (userDoc) {
              return {
                ...item,
                title: userDoc.name || item.title || "User",
                subtitle: userDoc.username ? `@${userDoc.username}` : item.subtitle,
                avatarUrl: userDoc.avatarUrl || item.avatarUrl,
                ...resolveUserVerification(userDoc),
              };
            }
          } catch {
            // Deleted or invalid ID fallback
          }
        } else if ((item.type === "page" || item.type === "shop") && item.entityId) {
          try {
            const pageDoc = await ctx.db.get(item.entityId as Id<"pages">);
            if (pageDoc) {
              return {
                ...item,
                title: pageDoc.name || item.title,
                subtitle: pageDoc.category || item.subtitle,
                avatarUrl: pageDoc.avatar || item.avatarUrl,
              };
            }
          } catch {
            // Deleted or invalid ID fallback
          }
        }
        return item;
      })
    );

    return enriched;
  },
});

/**
 * Record a search entry. If an identical query/entity exists, update timestamp and move to top.
 */
export const recordRecentSearch = mutation({
  args: {
    query: v.string(),
    type: v.union(
      v.literal("keyword"),
      v.literal("person"),
      v.literal("page"),
      v.literal("shop"),
      v.literal("content"),
      v.literal("event")
    ),
    entityId: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    verificationTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return null;

    const cleanQuery = args.query.trim();
    if (!cleanQuery) return null;

    const now = Date.now();

    // Look for existing entry:
    // If entityId exists (e.g. clicked on a profile or page), match by entityId + type
    let existing = null;
    if (args.entityId) {
      existing = await ctx.db
        .query("recentSearches")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("entityId"), args.entityId),
            q.eq(q.field("type"), args.type)
          )
        )
        .first();
    }

    // If no existing entity match, match by query and type
    if (!existing) {
      existing = await ctx.db
        .query("recentSearches")
        .withIndex("by_user_query", (q) =>
          q.eq("userId", currentUser._id).eq("query", cleanQuery)
        )
        .filter((q) => q.eq(q.field("type"), args.type))
        .first();
    }

    if (existing) {
      const updates = {
        timestamp: nextRecentSearchShadowRevision(existing.timestamp, now),
        entityId: args.entityId ?? existing.entityId,
        title: args.title ?? existing.title,
        subtitle: args.subtitle ?? existing.subtitle,
        avatarUrl: args.avatarUrl ?? existing.avatarUrl,
        isVerified: args.isVerified ?? existing.isVerified,
        verificationTier: args.verificationTier ?? existing.verificationTier,
      };
      await ctx.db.patch(existing._id, updates);
      const updatedSearch = await ctx.db.get(existing._id);
      if (updatedSearch) await scheduleRecentSearchShadow(ctx, updatedSearch);
      return existing._id;
    }

    // Insert new entry
    const newSearch = {
      userId: currentUser._id,
      query: cleanQuery,
      type: args.type,
      entityId: args.entityId,
      title: args.title,
      subtitle: args.subtitle,
      avatarUrl: args.avatarUrl,
      isVerified: args.isVerified,
      verificationTier: args.verificationTier,
      timestamp: now,
    };
    const id = await ctx.db.insert("recentSearches", newSearch);
    const insertedSearch = await ctx.db.get(id);
    if (insertedSearch) await scheduleRecentSearchShadow(ctx, insertedSearch);

    // Keep history trimmed to a max of 50 items per user
    const total = await ctx.db
      .query("recentSearches")
      .withIndex("by_user_time", (q) => q.eq("userId", currentUser._id))
      .order("asc")
      .collect();

    if (total.length > 50) {
      const toDelete = total.slice(0, total.length - 50);
      for (const item of toDelete) {
        await scheduleRecentSearchShadow(ctx, item, true, deleteRecentSearchShadowRevision(item.timestamp));
        await ctx.db.delete(item._id);
      }
    }

    return id;
  },
});

/**
 * Remove a single search record by ID.
 */
export const removeRecentSearch = mutation({
  args: {
    id: v.id("recentSearches"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Unauthenticated");

    const record = await ctx.db.get(args.id);
    if (!record) return { success: true };

    // Strict privacy boundary: only owner can delete their search
    if (record.userId !== currentUser._id) {
      throw new Error("Unauthorized to remove this search item");
    }

    await scheduleRecentSearchShadow(ctx, record, true, deleteRecentSearchShadowRevision(record.timestamp));
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Clear all recent searches for the authenticated user.
 */
export const clearAllRecentSearches = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return { count: 0 };

    const records = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    for (const record of records) {
      await scheduleRecentSearchShadow(ctx, record, true, deleteRecentSearchShadowRevision(record.timestamp));
      await ctx.db.delete(record._id);
    }

    return { count: records.length };
  },
});

