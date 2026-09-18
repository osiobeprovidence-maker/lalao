import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

function userToUiUser(user: any, currentUserId?: string) {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name ?? "New user",
    username: user.username ?? "newuser",
    avatar: user.avatarUrl ?? "",
    userType: user.userType ?? "person",
    bio: user.bio ?? "",
    location: user.locationName ?? "",
    latitude: user.latitude ?? undefined,
    longitude: user.longitude ?? undefined,
    followersCount: user.followersCount ?? 0,
    followingCount: user.followingCount ?? 0,
    isFollowing: currentUserId ? false : false,
    isVerified: false,
  };
}

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
      const author = await ctx.db.get(post.authorId);
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q: any) => q.eq("postId", post._id))
        .order("desc")
        .take(10);

      const commentPayload = await Promise.all(
        comments.map(async (comment: any) => {
          const commentAuthor = await ctx.db.get(comment.authorId);
          const replies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q: any) => q.eq("parentCommentId", comment._id))
            .order("desc")
            .take(5);

          return {
            id: comment._id,
            author: {
              id: commentAuthor?._id ?? "",
              name: commentAuthor?.name ?? "User",
              username: commentAuthor?.username ?? "user",
              avatar: commentAuthor?.avatarUrl ?? "",
              userType: commentAuthor?.userType ?? "person",
              followersCount: commentAuthor?.followersCount ?? 0,
              followingCount: commentAuthor?.followingCount ?? 0,
              isVerified: false,
            },
            text: comment.text,
            createdAt: new Date(comment.createdAt).toLocaleString(),
            likesCount: comment.likesCount ?? 0,
            isLiked: false,
            replies: await Promise.all(
              replies.map(async (reply: any) => {
                const replyAuthor = await ctx.db.get(reply.authorId);
                return {
                  id: reply._id,
                  author: {
                    id: replyAuthor?._id ?? "",
                    name: replyAuthor?.name ?? "User",
                    username: replyAuthor?.username ?? "user",
                    avatar: replyAuthor?.avatarUrl ?? "",
                    userType: replyAuthor?.userType ?? "person",
                    followersCount: replyAuthor?.followersCount ?? 0,
                    followingCount: replyAuthor?.followingCount ?? 0,
                    isVerified: false,
                  },
                  text: reply.text,
                  createdAt: new Date(reply.createdAt).toLocaleString(),
                  likesCount: reply.likesCount ?? 0,
                  isLiked: false,
                  replyToUsername: commentAuthor?.username ?? "user",
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
        author: {
          id: author?._id ?? "",
          name: author?.name ?? "User",
          username: author?.username ?? "user",
          avatar: author?.avatarUrl ?? "",
          userType: author?.userType ?? "person",
          bio: author?.bio ?? "",
          location: author?.locationName ?? "",
          followersCount: author?.followersCount ?? 0,
          followingCount: author?.followingCount ?? 0,
          isFollowing: false,
          isVerified: false,
        },
        text: post.text,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        location: post.location,
        latitude: post.latitude,
        longitude: post.longitude,
        distanceMeters: 10,
        createdAt: new Date(post.createdAt).toLocaleString(),
        likesCount: post.likesCount ?? 0,
        commentsCount: post.commentsCount ?? commentPayload.length,
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

export const listUsersForExplore = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    const allUsers = await ctx.db.query("users").collect();

    let followingIds = new Set<string>();
    if (currentUser) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q: any) => q.eq("followerId", currentUser._id))
        .collect();
      followingIds = new Set(follows.map((follow: any) => follow.followingId));
    }

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
        isFollowing: currentUser ? followingIds.has(user._id) : false,
        isVerified: false,
      }));
  },
});

export const listPages = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const pages = await ctx.db.query("pages").collect();

    return pages.map((page: any) => ({
      id: page._id,
      name: page.name,
      username: page.username,
      type: page.type,
      badge: page.badge ?? "COMMUNITY",
      avatar: page.avatar ?? "",
      coverImage: page.coverImage ?? "",
      description: page.description ?? "",
      location: page.location ?? "",
      followersCount: page.followersCount ?? 0,
      isFollowing: !!(ctx.db
        .query("pageFollowers")
        .withIndex("by_page_user", (q: any) => q.eq("pageId", page._id).eq("userId", currentUser._id))
        .unique()),
      category: page.category ?? "General",
      aboutInfo: {},
    }));
  },
});

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const conversations = await ctx.db
      .query("conversations")
      .filter((q: any) => q.or(q.eq(q.field("userA"), currentUser._id), q.eq(q.field("userB"), currentUser._id)))
      .collect();

    const result: any[] = [];

    for (const conversation of conversations) {
      const otherUserId = conversation.userA === currentUser._id ? conversation.userB : conversation.userA;
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
          isFollowing: false,
        },
        lastMessage: latestMessage?.text ?? "Say hello",
        timestamp: latestMessage ? new Date(latestMessage.createdAt).toLocaleTimeString() : "Now",
        unreadCount: 0,
        messages: [],
      });
    }

    return result;
  },
});

export const createPost = mutation({
  args: {
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    location: v.string(),
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

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      authorId: currentUser._id,
      text: args.text,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      location: args.location,
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
      ...args,
      author: {
        id: currentUser._id,
        name: currentUser.name ?? "You",
        username: currentUser.username ?? "you",
        avatar: currentUser.avatarUrl ?? "",
        userType: currentUser.userType ?? "person",
      },
      distanceMeters: 0,
      createdAt: new Date(now).toLocaleString(),
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
    };
  },
});

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
    return { liked: true, likesCount: nextCount };
  },
});

export const addCommentToPost = mutation({
  args: {
    postId: v.id("posts"),
    text: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, { postId, text, parentCommentId }) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const trimmed = text.trim();
    if (!trimmed) throw new Error("Comment cannot be empty");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    const commentId = await ctx.db.insert("comments", {
      postId,
      authorId: currentUser._id,
      parentCommentId,
      text: trimmed,
      createdAt: Date.now(),
      likesCount: 0,
    });

    await ctx.db.patch(postId, {
      commentsCount: (post.commentsCount ?? 0) + 1,
    });

    return {
      id: commentId,
      authorId: currentUser._id,
      text: trimmed,
      createdAt: Date.now(),
      likesCount: 0,
      parentCommentId,
    };
  },
});
