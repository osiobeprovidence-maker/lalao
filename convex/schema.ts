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
    avatarStorageId: v.optional(v.union(v.id("_storage"), v.null())),
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
    homeFeedPreferences: v.optional(v.any()),

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
    // Platform role — super_admin has full platform access
    role: v.optional(
      v.union(
        v.literal("user"),
        v.literal("moderator"),
        v.literal("editor"),
        v.literal("admin"),
        v.literal("super_admin"),
      )
    ),
    // Whether account is suspended
    suspended: v.optional(v.boolean()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .searchIndex("search_username", { searchField: "username" })
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" })
    .searchIndex("search_phone", { searchField: "phone" }),

  drafts: defineTable({
    authorId: v.id("users"),
    text: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    audience: v.optional(v.string()),
    replyPermission: v.optional(v.string()),
    gifUrl: v.optional(v.string()),
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),
    pageRefId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_author", ["authorId"]),

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
    rallyRefId: v.optional(v.string()),
    moderationStatus: v.optional(v.union(v.literal("removed"), v.literal("flagged"), v.literal("safe"))),
    removedAt: v.optional(v.number()),
    removedBy: v.optional(v.id("users")),
    removalReason: v.optional(v.string()), // Deprecated/legacy string reason
    removalReasonCode: v.optional(v.string()),
    removalReasonId: v.optional(v.id("moderationReasons")),
    violationLevel: v.optional(v.string()),
    moderationNote: v.optional(v.string()),
    contentTopics: v.optional(v.array(v.string())),
    // Mux video & media processing fields
    muxUploadId: v.optional(v.string()),
    muxAssetId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    mediaStatus: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      )
    ),
    mediaProcessingError: v.optional(v.string()),
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
    .index("by_parent", ["parentCommentId"])
    .index("by_author", ["authorId"]),

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
    businessType: v.optional(v.union(v.literal("commerce"), v.literal("subscription"), v.literal("hybrid"))),
    activeTools: v.optional(v.array(v.string())),
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
    userB: v.optional(v.id("users")), // Optional if the conversation is with a Page
    pageB: v.optional(v.id("pages")), // Present if the conversation is with a Page
    updatedAt: v.number(),
  })
    .index("by_user_a", ["userA"])
    .index("by_user_b", ["userB"])
    .index("by_page_b", ["pageB"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"), // The actual user who sent the message
    pageSenderId: v.optional(v.id("pages")), // Present if the user is replying as the Page
    text: v.string(),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation_read", ["conversationId", "isRead"]),

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
      v.literal("system_alert"),
      v.literal("message"),
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    conversationId: v.optional(v.id("conversations")),
    messageId: v.optional(v.id("messages")),
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
        v.literal("nearby"),
        v.literal("anime"),
        v.literal("interest"),
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
        v.literal("mentioned"),
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

  // ---- WALLET SYSTEM ----
  userWallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    currency: v.string(),
    accountNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  walletTransactions: defineTable({
    walletId: v.id("userWallets"),
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("subscription_payment"),
      v.literal("product_order"),
      v.literal("tournament_fee"),
      v.literal("prize_payout"),
      v.literal("transfer_in"),
      v.literal("transfer_out")
    ),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    description: v.string(),
    reference: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletId"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  // ---- SUBSCRIPTION BUSINESS SYSTEM ----

  subscriptionPlatforms: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.string(),
    category: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  subscriptionListings: defineTable({
    pageId: v.id("pages"),
    platformId: v.optional(v.id("subscriptionPlatforms")),
    platformName: v.optional(v.string()),
    platformLogo: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    totalAccountCost: v.number(),
    currency: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    totalCapacity: v.number(),
    defaultSlotPrice: v.number(),
    allowDifferentSlotPrices: v.boolean(),
    accountEmail: v.optional(v.string()), // Private
    providerTag: v.optional(v.string()), // Private
    privateNotes: v.optional(v.string()), // Private
    memberInstructions: v.optional(v.string()),
    benefits: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  subscriptionSlots: defineTable({
    subscriptionId: v.id("subscriptionListings"),
    pageId: v.id("pages"),
    slotNumber: v.number(),
    status: v.union(v.literal("available"), v.literal("occupied"), v.literal("paused")),
    currentMemberId: v.optional(v.id("users")),
    priceOverride: v.optional(v.number()), // if allowDifferentSlotPrices is true
    role: v.optional(v.union(v.literal("Head of Family"), v.literal("Member"))), // defined by business
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_page", ["pageId"])
    .index("by_subscription_status", ["subscriptionId", "status"]),

  subscriptionMemberships: defineTable({
    userId: v.id("users"),
    pageId: v.id("pages"),
    subscriptionId: v.id("subscriptionListings"),
    slotId: v.id("subscriptionSlots"),
    role: v.union(v.literal("Head of Family"), v.literal("Member")),
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
    .index("by_subscription", ["subscriptionId"])
    .index("by_slot", ["slotId"])
    .index("by_user_subscription", ["userId", "subscriptionId"]),

  // ---- PLATFORM ADMINISTRATION ----

  platformSettings: defineTable({
    key: v.string(),       // e.g. "platform_name", "feature_subscriptions"
    value: v.string(),     // JSON-serialised value
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  auditLog: defineTable({
    actorId: v.id("users"),
    action: v.string(),      // e.g. "changed_user_role", "updated_platform_settings"
    target: v.optional(v.string()),  // target entity description
    before: v.optional(v.string()), // JSON-serialised previous value
    after: v.optional(v.string()),  // JSON-serialised new value
    createdAt: v.number(),
  })
    .index("by_actor", ["actorId"])
    .index("by_created", ["createdAt"]),

  // ---- COMMUNITY SUGGESTIONS ----

  communitySuggestions: defineTable({
    suggestedByUserId: v.id("users"),
    communityName: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    reason: v.optional(v.string()),
    additionalInfo: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["suggestedByUserId"])
    .index("by_created", ["createdAt"]),

  adminSessions: defineTable({
    userId: v.id("users"),
    token: v.string(), // Secure randomly generated token
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // ---- PUSH NOTIFICATIONS ----

  /**
   * FCM device tokens — one row per user/device.
   * Upserted from the frontend after the user grants notification permission.
   */
  fcmTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),           // Firebase Cloud Messaging registration token
    userAgent: v.optional(v.string()), // Browser/device label for display
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    deviceId: v.optional(v.string()),
    browser: v.optional(v.string()),
    platform: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    isActive: v.boolean(),
    provider: v.string(), // e.g., "web_push"
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"])
    .index("by_user_active", ["userId", "isActive"]),

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("user"),
      v.literal("page"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("product"),
      v.literal("event"),
      v.literal("message"),
      v.literal("other")
    ),
    targetId: v.string(), 
    reason: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("critical")),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("dismissed"),
      v.literal("escalated")
    ),
    assignedTo: v.optional(v.id("users")), 
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    resolution: v.optional(v.string()),
    resolutionNote: v.optional(v.string()),
    moderationReasonId: v.optional(v.id("moderationReasons")),
    moderationReasonCode: v.optional(v.string()),
    violationLevel: v.optional(v.string()),
    userNotificationMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_reporter", ["reporterId"])
    .index("by_created", ["createdAt"]),

  moderationReasons: defineTable({
    code: v.string(),
    title: v.string(),
    description: v.string(),
    userMessage: v.string(),
    defaultSeverity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    enabled: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  topics: defineTable({
    slug: v.string(),
    displayName: v.string(),
    description: v.string(),
    displayOrder: v.number(),
    defaultEnabled: v.boolean(),
    userSelectable: v.boolean(),
    homeEnabled: v.boolean(),
    icon: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active_order", ["active", "displayOrder"]),
});
