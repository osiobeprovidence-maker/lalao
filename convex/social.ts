import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   AUTH HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

async function getAuthedUser(ctx: any) {
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

  return {
    id: authorDoc._id,
    name: authorDoc.name ?? "User",
    username: authorDoc.username ?? "user",
    avatar: authorDoc.avatarUrl ?? "",
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
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(40);

    const results: any[] = [];

    for (const post of posts) {
      let author;
      
      if (post.pageRefId) {
        const pageDoc = await ctx.db.get(post.pageRefId);
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
        distanceMeters: 10,
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
      aboutInfo: {},
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
        aboutInfo: {},
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

    const conversations = await ctx.db
      .query("conversations")
      .filter((q: any) =>
        q.or(
          q.eq(q.field("userA"), currentUser._id),
          q.eq(q.field("userB"), currentUser._id)
        )
      )
      .collect();

    const result: any[] = [];

    for (const conversation of conversations) {
      const otherUserId =
        conversation.userA === currentUser._id ? conversation.userB : conversation.userA;
      const otherUser = await ctx.db.get(otherUserId);
      const latestMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", conversation._id))
        .order("desc")
        .first();

      result.push({
        id: conversation._id,
        participant: {
          id: otherUser?._id ?? "",
          name: otherUser?.name ?? "User",
          username: otherUser?.username ?? "user",
          avatar: otherUser?.avatarUrl ?? "",
          userType: otherUser?.userType ?? "person",
          followersCount: otherUser?.followersCount ?? 0,
          followingCount: otherUser?.followingCount ?? 0,
          isFollowing: otherUser ? relSets.followingIds.has(otherUser._id) : false,
          relationship: otherUser ? resolveRelationship(otherUser._id, relSets) : "none",
        },
        lastMessage: latestMessage?.text ?? "Say hello",
        timestamp: latestMessage
          ? new Date(latestMessage.createdAt).toLocaleTimeString()
          : "Now",
        unreadCount: 0,
        messages: [],
      });
    }

    return result;
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
        v.literal("page")
      )
    ),
    replyPermission: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("followers"),
        v.literal("following"),
        v.literal("friends"),
        v.literal("closeFriends"),
        v.literal("sameInterests")
      )
    ),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    rallyRefId: v.optional(v.string()),
    pageRefId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    let mediaUrl = args.mediaUrl;
    if (args.mediaStorageId) {
      mediaUrl = (await ctx.storage.getUrl(args.mediaStorageId)) ?? undefined;
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
        v.literal("page")
      )
    ),
    replyPermission: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("followers"),
        v.literal("following"),
        v.literal("friends"),
        v.literal("closeFriends"),
        v.literal("sameInterests")
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
