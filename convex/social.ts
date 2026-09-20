import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   AUTH HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

export async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export async function getRelationshipSets(ctx: any, currentUser: any) {
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

export function resolveRelationship(userId: string, sets: { followingIds: Set<string>, followerIds: Set<string> }): "none" | "following" | "follower" | "friends" {
  const isFollowing = sets.followingIds.has(userId);
  const isFollower = sets.followerIds.has(userId);
  if (isFollowing && isFollower) return "friends";
  if (isFollowing) return "following";
  if (isFollower) return "follower";
  return "none";
}

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

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

/**
 * Calculates geographical distance in meters between two coordinates (Haversine formula).
 */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}


/**
 * Build the author sub-object for feed / comment payloads.
 * Resolves real isFollowing state from the follows table.
 */
async function resolveAuthor(ctx: any, authorDoc: any, currentUserId: string | null) {
  if (!authorDoc) return null;

  let isFollowing = false;
  if (currentUserId && currentUserId !== authorDoc._id) {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q: any) =>
        q.eq("followerId", currentUserId).eq("followingId", authorDoc._id)
      )
      .unique();
    isFollowing = !!follow;
  }

  const avatar = authorDoc.avatarUrl || authorDoc.avatar || "";

  return {
    id: authorDoc._id,
    name: authorDoc.name ?? "User",
    username: authorDoc.username ?? "user",
    avatar,
    avatarUrl: avatar,
    userType: authorDoc.userType ?? "person",
    bio: authorDoc.bio ?? "",
    location: authorDoc.locationName ?? "",
    followersCount: authorDoc.followersCount ?? 0,
    followingCount: authorDoc.followingCount ?? 0,
    isFollowing,
    isVerified: false,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   STORAGE
   ───────────────────────────────────────────────────────────────────────────── */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   FEED
   ───────────────────────────────────────────────────────────────────────────── */

export const listFeedPosts = query({
  args: {
    feedType: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    locationName: v.optional(v.string()),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const limit = args.limit ?? 40;
    const currentUserId = currentUser?._id;

    const userLat = args.latitude ?? currentUser?.latitude;
    const userLng = args.longitude ?? currentUser?.longitude;
    const radiusKm = args.radiusKm ?? currentUser?.radiusKm ?? 5;
    const maxRadiusMeters = radiusKm * 1000;
    const cleanLocationName = (args.locationName ?? currentUser?.locationName ?? "").trim().toLowerCase();

    const feedType = args.feedType || 'for_you';
    let posts: any[] = [];

    /* ─── TAB 1: FOLLOWING ─── */
    if (feedType === 'following') {
      if (!currentUserId) return [];

      // Get users the current user follows
      const followedUsers = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q: any) => q.eq("followerId", currentUserId))
        .collect();
      const followedUserIds = new Set(followedUsers.map((f: any) => f.followingId));

      // Get pages the current user follows
      const followedPages = await ctx.db
        .query("pageFollowers")
        .withIndex("by_page_user")
        .filter((q) => q.eq(q.field("userId"), currentUserId))
        .collect();
      const followedPageIds = new Set(followedPages.map((f: any) => f.pageId));

      // Strictly accounts the user actively follows: if following nobody, return empty
      if (followedUserIds.size === 0 && followedPageIds.size === 0) {
        return [];
      }

      let candidatePosts: any[] = [];
      if (followedUserIds.size + followedPageIds.size <= 30) {
        // Query author/page posts directly by index for high accuracy
        const userPromises = Array.from(followedUserIds).map((authorId) =>
          ctx.db
            .query("posts")
            .withIndex("by_author", (q: any) => q.eq("authorId", authorId))
            .order("desc")
            .take(25)
        );
        const pagePromises = Array.from(followedPageIds).map((pageId) =>
          ctx.db
            .query("posts")
            .filter((q: any) => q.eq(q.field("pageRefId"), pageId))
            .order("desc")
            .take(25)
        );
        const allResults = await Promise.all([...userPromises, ...pagePromises]);
        const postMap = new Map<string, any>();
        for (const list of allResults) {
          for (const p of list) {
            if (p.moderationStatus !== "removed") {
              postMap.set(p._id, p);
            }
          }
        }
        candidatePosts = Array.from(postMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      } else {
        const recent = await ctx.db
          .query("posts")
          .withIndex("by_created")
          .order("desc")
          .take(300);

        candidatePosts = recent.filter((p: any) => {
          if (p.moderationStatus === "removed") return false;
          if (p.pageRefId && followedPageIds.has(p.pageRefId)) return true;
          if (!p.pageRefId && followedUserIds.has(p.authorId)) return true;
          return false;
        });
      }

      if (args.cursor) {
        candidatePosts = candidatePosts.filter((p) => p.createdAt < args.cursor!);
      }
      posts = candidatePosts.slice(0, limit);
    }

    /* ─── TAB 2: NEARBY ─── */
    else if (feedType === 'nearby') {
      const recentPosts = await ctx.db
        .query("posts")
        .withIndex("by_created")
        .order("desc")
        .take(300);

      const candidatePosts = recentPosts.filter((post: any) => {
        if (post.moderationStatus === "removed") return false;

        // 1. Precise GPS calculation if coordinates exist
        if (
          userLat !== undefined &&
          userLng !== undefined &&
          post.latitude !== undefined &&
          post.longitude !== undefined
        ) {
          const dist = haversineMeters(userLat, userLng, post.latitude, post.longitude);
          if (dist <= maxRadiusMeters) {
            post._computedDistance = dist;
            return true;
          }
          return false;
        }

        // 2. City / Neighborhood substring matching fallback
        if (cleanLocationName && post.location) {
          const postLoc = post.location.toLowerCase();
          if (
            postLoc.includes(cleanLocationName) ||
            cleanLocationName.includes(postLoc)
          ) {
            post._computedDistance = Math.min(maxRadiusMeters * 0.4, 600);
            return true;
          }
        }

        // 3. If neither GPS nor location string matches, exclude from nearby
        return false;
      });

      if (args.cursor) {
        posts = candidatePosts.filter((p) => p.createdAt < args.cursor!).slice(0, limit);
      } else {
        posts = candidatePosts.slice(0, limit);
      }
    }

    /* ─── TAB 3: TOPICS / INTEREST FEEDS ─── */
    else if (feedType && !['for_you', 'following', 'nearby'].includes(feedType)) {
      const topicSlug = feedType.toLowerCase().trim();
      const topicDoc = await ctx.db
        .query("topics")
        .filter((q) => q.eq(q.field("slug"), topicSlug))
        .first();

      const topicDisplayName = topicDoc?.displayName?.toLowerCase() || topicSlug;

      const allPosts = await ctx.db
        .query("posts")
        .withIndex("by_created")
        .order("desc")
        .take(300);

      const candidatePosts = allPosts.filter((p: any) => {
        if (p.moderationStatus === "removed") return false;

        // 1. Direct contentTopics array match
        if (p.contentTopics && Array.isArray(p.contentTopics)) {
          const lowerTopics = p.contentTopics.map((t: string) => t.toLowerCase());
          if (lowerTopics.includes(topicSlug) || lowerTopics.includes(topicDisplayName)) {
            return true;
          }
        }

        // 2. Hashtags in text (e.g. #anime, #gaming, #stem, #drama)
        const textLower = (p.text || "").toLowerCase();
        if (textLower.includes(`#${topicSlug}`) || textLower.includes(`#${topicDisplayName}`)) {
          return true;
        }

        // 3. Keyword / topic word match in text
        if (textLower.includes(topicSlug) || textLower.includes(topicDisplayName)) {
          return true;
        }

        return false;
      });

      if (args.cursor) {
        posts = candidatePosts.filter((p) => p.createdAt < args.cursor!).slice(0, limit);
      } else {
        posts = candidatePosts.slice(0, limit);
      }
    }

    /* ─── TAB 4: FOR YOU (ALGORITHMIC DISCOVERY) ─── */
    else {
      let recentPosts = await ctx.db
        .query("posts")
        .withIndex("by_created")
        .order("desc")
        .take(150);

      if (args.cursor) {
        recentPosts = recentPosts.filter((p) => p.createdAt < args.cursor!);
      }

      // Algorithmic discovery score: recency blended with engagement
      const scoredPosts = recentPosts
        .filter((p) => p.moderationStatus !== "removed")
        .map((p) => {
          const engagement =
            (p.likesCount || 0) * 3 +
            (p.commentsCount || 0) * 4 +
            (p.repostsCount || 0) * 5;
          const ageHours = Math.max(0.1, (Date.now() - p.createdAt) / (1000 * 60 * 60));
          const score = (engagement + 1) / Math.pow(ageHours + 2, 1.2);
          return { post: p, score };
        });

      scoredPosts.sort((a, b) => b.score - a.score);
      posts = scoredPosts.slice(0, limit).map((sp) => sp.post);
    }


    const results: any[] = [];

    for (const post of posts) {
      if (post.moderationStatus === "removed") continue;

      let author;
      
      if (post.pageRefId) {
        const pageDoc: any = await ctx.db.get(post.pageRefId as any);
        if (pageDoc) {
          author = {
            id: pageDoc._id,
            name: pageDoc.name,
            username: pageDoc.username,
            avatar: pageDoc.avatar || "",
            userType: pageDoc.type || "business",
            followersCount: pageDoc.followersCount || 0,
            followingCount: 0,
            isFollowing: false,
            isVerified: true,
            location: pageDoc.location,
          };
        } else {
          // Fallback if page was deleted
          const authorDoc = post.authorId ? await ctx.db.get(post.authorId) : null;
          author = await resolveAuthor(ctx, authorDoc, currentUser._id);
        }
      } else {
        const authorDoc = post.authorId ? await ctx.db.get(post.authorId) : null;
        author = await resolveAuthor(ctx, authorDoc, currentUser._id);
      }

      // Top-level comments only (parentCommentId is undefined/null)
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q: any) => q.eq("postId", post._id))
        .order("desc")
        .take(30);

      const topLevel = allComments.filter((c: any) => !c.parentCommentId);
      const topLevelSlice = topLevel.slice(0, 10);

      const commentPayload = await Promise.all(
        topLevelSlice.map(async (comment: any) => {
          const commentAuthorDoc = comment.authorId ? await ctx.db.get(comment.authorId) : null;
          const commentAuthor = await resolveAuthor(ctx, commentAuthorDoc, currentUser._id);

          const commentLike = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q: any) =>
              q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", comment._id)
            )
            .unique();

          // Direct replies to this comment
          const replies = allComments
            .filter((c: any) => c.parentCommentId === comment._id)
            .slice(0, 5);

          return {
            id: comment._id,
            author: commentAuthor,
            text: comment.text,
            createdAt: formatRelativeTime(comment.createdAt),
            likesCount: comment.likesCount ?? 0,
            isLiked: !!commentLike,
            replies: await Promise.all(
              replies.map(async (reply: any) => {
                const replyAuthorDoc = reply.authorId ? await ctx.db.get(reply.authorId) : null;
                const replyAuthor = await resolveAuthor(ctx, replyAuthorDoc, currentUser._id);
                const replyLike = await ctx.db
                  .query("likes")
                  .withIndex("by_user_target", (q: any) =>
                    q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", reply._id)
                  )
                  .unique();
                return {
                  id: reply._id,
                  author: replyAuthor,
                  text: reply.text,
                  createdAt: formatRelativeTime(reply.createdAt),
                  likesCount: reply.likesCount ?? 0,
                  isLiked: !!replyLike,
                  replyToUsername: (commentAuthorDoc as any)?.username ?? "user",
                };
              })
            ),
          };
        })
      );

      const isLiked = !!(await ctx.db
        .query("likes")
        .withIndex("by_user_target", (q: any) =>
          q.eq("userId", currentUser._id).eq("targetType", "post").eq("targetId", post._id)
        )
        .unique());

      results.push({
        id: post._id,
        author,
        text: post.text,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        location: post.location,
        latitude: post.latitude,
        longitude: post.longitude,
        distanceMeters: (post as any)._computedDistance !== undefined
          ? (post as any)._computedDistance
          : (userLat !== undefined && userLng !== undefined && post.latitude !== undefined && post.longitude !== undefined)
            ? haversineMeters(userLat, userLng, post.latitude, post.longitude)
            : 0,
        createdAt: formatRelativeTime(post.createdAt),
        likesCount: post.likesCount ?? 0,
        commentsCount: post.commentsCount ?? topLevel.length,
        repostsCount: post.repostsCount ?? 0,
        isLiked,
        isReposted: false,
        comments: commentPayload,
        audience: post.audience ?? "everyone",
        replyPermission: post.replyPermission ?? "everyone",
        gifUrl: post.gifUrl,
        poll: post.pollQuestion
          ? {
              question: post.pollQuestion,
              options: post.pollOptions ?? [],
              votes: new Array((post.pollOptions ?? []).length).fill(0),
            }
          : undefined,
        rallyRefId: post.rallyRefId,
        pageRefId: post.pageRefId,
      });
    }

    return results;
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE POSTS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Shared helper to resolve posts created by a specific profile/user.
 * Robustly matches by normalized Convex Id, username, custom id, or authenticated user.
 */
async function fetchPostsForProfileUser(
  ctx: any,
  args: { userId?: string; username?: string }
) {
  const currentUser = await getAuthedUser(ctx);

  // 1. Resolve target user
  let targetUser: any = null;

  if (args.userId) {
    const normId = ctx.db.normalizeId("users", args.userId);
    if (normId) {
      targetUser = await ctx.db.get(normId);
    }
  }

  if (!targetUser && args.username) {
    const cleanUsername = args.username.replace(/^@/, "").trim().toLowerCase();
    targetUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", cleanUsername))
      .unique();
  }

  if (!targetUser && args.userId) {
    const cleanUserId = args.userId.replace(/^@/, "").trim().toLowerCase();
    targetUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", cleanUserId))
      .unique();
  }

  if (!targetUser && args.userId) {
    targetUser = await ctx.db
      .query("users")
      .collect()
      .then((all: any[]) =>
        all.find(
          (u: any) =>
            u._id === args.userId ||
            u.username === args.userId ||
            u.tokenIdentifier?.includes(args.userId)
        )
      );
  }

  if (!targetUser) {
    targetUser = currentUser;
  }

  if (!targetUser) return [];

  // 2. Query posts where author matches targetUser._id
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_author", (q: any) => q.eq("authorId", targetUser._id))
    .order("desc")
    .collect();

  let isFollowing = false;
  if (currentUser && currentUser._id !== targetUser._id) {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q: any) =>
        q.eq("followerId", currentUser._id).eq("followingId", targetUser._id)
      )
      .unique();
    isFollowing = !!follow;
  }

  const effectiveAvatar = targetUser.avatarUrl || (targetUser as any).avatar || "";
  const authorObj = {
    id: targetUser._id,
    name: targetUser.name ?? "User",
    username: targetUser.username ?? "user",
    avatar: effectiveAvatar,
    avatarUrl: effectiveAvatar,
    userType: targetUser.userType ?? "person",
    bio: targetUser.bio ?? "",
    location: targetUser.locationName ?? "",
    followersCount: targetUser.followersCount ?? 0,
    followingCount: targetUser.followingCount ?? 0,
    isFollowing,
    isVerified: false,
  };

  const results: any[] = [];
  for (const post of posts) {
    if (post.moderationStatus === "removed") continue;

    let isLiked = false;
    if (currentUser) {
      isLiked = !!(await ctx.db
        .query("likes")
        .withIndex("by_user_target", (q: any) =>
          q.eq("userId", currentUser._id).eq("targetType", "post").eq("targetId", post._id)
        )
        .unique());
    }

    // Top-level comments and direct replies for this post
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q: any) => q.eq("postId", post._id))
      .order("desc")
      .take(20);

    const topLevel = allComments.filter((c: any) => !c.parentCommentId);
    const topLevelSlice = topLevel.slice(0, 10);

    const commentPayload = await Promise.all(
      topLevelSlice.map(async (comment: any) => {
        const commentAuthorDoc = comment.authorId ? await ctx.db.get(comment.authorId) : null;
        const commentAuthor = await resolveAuthor(ctx, commentAuthorDoc, currentUser?._id ?? null);
        const commentLike = currentUser
          ? await ctx.db
              .query("likes")
              .withIndex("by_user_target", (q: any) =>
                q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", comment._id)
              )
              .unique()
          : null;

        const replies = allComments
          .filter((c: any) => c.parentCommentId === comment._id)
          .slice(0, 5);

        return {
          id: comment._id,
          author: commentAuthor,
          text: comment.text,
          createdAt: formatRelativeTime(comment.createdAt),
          likesCount: comment.likesCount ?? 0,
          isLiked: !!commentLike,
          replies: await Promise.all(
            replies.map(async (reply: any) => {
              const replyAuthorDoc = reply.authorId ? await ctx.db.get(reply.authorId) : null;
              const replyAuthor = await resolveAuthor(ctx, replyAuthorDoc, currentUser?._id ?? null);
              const replyLike = currentUser
                ? await ctx.db
                    .query("likes")
                    .withIndex("by_user_target", (q: any) =>
                      q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", reply._id)
                    )
                    .unique()
                : null;
              return {
                id: reply._id,
                author: replyAuthor,
                text: reply.text,
                createdAt: formatRelativeTime(reply.createdAt),
                likesCount: reply.likesCount ?? 0,
                isLiked: !!replyLike,
                replyToUsername: (commentAuthorDoc as any)?.username ?? "user",
              };
            })
          ),
        };
      })
    );

    results.push({
      id: post._id,
      author: authorObj,
      text: post.text,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      location: post.location,
      latitude: post.latitude,
      longitude: post.longitude,
      distanceMeters: 0,
      createdAt: formatRelativeTime(post.createdAt),
      likesCount: post.likesCount ?? 0,
      commentsCount: post.commentsCount ?? 0,
      repostsCount: post.repostsCount ?? 0,
      isLiked,
      isReposted: false,
      comments: commentPayload,
      audience: post.audience ?? "everyone",
      replyPermission: post.replyPermission ?? "everyone",
      gifUrl: post.gifUrl,
      poll: post.pollQuestion
        ? {
            question: post.pollQuestion,
            options: post.pollOptions ?? [],
            votes: new Array((post.pollOptions ?? []).length).fill(0),
          }
        : undefined,
      rallyRefId: post.rallyRefId,
      pageRefId: post.pageRefId,
    });
  }

  return results;
}

/**
 * Returns all posts created by the currently authenticated user (or specified user).
 * Uses the by_author index so it is not limited to the feed window.
 */
export const listMyPosts = query({
  args: {
    userId: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await fetchPostsForProfileUser(ctx, args);
  },
});

/**
 * Returns all posts created by a specific user (by their user id or username).
 * Used when viewing another user's profile or own profile.
 */
export const listUserPosts = query({
  args: {
    userId: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await fetchPostsForProfileUser(ctx, args);
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   USERS / SUGGESTIONS
   ───────────────────────────────────────────────────────────────────────────── */

export const listUsersForExplore = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    const allUsers = await ctx.db.query("users").collect();

    const relSets = await getRelationshipSets(ctx, currentUser);

    return allUsers
      .filter((user: any) => !currentUser || user._id !== currentUser._id)
      .map((user: any) => ({
        id: user._id,
        name: user.name ?? "User",
        username: user.username ?? "user",
        avatar: user.avatarUrl ?? "",
        userType: user.userType ?? "person",
        bio: user.bio ?? "",
        location: user.locationName ?? "",
        latitude: user.latitude ?? undefined,
        longitude: user.longitude ?? undefined,
        followersCount: user.followersCount ?? 0,
        followingCount: user.followingCount ?? 0,
        isFollowing: currentUser ? relSets.followingIds.has(user._id) : false,
        relationship: currentUser ? resolveRelationship(user._id, relSets) : "none",
        isVerified: false,
      }));
  },
});

/**
 * Suggested users — real database users not already followed by current user.
 * Sorted by shared interests first, then by follower count.
 */
export const listSuggestedUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const relSets = await getRelationshipSets(ctx, currentUser);
    const followingIds = relSets.followingIds;
    followingIds.add(currentUser._id as string);

    const allUsers = await ctx.db.query("users").collect();
    const currentInterests = new Set<string>(currentUser.interests ?? []);

    return allUsers
      .filter((u: any) => !followingIds.has(u._id))
      .map((u: any) => {
        const sharedInterests = (u.interests ?? []).filter((i: string) =>
          currentInterests.has(i)
        ).length;
        return { user: u, sharedInterests };
      })
      .sort((a: any, b: any) =>
        b.sharedInterests !== a.sharedInterests
          ? b.sharedInterests - a.sharedInterests
          : (b.user.followersCount ?? 0) - (a.user.followersCount ?? 0)
      )
      .slice(0, 10)
      .map(({ user }: any) => ({
        id: user._id,
        name: user.name ?? "User",
        username: user.username ?? "user",
        avatar: user.avatarUrl ?? "",
        userType: user.userType ?? "person",
        bio: user.bio ?? "",
        location: user.locationName ?? "",
        followersCount: user.followersCount ?? 0,
        followingCount: user.followingCount ?? 0,
        isFollowing: relSets.followingIds.has(user._id),
        relationship: currentUser ? resolveRelationship(user._id, relSets) : "none",
        isVerified: false,
      }));
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   PAGES
   ───────────────────────────────────────────────────────────────────────────── */

export const getPage = query({
  args: { pageId: v.string() },
  handler: async (ctx, { pageId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!pageId) return null;

    // Optional: map specific hardcoded IDs if needed (e.g. page_honorofkings)
    // For now, we try to fetch it from DB.
    let page;
    try {
      page = await ctx.db.get(pageId as any);
    } catch {
      // Invalid ID format
      return null;
    }

    if (!page) return null;

    let isFollowing = false;
    let isOwner = false;

    if (currentUser) {
      isOwner = page.ownerId === currentUser._id;
      isFollowing = !!(await ctx.db
        .query("pageFollowers")
        .withIndex("by_page_user", (q: any) =>
          q.eq("pageId", page._id).eq("userId", currentUser._id)
        )
        .unique());
    }

    return {
      id: page._id,
      ownerId: page.ownerId,
      name: page.name,
      username: page.username,
      type: page.type,
      badge: page.badge ?? "COMMUNITY",
      avatar: page.avatar ?? "",
      coverImage: page.coverImage ?? "",
      description: page.description ?? "",
      location: page.location ?? "",
      followersCount: page.followersCount ?? 0,
      isFollowing,
      isOwner,
      category: page.category ?? "General",
      aboutInfo: page.aboutInfo ?? {},
    };
  },
});

export const listPages = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const pages = await ctx.db.query("pages").collect();
    const results: any[] = [];

    for (const page of pages) {
      if (page.ownerId === currentUser._id) {
        continue; // Exclude own pages from discover
      }
      const isFollowing = !!(await ctx.db
        .query("pageFollowers")
        .withIndex("by_page_user", (q: any) =>
          q.eq("pageId", page._id).eq("userId", currentUser._id)
        )
        .unique());

      results.push({
        id: page._id,
        ownerId: page.ownerId,
        name: page.name,
        username: page.username,
        type: page.type,
        badge: page.badge ?? "COMMUNITY",
        avatar: page.avatar ?? "",
        coverImage: page.coverImage ?? "",
        description: page.description ?? "",
        location: page.location ?? "",
        followersCount: page.followersCount ?? 0,
        isFollowing,
        isOwner: page.ownerId === currentUser._id,
        category: page.category ?? "General",
        aboutInfo: page.aboutInfo ?? {},
      });
    }

    return results;
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   CONVERSATIONS
   ───────────────────────────────────────────────────────────────────────────── */

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const relSets = await getRelationshipSets(ctx, currentUser);

    const convosAsUserA = await ctx.db
      .query("conversations")
      .withIndex("by_user_a", (q) => q.eq("userA", currentUser._id))
      .collect();

    const convosAsUserB = await ctx.db
      .query("conversations")
      .withIndex("by_user_b", (q) => q.eq("userB", currentUser._id))
      .collect();
      
    const myPages = await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", currentUser._id))
      .collect();
      
    const convosAsPage = [];
    for (const page of myPages) {
      const pageConvos = await ctx.db
        .query("conversations")
        .withIndex("by_page_b", (q) => q.eq("pageB", page._id))
        .collect();
      convosAsPage.push(...pageConvos);
    }

    const allConvosMap = new Map();
    [...convosAsUserA, ...convosAsUserB, ...convosAsPage].forEach((c) => {
      allConvosMap.set(c._id, c);
    });
    
    const conversations = Array.from(allConvosMap.values());

    const result: any[] = [];

    for (const conversation of conversations) {
      const isPageConvo = !!conversation.pageB;
      const amIUserA = conversation.userA === currentUser._id;
      
      let otherParticipant: any = null;
      let isFollowingParticipant = false;
      let participantRelationship = "none";
      
      if (isPageConvo) {
        // If I am UserA, the participant is the Page (PageB)
        // If I am the Page Owner, the participant is the User (UserA)
        if (amIUserA) {
          otherParticipant = await ctx.db.get(conversation.pageB);
          if (otherParticipant) {
            otherParticipant.userType = otherParticipant.type;
            const followRel = await ctx.db
              .query("pageFollowers")
              .withIndex("by_page_user", (q) => q.eq("pageId", otherParticipant._id).eq("userId", currentUser._id))
              .first();
            isFollowingParticipant = !!followRel;
          }
        } else {
          otherParticipant = await ctx.db.get(conversation.userA);
          if (otherParticipant) {
            isFollowingParticipant = relSets.followingIds.has(otherParticipant._id);
            participantRelationship = resolveRelationship(otherParticipant._id, relSets);
          }
        }
      } else {
        const otherUserId = amIUserA ? conversation.userB : conversation.userA;
        otherParticipant = await ctx.db.get(otherUserId);
        if (otherParticipant) {
          isFollowingParticipant = relSets.followingIds.has(otherParticipant._id);
          participantRelationship = resolveRelationship(otherParticipant._id, relSets);
        }
      }

      const latestMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", conversation._id))
        .order("desc")
        .first();

      // Calculate unread count
      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", conversation._id))
        .collect();

      let unreadCount = 0;
      for (const msg of allMessages) {
        if (!msg.isRead) {
          // If we are looking as a Page Manager, it's unread if the customer sent it
          if (isPageConvo && !amIUserA) {
            if (msg.senderId !== currentUser._id && !msg.pageSenderId) {
              unreadCount++;
            }
          } else {
            // Otherwise, it's unread if someone else sent it to us
            // Check if pageSenderId is not my page, OR senderId is not me
            const senderWasPage = msg.pageSenderId !== undefined;
            if (senderWasPage) {
              // A page sent this. Am I the owner of this page?
              // The conversation.pageB is the page. I am amIUserA (customer).
              unreadCount++;
            } else {
              // A regular user sent this. Is it me?
              if (msg.senderId !== currentUser._id) {
                unreadCount++;
              }
            }
          }
        }
      }

      result.push({
        id: conversation._id,
        isPageConvo,
        amIUserA,
        pageId: conversation.pageB,
        participant: {
          id: otherParticipant?._id ?? "",
          name: otherParticipant?.name ?? "Unknown",
          username: otherParticipant?.username ?? "unknown",
          avatar: otherParticipant?.avatarUrl || otherParticipant?.avatar || "",
          userType: otherParticipant?.userType ?? "person",
          followersCount: otherParticipant?.followersCount ?? 0,
          followingCount: otherParticipant?.followingCount ?? 0,
          isFollowing: isFollowingParticipant,
          relationship: participantRelationship,
        },
        lastMessage: latestMessage?.text ?? "Say hello",
        timestamp: latestMessage
          ? new Date(latestMessage.createdAt).toLocaleTimeString()
          : "Now",
        updatedAt: conversation.updatedAt || latestMessage?.createdAt || 0,
        unreadCount,
        messages: [],
      });
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   POSTS
   ───────────────────────────────────────────────────────────────────────────── */

export const createPost = mutation({
  args: {
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    audience: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("closeFriends"),
        v.literal("community"),
        v.literal("page"),
        v.literal("nearby"),
        v.literal("anime"),
        v.literal("interest")
      )
    ),
    replyPermission: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("followers"),
        v.literal("following"),
        v.literal("friends"),
        v.literal("closeFriends"),
        v.literal("sameInterests"),
        v.literal("mentioned")
      )
    ),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    rallyRefId: v.optional(v.string()),
    pageRefId: v.optional(v.string()),
    contentTopics: v.optional(v.array(v.string())),
    authorUserId: v.optional(v.string()),
    authorUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && (args.authorUserId || args.authorUsername)) {
      if (args.authorUserId) {
        const normId = ctx.db.normalizeId("users", args.authorUserId);
        if (normId) {
          currentUser = await ctx.db.get(normId);
        }
      }
      if (!currentUser && args.authorUsername) {
        const clean = args.authorUsername.replace(/^@/, "").trim().toLowerCase();
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q: any) => q.eq("username", clean))
          .unique();
      }
      if (!currentUser && args.authorUserId) {
        const clean = args.authorUserId.replace(/^@/, "").trim().toLowerCase();
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q: any) => q.eq("username", clean))
          .unique();
      }
    }
    if (!currentUser) throw new Error("Not authenticated");

    let mediaUrl = args.mediaUrl;
    if (args.mediaStorageId) {
      mediaUrl = (await ctx.storage.getUrl(args.mediaStorageId)) ?? undefined;
    }

    // Auto-extract hashtags from text and combine with any explicitly provided contentTopics
    const extractedTopics = (args.contentTopics ?? []).slice();
    const hashtags = (args.text.match(/#[a-zA-Z0-9_\u00C0-\u00FF-]+/g) || []).map((t) =>
      t.slice(1).toLowerCase()
    );
    for (const h of hashtags) {
      if (!extractedTopics.includes(h)) {
        extractedTopics.push(h);
      }
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      authorId: currentUser._id,
      text: args.text,
      mediaUrl: mediaUrl,
      mediaStorageId: args.mediaStorageId,
      mediaType: args.mediaType,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
      createdAt: now,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      audience: args.audience ?? "everyone",
      replyPermission: args.replyPermission ?? "everyone",
      gifUrl: args.gifUrl,
      pollQuestion: args.pollQuestion,
      pollOptions: args.pollOptions,
      rallyRefId: args.rallyRefId,
      pageRefId: args.pageRefId,
      contentTopics: extractedTopics.length > 0 ? extractedTopics : undefined,
    });

    return {
      id: postId,
      author: {
        id: currentUser._id,
        name: currentUser.name ?? "You",
        username: currentUser.username ?? "you",
        avatar: currentUser.avatarUrl ?? "",
        userType: currentUser.userType ?? "person",
        followersCount: currentUser.followersCount ?? 0,
        followingCount: currentUser.followingCount ?? 0,
        isFollowing: false,
        isVerified: false,
      },
      text: args.text,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      location: args.location,
      distanceMeters: 0,
      createdAt: "Just now",
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
      audience: args.audience ?? "everyone",
      replyPermission: args.replyPermission ?? "everyone",
      gifUrl: args.gifUrl,
      poll: args.pollQuestion
        ? { question: args.pollQuestion, options: args.pollOptions ?? [], votes: [] }
        : undefined,
      rallyRefId: args.rallyRefId,
      pageRefId: args.pageRefId,
    };
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    if (post.authorId !== currentUser._id) {
      throw new Error("Not authorized to delete this post");
    }

    // 1. Delete associated comments and their likes
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .collect();
    
    for (const comment of comments) {
      const commentLikes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q: any) => q.eq("targetType", "comment").eq("targetId", comment._id))
        .collect();
      for (const like of commentLikes) {
        await ctx.db.delete(like._id);
      }
      const replyLikes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q: any) => q.eq("targetType", "reply").eq("targetId", comment._id))
        .collect();
      for (const like of replyLikes) {
        await ctx.db.delete(like._id);
      }
      await ctx.db.delete(comment._id);
    }

    // 2. Delete post likes
    const postLikes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q: any) => q.eq("targetType", "post").eq("targetId", postId))
      .collect();
    for (const like of postLikes) {
      await ctx.db.delete(like._id);
    }

    // 3. Delete notifications referencing this post
    const notifications = await ctx.db
      .query("notifications")
      .filter((q: any) => q.eq(q.field("postId"), postId))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // 4. Delete Convex Storage media
    if (post.mediaStorageId) {
      await ctx.storage.delete(post.mediaStorageId);
    }

    // 5. External Media cleanup
    // TODO: If external media references exist (e.g., Mux video URLs) and aren't in Convex storage,
    // add external API calls here to clean them up from the provider.

    // 6. Delete the post itself
    await ctx.db.delete(postId);
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   LIKES
   ───────────────────────────────────────────────────────────────────────────── */

export const toggleLikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q: any) =>
        q.eq("userId", currentUser._id).eq("targetType", "post").eq("targetId", postId)
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      const nextCount = Math.max(0, (post.likesCount ?? 0) - 1);
      await ctx.db.patch(postId, { likesCount: nextCount });
      return { liked: false, likesCount: nextCount };
    }

    await ctx.db.insert("likes", {
      userId: currentUser._id,
      targetType: "post",
      targetId: postId,
      createdAt: Date.now(),
    });

    const nextCount = (post.likesCount ?? 0) + 1;
    await ctx.db.patch(postId, { likesCount: nextCount });

    // Notify post author (not self-likes)
    if (post.authorId !== currentUser._id) {
      await ctx.db.insert("notifications", {
        recipientId: post.authorId,
        actorId: currentUser._id,
        type: "like",
        postId,
        targetExcerpt: post.text ? post.text.slice(0, 80) : undefined,
        isRead: false,
        createdAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
        recipientId: post.authorId,
        title: `${currentUser.name ?? "Someone"} liked your post`,
        body: post.text ? post.text.slice(0, 100) : "Check it out on Lalao",
        url: `/app?tab=home&post=${postId}`,
      });
    }

    return { liked: true, likesCount: nextCount };
  },
});

export const toggleLikeComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q: any) =>
        q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", commentId)
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      const nextCount = Math.max(0, (comment.likesCount ?? 0) - 1);
      await ctx.db.patch(commentId, { likesCount: nextCount });
      return { liked: false, likesCount: nextCount };
    }

    await ctx.db.insert("likes", {
      userId: currentUser._id,
      targetType: "comment",
      targetId: commentId,
      createdAt: Date.now(),
    });

    const nextCount = (comment.likesCount ?? 0) + 1;
    await ctx.db.patch(commentId, { likesCount: nextCount });

    if (comment.authorId !== currentUser._id) {
      const type = comment.parentCommentId ? "reply_like" : "comment_like";
      await ctx.db.insert("notifications", {
        recipientId: comment.authorId,
        actorId: currentUser._id,
        type,
        postId: comment.postId,
        commentId,
        targetExcerpt: comment.text ? comment.text.slice(0, 80) : "an attachment",
        isRead: false,
        createdAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
        recipientId: comment.authorId,
        title: `${currentUser.name ?? "Someone"} liked your ${comment.parentCommentId ? "reply" : "comment"}`,
        body: comment.text ? comment.text.slice(0, 100) : "an attachment",
        url: `/app?tab=home&post=${comment.postId}`,
      });
    }

    return { liked: true, likesCount: nextCount };
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== currentUser._id) {
      throw new Error("Unauthorized");
    }

    // Check if it has children
    const children = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", commentId))
      .collect();

    if (children.length > 0) {
      // Soft delete
      await ctx.db.patch(commentId, {
        text: "[Deleted]",
        mediaUrl: undefined,
        mediaStorageId: undefined,
        mediaType: undefined,
        duration: undefined,
        isDeleted: true,
      });
    } else {
      // Hard delete
      await ctx.db.delete(commentId);
      const post = await ctx.db.get(comment.postId);
      if (post) {
        await ctx.db.patch(comment.postId, {
          commentsCount: Math.max(0, (post.commentsCount ?? 0) - 1),
        });
      }
    }
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   COMMENTS
   ───────────────────────────────────────────────────────────────────────────── */

export const addCommentToPost = mutation({
  args: {
    postId: v.id("posts"),
    text: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("voice"), v.literal("gif"), v.literal("sticker"))),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, { postId, text, parentCommentId, mediaStorageId, mediaType, duration }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const trimmed = text.trim();
    if (!trimmed && !mediaStorageId) throw new Error("Comment cannot be empty");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    if (post.replyPermission && post.replyPermission !== "everyone") {
      const relSets = await getRelationshipSets(ctx, currentUser);
      const isFollowing = relSets.followingIds.has(post.authorId);
      const isFollower = relSets.followerIds.has(post.authorId);
      const isFriend = isFollowing && isFollower;

      if (post.replyPermission === "followers" && !isFollower) throw new Error("Only followers can reply");
      if (post.replyPermission === "following" && !isFollowing) throw new Error("Only users this person follows can reply");
      if (post.replyPermission === "friends" && !isFriend) throw new Error("Only friends can reply");
      if (post.replyPermission === "mentioned") {
        const isAuthor = post.authorId === currentUser._id;
        const isMentioned = post.text.includes(`@${currentUser.username}`) || (currentUser.name && post.text.includes(`@${currentUser.name}`));
        if (!isAuthor && !isMentioned) throw new Error("Only mentioned users can reply to this post");
      }
    }

    let mediaUrl = undefined;
    if (mediaStorageId) {
      mediaUrl = (await ctx.storage.getUrl(mediaStorageId)) || undefined;
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      postId,
      authorId: currentUser._id,
      parentCommentId,
      text: trimmed,
      createdAt: now,
      likesCount: 0,
      mediaUrl,
      mediaStorageId,
      mediaType,
      duration,
    });

    await ctx.db.patch(postId, {
      commentsCount: (post.commentsCount ?? 0) + 1,
    });

    // Notify post author of comment/reply (not self)
    const notifType = parentCommentId ? "reply" : "comment";
    if (post.authorId !== currentUser._id) {
      await ctx.db.insert("notifications", {
        recipientId: post.authorId,
        actorId: currentUser._id,
        type: notifType,
        postId,
        commentId,
        targetExcerpt: trimmed.slice(0, 80),
        isRead: false,
        createdAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
        recipientId: post.authorId,
        title: `${currentUser.name ?? "Someone"} ${parentCommentId ? "replied to your comment" : "commented on your post"}`,
        body: trimmed.slice(0, 100),
        url: `/app?tab=home&post=${postId}`,
      });
    }

    // Also notify parent comment author if different from post author and self
    if (parentCommentId) {
      const parentComment = await ctx.db.get(parentCommentId);
      if (
        parentComment &&
        parentComment.authorId !== currentUser._id &&
        parentComment.authorId !== post.authorId
      ) {
        await ctx.db.insert("notifications", {
          recipientId: parentComment.authorId,
          actorId: currentUser._id,
          type: "reply",
          postId,
          commentId,
          targetExcerpt: trimmed.slice(0, 80),
          isRead: false,
          createdAt: now,
        });
        await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
          recipientId: parentComment.authorId,
          title: `${currentUser.name ?? "Someone"} replied to your comment`,
          body: trimmed.slice(0, 100),
          url: `/app?tab=home&post=${postId}`,
        });
      }
    }

    return {
      id: commentId,
      authorId: currentUser._id,
      parentCommentId,
      text: trimmed,
      createdAt: now,
      likesCount: 0,
      author: {
        id: currentUser._id,
        name: currentUser.name ?? "You",
        username: currentUser.username ?? "you",
        avatar: currentUser.avatarUrl ?? "",
        userType: currentUser.userType ?? "person",
        followersCount: currentUser.followersCount ?? 0,
        followingCount: currentUser.followingCount ?? 0,
        isFollowing: false,
        isVerified: false,
      },
    };
  },
});

export const getCommentsForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("desc")
      .take(200);

    const buildCommentTree = async (comments: any[], parentId?: any): Promise<any[]> => {
      const children = comments.filter((c) => {
        const cParentStr = c.parentCommentId ? String(c.parentCommentId) : undefined;
        const parentStr = parentId ? String(parentId) : undefined;
        return cParentStr === parentStr;
      });
      const enrichedChildren = await Promise.all(
        children.map(async (c) => {
          const authorDoc = await ctx.db.get(c.authorId);
          const author = await resolveAuthor(ctx, authorDoc, currentUser._id);
          const like = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q: any) =>
              q.eq("userId", currentUser._id).eq("targetType", "comment").eq("targetId", c._id)
            )
            .unique();
            
          let parentAuthorDoc = null;
          if (c.parentCommentId) {
             const parent = comments.find(p => p._id === c.parentCommentId);
             if (parent) parentAuthorDoc = await ctx.db.get(parent.authorId);
          }

          let mediaUrl = c.mediaUrl;
          if (!mediaUrl && c.mediaStorageId) {
             mediaUrl = await ctx.storage.getUrl(c.mediaStorageId);
          }

          return {
            id: c._id,
            author,
            text: c.text,
            createdAt: formatRelativeTime(c.createdAt),
            likesCount: c.likesCount ?? 0,
            isLiked: !!like,
            mediaUrl,
            mediaType: c.mediaType,
            duration: c.duration,
            isDeleted: c.isDeleted,
            replyToUsername: (parentAuthorDoc as any)?.username ?? "user",
            replies: await buildCommentTree(comments, c._id),
          };
        })
      );
      return enrichedChildren;
    };

    return buildCommentTree(allComments, undefined);
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   FOLLOWS
   ───────────────────────────────────────────────────────────────────────────── */

export const getRelationship = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, { targetUserId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) {
      return { isFollowing: false, followsMe: false, isFriend: false, relationship: "none" };
    }
    const relSets = await getRelationshipSets(ctx, currentUser);
    const relationship = resolveRelationship(targetUserId, relSets);
    return {
      isFollowing: relSets.followingIds.has(targetUserId),
      followsMe: relSets.followerIds.has(targetUserId),
      isFriend: relationship === "friends",
      relationship,
    };
  }
});

/**
 * Toggle follow/unfollow for a target user.
 * Security: follower identity comes from server-side auth, never the request body.
 */
export const toggleFollowUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, { targetUserId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");
    if (currentUser._id === targetUserId) throw new Error("Cannot follow yourself");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q: any) =>
        q.eq("followerId", currentUser._id).eq("followingId", targetUserId)
      )
      .unique();

    if (existing) {
      // Unfollow
      await ctx.db.delete(existing._id);
      await ctx.db.patch(currentUser._id, {
        followingCount: Math.max(0, (currentUser.followingCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
      const target = await ctx.db.get(targetUserId);
      if (target) {
        await ctx.db.patch(targetUserId, {
          followersCount: Math.max(0, (target.followersCount ?? 0) - 1),
          updatedAt: Date.now(),
        });
      }
      return { following: false };
    }

    // Follow
    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: targetUserId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(currentUser._id, {
      followingCount: (currentUser.followingCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    const target = await ctx.db.get(targetUserId);
    if (target) {
      await ctx.db.patch(targetUserId, {
        followersCount: (target.followersCount ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }

    // Notify the followed user
    await ctx.db.insert("notifications", {
      recipientId: targetUserId,
      actorId: currentUser._id,
      type: "follow",
      isRead: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
      recipientId: targetUserId,
      title: "New follower on Lalao",
      body: `${currentUser.name ?? "Someone"} started following you`,
      url: "/app?tab=notifications",
    });

    return { following: true };
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATIONS
   ───────────────────────────────────────────────────────────────────────────── */

const NOTIF_TEXT: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  reply: "replied to your comment",
  follow: "started following you",
  rally_join: "joined your rally",
};

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const relSets = await getRelationshipSets(ctx, currentUser);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q: any) => q.eq("recipientId", currentUser._id))
      .order("desc")
      .take(50);

    return await Promise.all(
      notifs.map(async (notif: any) => {
        const actor = notif.actorId ? (await ctx.db.get(notif.actorId)) as any : null;
        return {
          id: notif._id,
          type: notif.type as string,
          text: NOTIF_TEXT[notif.type] ?? "interacted with your content",
          actor: actor
            ? {
                id: actor._id,
                name: actor.name ?? "User",
                username: actor.username ?? "user",
                avatar: actor.avatarUrl ?? "",
                userType: actor.userType ?? "person",
                followersCount: actor.followersCount ?? 0,
                followingCount: actor.followingCount ?? 0,
                isFollowing: false,
                isVerified: false,
              }
            : null,
          targetId: notif.postId ?? null,
          targetExcerpt: notif.targetExcerpt ?? null,
          isRead: notif.isRead,
          timestamp: formatRelativeTime(notif.createdAt),
          createdAt: notif.createdAt,
        };
      })
    );
  },
});

export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q: any) =>
        q.eq("recipientId", currentUser._id).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q: any) =>
        q.eq("recipientId", currentUser._id).eq("isRead", false)
      )
      .collect();

    await Promise.all(unread.map((n: any) => ctx.db.patch(n._id, { isRead: true })));
    return { count: unread.length };
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   DRAFTS
   ───────────────────────────────────────────────────────────────────────────── */

export const listMyDrafts = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    return await ctx.db
      .query("drafts")
      .withIndex("by_author", (q: any) => q.eq("authorId", currentUser._id))
      .order("desc")
      .take(10);
  },
});

export const saveDraft = mutation({
  args: {
    draftId: v.optional(v.id("drafts")),
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    audience: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("closeFriends"),
        v.literal("community"),
        v.literal("page"),
        v.literal("nearby"),
        v.literal("anime"),
        v.literal("interest")
      )
    ),
    replyPermission: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("followers"),
        v.literal("following"),
        v.literal("friends"),
        v.literal("closeFriends"),
        v.literal("sameInterests"),
        v.literal("mentioned")
      )
    ),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    pageRefId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const now = Date.now();
    const { draftId, ...data } = args;

    if (draftId) {
      const existing = await ctx.db.get(draftId);
      if (existing && existing.authorId === currentUser._id) {
        await ctx.db.patch(draftId, { ...data, updatedAt: now });
        return draftId;
      }
    }

    return await ctx.db.insert("drafts", {
      authorId: currentUser._id,
      text: data.text,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      audience: data.audience,
      replyPermission: data.replyPermission,
      gifUrl: data.gifUrl,
      pollQuestion: data.pollQuestion,
      pollOptions: data.pollOptions,
      pageRefId: data.pageRefId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteDraft = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const draft = await ctx.db.get(draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.authorId !== currentUser._id) throw new Error("Not authorized");

    await ctx.db.delete(draftId);
    return { deleted: true };
  },
});


export const getMessageContacts = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const relSets = await getRelationshipSets(ctx, currentUser);
    
    // Friends are the intersection of followingIds and followerIds
    const friendIds = Array.from(relSets.followingIds).filter(id => relSets.followerIds.has(id));

    const results = [];
    for (const friendId of friendIds) {
      const friend = (await ctx.db.get(friendId as any)) as any;
      if (friend) {
        results.push({
          id: friend._id,
          name: friend.name ?? "User",
          username: friend.username ?? "user",
          avatar: friend.avatarUrl ?? "",
          userType: friend.userType ?? "person",
          followersCount: friend.followersCount ?? 0,
          followingCount: friend.followingCount ?? 0,
          isFollowing: true,
          relationship: "friends",
          isVerified: false,
        });
      }
    }
    return results;
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   MESSAGING
   ───────────────────────────────────────────────────────────────────────────── */

export const startPageConversation = mutation({
  args: {
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.type !== "business" && page.badge !== "BIZ") {
      throw new Error("Messaging is only available for Business pages");
    }

    if (page.ownerId === currentUser._id) {
      throw new Error("Cannot start a conversation with your own page");
    }

    // Check if conversation already exists
    const existingConvo = await ctx.db
      .query("conversations")
      .withIndex("by_user_a", (q) => q.eq("userA", currentUser._id))
      .filter((q) => q.eq(q.field("pageB"), args.pageId))
      .first();

    if (existingConvo) {
      return existingConvo._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      userA: currentUser._id,
      pageB: args.pageId,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    pageSenderId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Authorization check
    let authorized = false;
    
    if (conversation.userA === currentUser._id || conversation.userB === currentUser._id) {
      authorized = true;
    }
    
    let recipientId: Id<"users"> | undefined;

    // If the conversation is with a page, the page owner is authorized
    if (conversation.pageB) {
      const page = await ctx.db.get(conversation.pageB);
      if (page && page.ownerId === currentUser._id) {
        authorized = true;
        // Verify pageSenderId matches the page they own
        if (args.pageSenderId && args.pageSenderId !== page._id) {
          throw new Error("Not authorized to send as this page");
        }
        recipientId = conversation.userA as Id<"users">;
      } else if (page && conversation.userA === currentUser._id) {
        recipientId = page.ownerId;
      }
    } else {
      if (conversation.userA === currentUser._id) {
        recipientId = conversation.userB;
      } else {
        recipientId = conversation.userA;
      }
    }

    if (!authorized) {
      throw new Error("Not authorized to send to this conversation");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      pageSenderId: args.pageSenderId,
      text: args.text,
      isRead: false,
      createdAt: Date.now(),
    });
    
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    if (recipientId) {
      // Find the other user to get their name for the push notification
      const senderName = args.pageSenderId 
        ? (await ctx.db.get(args.pageSenderId))?.name 
        : currentUser.name;

      await ctx.db.insert("notifications", {
        recipientId,
        actorId: currentUser._id,
        type: "message",
        conversationId: args.conversationId,
        messageId,
        targetExcerpt: args.text.slice(0, 80),
        isRead: false,
        createdAt: Date.now(),
      });
      
      // Dispatch push notification
      await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
        recipientId,
        title: `New message from ${senderName ?? "Someone"}`,
        body: args.text.slice(0, 100),
        url: `/app/messages`,
      });
    }

    return messageId;
  },
});

export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    let amIUserA = conversation.userA === currentUser._id;
    let isPageConvo = !!conversation.pageB;

    let isManager = false;
    if (isPageConvo && conversation.pageB) {
      const page = await ctx.db.get(conversation.pageB);
      if (page && page.ownerId === currentUser._id) {
        isManager = true;
      }
    }

    if (!amIUserA && conversation.userB !== currentUser._id && !isManager) {
      throw new Error("Not authorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_read", (q: any) => 
        q.eq("conversationId", args.conversationId).eq("isRead", false)
      )
      .collect();

    for (const msg of messages) {
      if (isManager && !amIUserA) {
        if (msg.senderId !== currentUser._id && !msg.pageSenderId) {
          await ctx.db.patch(msg._id, { isRead: true });
        }
      } else {
        if (msg.pageSenderId || msg.senderId !== currentUser._id) {
          await ctx.db.patch(msg._id, { isRead: true });
        }
      }
    }

    // Also mark notifications as read
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q: any) => 
        q.eq("recipientId", currentUser._id).eq("isRead", false)
      )
      .collect();
      
    for (const notif of notifications) {
      if (notif.type === "message" && notif.conversationId === args.conversationId) {
        await ctx.db.patch(notif._id, { isRead: true });
      }
    }
  },
});
