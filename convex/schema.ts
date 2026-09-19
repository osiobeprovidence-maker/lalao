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
    .index("by_username", ["username"])
    .searchIndex("search_username", { searchField: "username" })
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" })
    .searchIndex("search_phone", { searchField: "phone" }),

  posts: defineTable({
    authorId: v.id("users"),
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    createdAt: v.number(),
    likesCount: v.number(),
    commentsCount: v.number(),
    repostsCount: v.number(),
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
    rallyRefId: v.optional(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_text", { searchField: "text" }),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("comments")),
    text: v.string(),
    createdAt: v.number(),
    likesCount: v.number(),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("voice"), v.literal("gif"), v.literal("sticker"))),
    duration: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
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
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

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
    aboutInfo: v.optional(v.object({
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string()),
      hours: v.optional(v.string()),
      founded: v.optional(v.string()),
    })),
    followersCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_username", ["username"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_category", { searchField: "category" }),

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

  /**
   * Real notification events. Created server-side on like / comment / follow / rally_join.
   * recipientId  = the user who RECEIVES the notification (not the actor)
   * actorId      = the user who triggered the event
   */
  notifications: defineTable({
    recipientId: v.id("users"),
    actorId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("comment_like"),
      v.literal("reply_like"),
      v.literal("follow"),
      v.literal("rally_join"),
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    targetExcerpt: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_read", ["recipientId", "isRead"]),

  /**
   * Real user drafts — persisted in Convex so they survive device switches.
   */
  drafts: defineTable({
    authorId: v.id("users"),
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    audience: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("closeFriends"),
        v.literal("community"),
        v.literal("page"),
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
      )
    ),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    pageRefId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"]),

  products: defineTable({
    pageId: v.id("pages"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    category: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    inStock: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  subscriptionPlans: defineTable({
    pageId: v.id("pages"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    billingInterval: v.union(v.literal("monthly"), v.literal("yearly")),
    benefits: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  userSubscriptions: defineTable({
    userId: v.id("users"),
    pageId: v.id("pages"),
    planId: v.id("subscriptionPlans"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due")
    ),
    startedAt: v.optional(v.number()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_page", ["pageId"])
    .index("by_user_page", ["userId", "pageId"]),
});

