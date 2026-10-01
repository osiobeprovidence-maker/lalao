import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUser, getRelationshipSets } from "./social";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const postCycleStory = mutation({
  args: {
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("text")),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    text: v.optional(v.string()),
    caption: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    audience: v.optional(v.union(v.literal("community"), v.literal("nearby"), v.literal("friends"))),
    excludedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    let finalMediaUrl = args.mediaUrl;
    if (args.mediaStorageId) {
      const url = await ctx.storage.getUrl(args.mediaStorageId);
      if (url) finalMediaUrl = url;
    }

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours expiry

    const storyId = await ctx.db.insert("cycleStories", {
      authorId: currentUser._id,
      mediaType: args.mediaType,
      mediaUrl: finalMediaUrl,
      mediaStorageId: args.mediaStorageId,
      text: args.text,
      caption: args.caption,
      backgroundColor: args.backgroundColor,
      textColor: args.textColor,
      location: args.location || currentUser.locationName || "Local Community",
      latitude: args.latitude ?? currentUser.latitude,
      longitude: args.longitude ?? currentUser.longitude,
      audience: args.audience ?? "community",
      excludedUserIds: args.excludedUserIds,
      viewsCount: 0,
      likesCount: 0,
      createdAt: now,
      expiresAt,
    });

    return storyId;
  },
});

export const listActiveCycles = query({
  args: {
    locationName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, _args) => {
    const currentUser = await getAuthedUser(ctx);
    const now = Date.now();

    // Query unexpired stories
    const activeStories = await ctx.db
      .query("cycleStories")
      .withIndex("by_expires", (q) => q.gt("expiresAt", now))
      .collect();

    // Group stories by author
    const authorMap = new Map<string, typeof activeStories>();
    for (const story of activeStories) {
      const authorKey = story.authorId.toString();
      if (!authorMap.has(authorKey)) {
        authorMap.set(authorKey, []);
      }
      authorMap.get(authorKey)!.push(story);
    }

    const cycles: any[] = [];
    
    let followingIds = new Set<string>();
    let followerIds = new Set<string>();
    if (currentUser) {
      const sets = await getRelationshipSets(ctx, currentUser);
      followingIds = sets.followingIds;
      followerIds = sets.followerIds;
    }

    for (const [authorIdStr, stories] of authorMap.entries()) {
      const author = await ctx.db.get(stories[0].authorId);
      if (!author) continue;

      const isMyCycle = currentUser && author._id === currentUser._id;
      const authorIdString = author._id as string;
      const isFriend = followingIds.has(authorIdString) && followerIds.has(authorIdString);

      if (!isMyCycle && !isFriend) {
        continue;
      }

      const storyItems = (await Promise.all(
        stories.map(async (story) => {
          // If current user is excluded, skip this story
          if (currentUser && story.excludedUserIds && story.excludedUserIds.includes(currentUser._id)) {
            return null;
          }

          // Check if current user viewed this story
          let hasViewed = false;
          let isLiked = false;
          if (currentUser) {
            const interaction = await ctx.db
              .query("cycleStoryInteractions")
              .withIndex("by_story_user_type", (q) =>
                q.eq("storyId", story._id).eq("userId", currentUser._id)
              )
              .first();
            if (interaction) {
              if (interaction.type === "view") hasViewed = true;
              if (interaction.type === "like") isLiked = true;
            }
          }

          // Format remaining time
          const hoursLeft = Math.max(0, Math.round((story.expiresAt - now) / (1000 * 60 * 60)));

          return {
            id: story._id,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType,
            text: story.text,
            backgroundColor: story.backgroundColor,
            textColor: story.textColor,
            caption: story.caption,
            audience: story.audience,
            createdAt: new Date(story.createdAt).toISOString(),
            timeRemaining: `${hoursLeft}h left`,
            location: story.location,
            viewsCount: story.viewsCount || 0,
            likesCount: story.likesCount || 0,
            isLiked,
            hasViewed,
          };
        })
      )).filter((item): item is NonNullable<typeof item> => item !== null);

      if (storyItems.length === 0) continue;

      const hasUnseen = storyItems.some((s) => !s.hasViewed);

      cycles.push({
        id: isMyCycle ? "cycle_user_me" : `cycle_${author._id}`,
        user: {
          id: author._id,
          name: author.name || "Resident",
          username: author.username || "user",
          avatar: author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
          location: author.locationName || stories[0].location,
          isFollowing: false,
        },
        items: storyItems,
        hasUnseen: isMyCycle ? false : hasUnseen,
        updatedAt: new Date(stories[stories.length - 1].createdAt).toISOString(),
        location: stories[0].location,
        latitude: stories[0].latitude,
        longitude: stories[0].longitude,
      });
    }

    return cycles;
  },
});

export const viewStory = mutation({
  args: {
    storyId: v.id("cycleStories"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return;

    const existing = await ctx.db
      .query("cycleStoryInteractions")
      .withIndex("by_story_user_type", (q) =>
        q.eq("storyId", args.storyId).eq("userId", currentUser._id).eq("type", "view")
      )
      .first();

    if (!existing) {
      await ctx.db.insert("cycleStoryInteractions", {
        storyId: args.storyId,
        userId: currentUser._id,
        type: "view",
        createdAt: Date.now(),
      });

      const story = await ctx.db.get(args.storyId);
      if (story) {
        await ctx.db.patch(args.storyId, {
          viewsCount: (story.viewsCount || 0) + 1,
        });
      }
    }
  },
});

export const toggleLikeStory = mutation({
  args: {
    storyId: v.id("cycleStories"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("cycleStoryInteractions")
      .withIndex("by_story_user_type", (q) =>
        q.eq("storyId", args.storyId).eq("userId", currentUser._id).eq("type", "like")
      )
      .first();

    const story = await ctx.db.get(args.storyId);
    if (!story) return;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.storyId, {
        likesCount: Math.max(0, (story.likesCount || 0) - 1),
      });
      return false;
    } else {
      await ctx.db.insert("cycleStoryInteractions", {
        storyId: args.storyId,
        userId: currentUser._id,
        type: "like",
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.storyId, {
        likesCount: (story.likesCount || 0) + 1,
      });
      return true;
    }
  },
});

export const replyToStory = mutation({
  args: {
    storyId: v.id("cycleStories"),
    replyText: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    await ctx.db.insert("cycleStoryInteractions", {
      storyId: args.storyId,
      userId: currentUser._id,
      type: "reply",
      replyText: args.replyText,
      createdAt: Date.now(),
    });

    const story = await ctx.db.get(args.storyId);
    if (story && story.authorId !== currentUser._id) {
      // Send DM to the author
      const recipientId = story.authorId;
      // Look for conversation or create message
      let conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_a", (q: any) => q.eq("userA", currentUser._id))
        .filter((q: any) => q.eq(q.field("userB"), recipientId))
        .first();

      if (!conversation) {
        conversation = await ctx.db
          .query("conversations")
          .withIndex("by_user_b", (q: any) => q.eq("userB", currentUser._id))
          .filter((q: any) => q.eq(q.field("userA"), recipientId))
          .first();
      }

      let conversationId = conversation?._id;
      if (!conversationId) {
        conversationId = await ctx.db.insert("conversations", {
          userA: currentUser._id,
          userB: recipientId,
          updatedAt: Date.now(),
        });
      }

      await ctx.db.insert("messages", {
        senderId: currentUser._id,
        conversationId,
        text: `Replied to your status: "${args.replyText}"`,
        createdAt: Date.now(),
        isRead: false,
      });
    }
  },
});

export const deleteStoryItem = mutation({
  args: {
    storyId: v.id("cycleStories"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const story = await ctx.db.get(args.storyId);
    if (!story) return;
    if (story.authorId !== currentUser._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.storyId);
  },
});
