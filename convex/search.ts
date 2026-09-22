import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to get authed user
async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
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
    latitude: postDoc.latitude,
    longitude: postDoc.longitude,
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
          avatar: u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
          userType: u.userType || "person",
          location: u.locationName || "",
          latitude: u.latitude,
          longitude: u.longitude,
          bio: u.bio,
          followersCount: u.followersCount ?? 0,
          followingCount: u.followingCount ?? 0,
          isFollowing,
          // Intentionally omitting email and phone for privacy
        });
      }
    }

    // CONTENT / VIDEO SEARCH
    if (filter === 'all' || filter === 'content' || filter === 'video') {
      const rawPosts = await ctx.db.query("posts").withSearchIndex("search_text", (q2: any) => q2.search("text", q)).take(20);
      
      for (const p of rawPosts) {
        if (p.moderationStatus === "removed") continue;
        if (filter === 'video' && p.mediaType !== 'video') continue;
        
        const resolved = await resolvePost(ctx, p, currentUser);
        if (resolved) {
          contentResults.push(resolved);
        }
      }
    }

    // PAGES SEARCH
    if (filter === 'all' || filter === 'pages') {
      const byName = await ctx.db.query("pages").withSearchIndex("search_name", (q2: any) => q2.search("name", q)).take(10);
      const byCategory = await ctx.db.query("pages").withSearchIndex("search_category", (q2: any) => q2.search("category", q)).take(10);

      const uniquePages = new Map();
      [...byName, ...byCategory].forEach(p => {
        if (!uniquePages.has(p._id)) {
          uniquePages.set(p._id, p);
        }
      });

      for (const p of uniquePages.values()) {
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
