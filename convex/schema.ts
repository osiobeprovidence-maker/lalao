import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Lalao database schema.
 *
 * We store our own `users` table that stores profile + onboarding state.
 */
export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
    username: v.optional(v.string()),

    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    userType: v.optional(
      v.union(
        v.literal("person"),
        v.literal("business"),
        v.literal("organization"),
        v.literal("club"),
        v.literal("community"),
      )
    ),

    locationName: v.optional(v.string()),
    locationSub: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),

    interests: v.optional(v.array(v.string())),

    onboardingStep: v.union(
      v.literal("pending"),
      v.literal("name"),
      v.literal("profile"),
      v.literal("pronouns"),
      v.literal("location"),
      v.literal("interests"),
      v.literal("complete"),
    ),

    followersCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  posts: defineTable({
    authorId: v.id("users"),
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    createdAt: v.number(),
    likesCount: v.number(),
    commentsCount: v.number(),
    repostsCount: v.number(),
    audience: v.optional(v.union(v.literal("everyone"), v.literal("friends"), v.literal("closeFriends"))),
    replyPermission: v.optional(v.union(v.literal("everyone"), v.literal("friends"), v.literal("closeFriends"))),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    pageRefId: v.optional(v.string()),
    rallyRefId: v.optional(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_created", ["createdAt"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("comments")),
    text: v.string(),
    createdAt: v.number(),
    likesCount: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentCommentId"]),

  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("reply")),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_target", ["userId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"]),

  pages: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    username: v.string(),
    type: v.union(v.literal("business"), v.literal("organization"), v.literal("club"), v.literal("community")),
    badge: v.optional(v.union(v.literal("BIZ"), v.literal("ORG"), v.literal("CLUB"), v.literal("COMMUNITY"))),
    description: v.optional(v.string()),
    location: v.string(),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    followersCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_username", ["username"]),

  pageFollowers: defineTable({
    userId: v.id("users"),
    pageId: v.id("pages"),
    createdAt: v.number(),
  })
    .index("by_page_user", ["pageId", "userId"]),

  conversations: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_user_a", ["userA"])
    .index("by_user_b", ["userB"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),
});
