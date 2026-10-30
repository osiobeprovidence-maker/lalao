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
    emailNormalized: v.optional(v.string()),
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
    lastSignInProvider: v.optional(v.union(v.literal("firebase"), v.literal("playsole"))),
    lastSignInMethod: v.optional(v.string()),
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

    // Phone & Country access control
    countryCode: v.optional(v.string()),
    countryName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    phoneSetupCompleted: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
    accessStatus: v.optional(
      v.union(
        v.literal("available"),
        v.literal("country_restricted"),
        v.literal("waitlisted")
      )
    ),

    // Disappearing Messages Setting
    disappearingMode: v.optional(v.string()),
    disappearingCustomValue: v.optional(v.number()),
    disappearingCustomUnit: v.optional(v.string()),

    // Public Identity Display Preference: "display_name", "username", or "both"
    publicIdentityType: v.optional(
      v.union(v.literal("display_name"), v.literal("username"), v.literal("both"))
    ),

    // Date of Birth & Visibility
    dateOfBirth: v.optional(v.string()), // Format: YYYY-MM-DD
    birthDateVisibility: v.optional(
      v.union(
        v.literal("public"),      // Show full birthday / age
        v.literal("age_only"),    // Show only age (e.g. 24 yrs)
        v.literal("private")      // Only visible to the user in settings
      )
    ),
      notificationPrefs: v.optional(v.object({
        messages: v.optional(v.boolean()),
        cycles: v.optional(v.boolean()),
        likes: v.optional(v.boolean()),
        comments: v.optional(v.boolean()),
        follows: v.optional(v.boolean()),
        mentions: v.optional(v.boolean()),
        desktop: v.optional(v.boolean())
      })),

    // Creator Ecosystem & Verification Tiers
    verificationTier: v.optional(
      v.union(
        v.literal("none"),
        v.literal("verified"),      // Tier 3 — Standard Verified (₦800)
        v.literal("priority"),      // Tier 4 — Priority Verified (₦1,700)
        v.literal("creator")        // Tier 5 — Creator Premium (₦3,500)
      )
    ),
    verificationStatus: v.optional(
      v.union(
        v.literal("inactive"),
        v.literal("active"),
        v.literal("expired"),
        v.literal("cancelled")
      )
    ),
    verificationExpiresAt: v.optional(v.number()),
    creatorCategory: v.optional(v.string()),
    creatorType: v.optional(v.union(v.literal("manga"), v.literal("short_movie"))),
    mangaPublisherName: v.optional(v.string()),
    mangaCreatorAbout: v.optional(v.string()),
    shortMovieStudioName: v.optional(v.string()),
    shortMovieCreatorAbout: v.optional(v.string()),
    creatorAccountStatus: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("closed"))),
    creatorLevel: v.optional(v.number()),
    creatorEarnings: v.optional(v.number()),
    creatorPendingEarnings: v.optional(v.number()),
    creatorAchievements: v.optional(v.array(v.string())),
    creatorPriorityWeight: v.optional(v.number()),

    // Administrative test/demo account marker
    is_test_account: v.optional(v.boolean()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_email_normalized", ["emailNormalized"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_test_account", ["is_test_account"])
    .searchIndex("search_username", { searchField: "username" })
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" })
    .searchIndex("search_phone", { searchField: "phone" }),

  authIdentities: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("firebase"), v.literal("playsole")),
    issuer: v.string(),
    subject: v.string(),
    tokenIdentifier: v.string(),
    method: v.optional(v.string()),
    emailNormalized: v.optional(v.string()),
    emailVerified: v.boolean(),
    linkedAt: v.number(),
  })
    // Convex indexes are not unique constraints. Keep provider/subject and
    // token identifiers deterministic so mutations can enforce uniqueness.
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_issuer_subject", ["issuer", "subject"])
    .index("by_user", ["userId"])
    .index("by_email_normalized", ["emailNormalized"]),

  authLinkChallenges: defineTable({
    token: v.string(),
    userId: v.id("users"),
    initiatingTokenIdentifier: v.optional(v.string()),
    initiatingIssuer: v.optional(v.string()),
    initiatingSubject: v.optional(v.string()),
    targetProvider: v.union(v.literal("firebase"), v.literal("playsole")),
    createdAt: v.number(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  }).index("by_token", ["token"]),

  authMigrationState: defineTable({
    key: v.string(),
    emailNormalizedAt: v.optional(v.number()),
    authIdentitiesBackfilledAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  emailSendLimits: defineTable({
    key: v.string(),
    sentAt: v.number(),
  }).index("by_key", ["key"]),

  authIdentityBackfillConflicts: defineTable({
    userId: v.id("users"),
    tokenIdentifier: v.string(),
    notedAt: v.number(),
  }).index("by_user", ["userId"]),

  waitlist: defineTable({
    userId: v.id("users"),
    email: v.optional(v.string()),
    phoneNumber: v.string(),
    countryCode: v.string(),
    countryName: v.string(),
    status: v.union(v.literal("active"), v.literal("notified")),
    notifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_country", ["countryCode"]),

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
        v.literal("group"),
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
    groupRefId: v.optional(v.string()),
    rallyRefId: v.optional(v.string()),
    mediaWidth: v.optional(v.number()),
    mediaHeight: v.optional(v.number()),
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
    // Sound & Music attachment fields
    soundId: v.optional(v.union(v.id("sounds"), v.string())),
    soundTitle: v.optional(v.string()),
    soundAuthorName: v.optional(v.string()),
    soundAudioUrl: v.optional(v.string()),
    soundStartOffset: v.optional(v.number()),
    soundVolume: v.optional(v.number()),
    originalAudioVolume: v.optional(v.number()),
    // Location snapshot fields (captured at post publication)
    locationAccuracy: v.optional(v.number()),
    locationCapturedAt: v.optional(v.number()),
    locationCountry: v.optional(v.string()),
    locationState: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    locationNeighborhood: v.optional(v.string()),
    locationStatus: v.optional(
      v.union(v.literal("verified"), v.literal("approximate"), v.literal("unverified"))
    ),
    nearbyEnabled: v.optional(v.boolean()),
  })
    .index("by_author", ["authorId"])
    .index("by_created", ["createdAt"])
    .index("by_group_ref", ["groupRefId"])
    .index("by_sound", ["soundId"])
    .index("by_nearby_created", ["nearbyEnabled", "createdAt"])
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
    
    // Commerce Partner Extensions
    partnerType: v.optional(v.union(v.literal("COMMERCE_PARTNER"), v.literal("API_PARTNER"))),
    partnerStatus: v.optional(v.union(v.literal("ACTIVE"), v.literal("PENDING"), v.literal("SUSPENDED"))),
    ownerStatus: v.optional(v.union(v.literal("ASSIGNED"), v.literal("UNASSIGNED"))),
    integrationStatus: v.optional(v.string()),
    externalPartnerId: v.optional(v.string()),

    // Global Business Extensions
    globalDiscoveryStatus: v.optional(v.union(v.literal("global"), v.literal("national"), v.literal("regional"), v.literal("local"))),
    serviceAreas: v.optional(v.array(v.string())),
    isOnlineBusiness: v.optional(v.boolean()),

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

  pageMembers: defineTable({
    pageId: v.id("pages"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("staff"),
      v.literal("editor")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_user", ["userId"])
    .index("by_page_user", ["pageId", "userId"]),

  pageExtensions: defineTable({
    pageId: v.id("pages"),
    category: v.string(),
    data: v.any(), // Flexible JSON payload for category-specific data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_category", ["category"]),

  pageLocations: defineTable({
    pageId: v.id("pages"),
    name: v.string(),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.boolean(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  pageFollowers: defineTable({
    userId: v.id("users"),
    pageId: v.id("pages"),
    createdAt: v.number(),
  })
    .index("by_page_user", ["pageId", "userId"])
    .index("by_user", ["userId"]),

  conversations: defineTable({
    userA: v.id("users"),
    userB: v.optional(v.id("users")), // Optional if the conversation is with a Page
    pageB: v.optional(v.id("pages")), // Present if the conversation is with a Page
    groupChatId: v.optional(v.id("groupChats")), // Private group conversations
    updatedAt: v.number(),
  })
    .index("by_user_a", ["userA"])
    .index("by_user_b", ["userB"])
    .index("by_page_b", ["pageB"])
    .index("by_group_chat", ["groupChatId"]),

  groupChats: defineTable({
    name: v.string(),
    username: v.optional(v.string()),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    memberIds: v.array(v.id("users")),
    avatarUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    rules: v.optional(v.array(v.string())),
    interests: v.array(v.string()),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private_discoverable"),
        v.literal("private_hidden")
      )
    ),
    communityEnabled: v.optional(v.boolean()),
    communityFeatures: v.optional(
      v.object({
        posts: v.boolean(),
        replies: v.boolean(),
        media: v.boolean(),
        rallies: v.boolean(),
      })
    ),
    publishingPermissions: v.optional(
      v.object({
        canPost: v.string(),
        canReply: v.string(),
        canUploadMedia: v.string(),
        canCreateRallies: v.string(),
      })
    ),
    isChatroom: v.optional(v.boolean()),
    allowPublicPreview: v.optional(v.boolean()),
    roomIcon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_username", ["username"])
    .index("by_visibility", ["visibility"])
    .index("by_is_chatroom", ["isChatroom"]),

  groupMembers: defineTable({
    groupId: v.id("groupChats"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member")
    ),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"])
    .index("by_group_role", ["groupId", "role"]),

  groupJoinRequests: defineTable({
    groupId: v.id("groupChats"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    message: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_group_status", ["groupId", "status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_group_user", ["groupId", "userId"]),

  groupInvitations: defineTable({
    groupId: v.id("groupChats"),
    inviterId: v.id("users"),
    invitedUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_group_status", ["groupId", "status"])
    .index("by_invited_user_status", ["invitedUserId", "status"])
    .index("by_group_invited_user", ["groupId", "invitedUserId"]),

  groupFollowers: defineTable({
    groupId: v.id("groupChats"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_group_user", ["groupId", "userId"])
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"]),

  groupCycles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    memberIds: v.array(v.id("users")),
    interests: v.array(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"), // The actual user who sent the message
    pageSenderId: v.optional(v.id("pages")), // Present if the user is replying as the Page
    text: v.string(),
    isRead: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    replyToMessageId: v.optional(v.id("messages")),
    isEdited: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("call"))),
    callId: v.optional(v.id("calls")),
    callType: v.optional(v.union(v.literal("voice"), v.literal("video"))),
    callDuration: v.optional(v.number()),
    callStatus: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mimeType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    audioStorageId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()),
    viewOnce: v.optional(v.boolean()),
    viewOnceOpened: v.optional(v.boolean()),
    viewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation_read", ["conversationId", "isRead"]),

  /**
   * Real-time Voice and Video Calling sessions via Agora RTC.
   */
  calls: defineTable({
    callerId: v.id("users"),
    recipientId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
    type: v.union(v.literal("voice"), v.literal("video")),
    status: v.union(
      v.literal("calling"),
      v.literal("ringing"),
      v.literal("connected"),
      v.literal("completed"),
      v.literal("missed"),
      v.literal("declined"),
      v.literal("canceled"),
      v.literal("failed")
    ),
    channelName: v.string(),
    callerUid: v.number(),
    recipientUid: v.number(),
    startedAt: v.number(),
    connectedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    endReason: v.optional(v.string()),
  })
    .index("by_caller", ["callerId"])
    .index("by_recipient", ["recipientId"])
    .index("by_conversation", ["conversationId"])
    .index("by_recipient_status", ["recipientId", "status"])
    .index("by_caller_status", ["callerId", "status"])
    .index("by_channel", ["channelName"]),

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
      v.literal("subscription_joined"),
      v.literal("subscription_renewal"),
      v.literal("subscription_cancelled"),
      v.literal("subscription_payment_failed"),
      v.literal("missed_call"),
      v.literal("incoming_call"),
      v.literal("ad_submitted"),
      v.literal("ad_payment_confirmed"),
      v.literal("ad_approved"),
      v.literal("ad_rejected"),
      v.literal("ad_paused"),
      v.literal("ad_completed"),
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
    .index("by_recipient_read", ["recipientId", "isRead"])
    .index("by_post", ["postId"]),

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
    images: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    externalProductId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    selectedOptions: v.optional(v.any()), // Record<string, string>
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  orders: defineTable({
    buyerId: v.id("users"),
    pageId: v.id("pages"),
    totalAmount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("processing"),
      v.literal("confirmed")
    ),
    shippingAddress: v.optional(v.any()),
    externalOrderId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_buyer", ["buyerId"]).index("by_page", ["pageId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    priceAtPurchase: v.number(),
    selectedOptions: v.optional(v.any()),
  }).index("by_order", ["orderId"]),

  auctions: defineTable({
    pageId: v.id("pages"),
    productId: v.id("products"),
    startingBid: v.number(),
    currentBid: v.number(),
    currency: v.string(),
    endsAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("upcoming"),
      v.literal("ended"),
      v.literal("cancelled")
    ),
    externalAuctionId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_page", ["pageId"]).index("by_product", ["productId"]),

  auctionBids: defineTable({
    auctionId: v.id("auctions"),
    userId: v.id("users"),
    bidAmount: v.number(),
    createdAt: v.number(),
  }).index("by_auction", ["auctionId"]).index("by_user", ["userId"]),

  // ---- WALLET SYSTEM ----
  cryptoWallets: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    provider: v.string(), // e.g. "metamask", "walletconnect"
    network: v.optional(v.string()), // e.g. "Polygon"
    isConnected: v.boolean(),
    lastConnectedAt: v.number(),
  }).index("by_user", ["userId"]),

  userWallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    currency: v.string(),
    accountNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    walletPin: v.optional(v.string()), // 4-digit transaction security PIN
    pinResetOtp: v.optional(v.string()),
    pinResetExpiresAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  walletTransactions: defineTable({
    walletId: v.id("userWallets"),
    userId: v.id("users"),
    relatedUserId: v.optional(v.id("users")),
    relatedUserName: v.optional(v.string()),
    relatedUserUsername: v.optional(v.string()),
    amount: v.number(),
    fee: v.optional(v.number()),
    currency: v.optional(v.string()), // 'LC' or 'USDC' etc.
    assetType: v.optional(v.union(v.literal("LALAO_CREDITS"), v.literal("CRYPTO"))),
    blockchainNetwork: v.optional(v.string()), // e.g. 'Ethereum', 'Polygon'
    transactionHash: v.optional(v.string()),
    paymentProvider: v.optional(v.string()), // e.g. 'paystack', 'metamask', 'internal'
    providerTransactionId: v.optional(v.string()),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("subscription_payment"),
      v.literal("product_order"),
      v.literal("tournament_fee"),
      v.literal("prize_payout"),
      v.literal("transfer_out"),
      v.literal("MARKET_PURCHASE"),
      v.literal("MARKET_REFUND"),
      v.literal("gift_sent"),
      v.literal("page_payment")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("reversed"),
      v.literal("cancelled")
    ),
    description: v.string(),
    reference: v.optional(v.string()),
    relatedPageId: v.optional(v.id("pages")),
    metadata: v.optional(v.any()),
    receiptNumber: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletId"])
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_created", ["createdAt"])
    .index("by_reference", ["reference"]),

  // ---- MARKET TRANSACTIONS ----
  marketTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "MARKET_PURCHASE"
    category: v.string(), // "AIRTIME", "DATA", "ELECTRICITY", "CABLE_TV"
    provider: v.string(), // e.g. "vtu_ng"
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("REFUNDED"),
      v.literal("REVERSED")
    ),
    requestId: v.string(),
    providerOrderId: v.optional(v.string()),
    amount: v.number(),
    providerAmount: v.optional(v.number()),
    providerDiscount: v.optional(v.number()),
    platformFee: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    recipient: v.string(),
    customerId: v.optional(v.string()),
    customerName: v.optional(v.string()),
    phone: v.optional(v.string()),
    network: v.optional(v.string()),
    variationId: v.optional(v.string()),
    productName: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    token: v.optional(v.string()),
    units: v.optional(v.string()),
    meterType: v.optional(v.string()),
    metadata: v.optional(v.any()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_request_id", ["requestId"])
    .index("by_provider_order_id", ["providerOrderId"]),

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
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("3_months"),
      v.literal("6_months"),
      v.literal("12_months")
    ),
    durationMonths: v.optional(v.number()), // Explicit duration in calendar months (3, 6, 12)
    totalCapacity: v.number(),
    defaultSlotPrice: v.number(),
    allowDifferentSlotPrices: v.boolean(),
    accountEmail: v.optional(v.string()), // Private
    providerTag: v.optional(v.string()), // Private
    privateNotes: v.optional(v.string()), // Private
    memberInstructions: v.optional(v.string()),
    eligibilityRules: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
    renewalRules: v.optional(v.string()),
    gracePeriodDays: v.optional(v.number()),
    benefits: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  subscriptionSlots: defineTable({
    subscriptionId: v.id("subscriptionListings"),
    pageId: v.id("pages"),
    slotNumber: v.number(),
    status: v.union(v.literal("available"), v.literal("reserved"), v.literal("occupied"), v.literal("paused")),
    currentMemberId: v.optional(v.id("users")),
    reservedForUserId: v.optional(v.id("users")),
    reservationExpiresAt: v.optional(v.number()),
    priceOverride: v.optional(v.number()), // if allowDifferentSlotPrices is true
    role: v.optional(v.union(v.literal("Head of Family"), v.literal("Member"))), // defined by business
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_page", ["pageId"])
    .index("by_subscription_status", ["subscriptionId", "status"]),

  subscriptionReservations: defineTable({
    subscriptionId: v.id("subscriptionListings"),
    slotId: v.id("subscriptionSlots"),
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    durationMonths: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("expired"), v.literal("cancelled")),
    paymentMethod: v.union(v.literal("wallet"), v.literal("paystack")),
    paystackReference: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slot", ["slotId"])
    .index("by_reference", ["paystackReference"])
    .index("by_status", ["status"]),

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
      v.literal("past_due"),
      v.literal("expired")
    ),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    durationMonths: v.optional(v.number()),
    paymentMethod: v.optional(v.union(v.literal("wallet"), v.literal("paystack"))),
    lastPaymentReference: v.optional(v.string()),
    lastPaymentStatus: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    nextRenewalDate: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    autoRenew: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_page", ["pageId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_slot", ["slotId"])
    .index("by_user_subscription", ["userId", "subscriptionId"])
    .index("by_status", ["status"]),

  subscriptionAuditLogs: defineTable({
    pageId: v.id("pages"),
    subscriptionId: v.optional(v.id("subscriptionListings")),
    performedByUserId: v.id("users"),
    action: v.string(), // e.g. "CREATE_LISTING", "UPDATE_PRICE", "MANUAL_RECONCILE", "CANCEL_MEMBERSHIP"
    details: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_user", ["performedByUserId"]),

  creatorSubscriptions: defineTable({
    userId: v.id("users"),
    tier: v.union(v.literal("verified"), v.literal("priority"), v.literal("creator")),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("cancelled"), v.literal("expired")),
    price: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    paystackReference: v.optional(v.string()),
    bachsReference: v.optional(v.string()),
    bachsCheckoutId: v.optional(v.string()),
    bachsCheckoutUrl: v.optional(v.string()),
    bachsProductId: v.optional(v.string()),
    bachsSubscriptionId: v.optional(v.string()),
    billingStatus: v.optional(v.string()),
    cancelAtPeriodEnd: v.boolean(),
    startedAt: v.number(),
    expiresAt: v.number(),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_bachs_reference", ["bachsReference"])
    .index("by_bachs_product", ["bachsProductId"])
    .index("by_bachs_subscription", ["bachsSubscriptionId"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"])
    .index("by_user_status", ["userId", "status"]),

  creatorApplications: defineTable({
    userId: v.id("users"),
    creatorType: v.union(v.literal("manga"), v.literal("short_movie")),
    publisherName: v.string(),
    portfolioUrl: v.string(),
    sampleChapterUrl: v.optional(v.string()),
    about: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewNote: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

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
    publishedPageId: v.optional(v.id("pages")),
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
      v.literal("roomyListing"),
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
      v.literal("resolved_violation"),
      v.literal("resolved_no_violation"),
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
    category: v.optional(v.string()), // e.g. "Identity & Community", "Entertainment", "Tech & Science"
    displayOrder: v.number(),
    defaultEnabled: v.boolean(),
    userSelectable: v.boolean(),
    homeEnabled: v.boolean(),
    icon: v.optional(v.string()),
    isSensitive: v.optional(v.boolean()), // true for LGBTQ+, religion, politics etc. requiring safeguards
    requiresExplicitOptIn: v.optional(v.boolean()), // Proactive discovery recommendations require viewer opt-in
    requiresCreatorConfirmation: v.optional(v.boolean()), // Creator must confirm categorization
    allowAutoSuggestion: v.optional(v.boolean()), // May not be automatically guessed or assumed
    allowPublicAnalytics: v.optional(v.boolean()), // Keep private from public analytics
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active_order", ["active", "displayOrder"])
    .index("by_active", ["active"])
    .index("by_sensitive", ["isSensitive"]),

  // ---- ROOMY HOUSING MARKETPLACE ----
  roomyProfiles: defineTable({
    userId: v.id("users"),
    university: v.optional(v.string()),
    campus: v.optional(v.string()),
    preferredLocation: v.optional(v.string()),
    preferredAreas: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    roomType: v.optional(v.string()),
    moveInPeriod: v.optional(v.string()),
    roommatePreferences: v.optional(v.string()),
    roommatesWanted: v.optional(v.number()),
    lifestyle: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  roomyListings: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("room_offered"), v.literal("room_wanted"), v.literal("roommate_wanted")),
    status: v.union(v.literal("active"), v.literal("filled"), v.literal("inactive"), v.literal("removed")),
    title: v.optional(v.string()), // Optional since 'room_wanted' might not have a formal title
    description: v.string(),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    location: v.string(), // e.g., "University of Benin - Ugbowo"
    university: v.optional(v.string()),
    campus: v.optional(v.string()),
    area: v.optional(v.string()),
    roomType: v.optional(v.string()),
    availabilityDate: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    photos: v.optional(v.array(v.string())), // URLs or storage IDs
    roommatesNeeded: v.optional(v.number()),
    preferences: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_location", ["location"])
    .searchIndex("search_location", { searchField: "location" })
    .searchIndex("search_description", { searchField: "description" }),

  roomySaves: defineTable({
    userId: v.id("users"),
    listingId: v.id("roomyListings"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_listing", ["listingId"])
    .index("by_user_listing", ["userId", "listingId"]),

  roomyInspections: defineTable({
    requesterId: v.id("users"),
    ownerId: v.id("users"),
    listingId: v.id("roomyListings"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("rescheduled")),
    proposedDate: v.string(), // ISO string or human readable
    message: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requester", ["requesterId"])
    .index("by_owner", ["ownerId"])
    .index("by_listing", ["listingId"]),

  // ---- RECOMMENDATION SYSTEM ----
  recommendations: defineTable({
    targetId: v.string(), // ID of the user, page, or community being recommended
    targetType: v.union(v.literal("user"), v.literal("page"), v.literal("community")),
    category: v.string(), // e.g., "featured", "seed", "new_creator"
    priority: v.number(), // Higher number = higher priority
    active: v.boolean(), // Whether this recommendation is currently active
    addedBy: v.optional(v.id("users")), // Admin who added it
    reason: v.optional(v.string()), // Internal note
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active_priority", ["active", "priority"])
    .index("by_target", ["targetId"]),

  recommendationInteractions: defineTable({
    userId: v.id("users"),
    recommendationType: v.string(), // e.g. "person", "post", "page"
    targetId: v.string(),
    action: v.union(v.literal("shown"), v.literal("clicked"), v.literal("dismissed"), v.literal("followed"), v.literal("liked"), v.literal("opened")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_target_action", ["userId", "targetId", "action"])
    .index("by_target_action", ["targetId", "action"]),

  recommendationDismissals: defineTable({
    userId: v.id("users"),
    targetId: v.string(), // ID of the user, page, or community dismissed
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_target", ["userId", "targetId"]),

  rallies: defineTable({
    creatorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    type: v.optional(v.union(v.literal("ASK"), v.literal("HELP"), v.literal("JOIN"))), // optional for backward compatibility
    title: v.string(),
    description: v.string(),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    distanceMeters: v.optional(v.number()), // made optional
    eventDate: v.optional(v.string()),
    eventTime: v.optional(v.string()),
    timeDate: v.optional(v.string()), // keeping for old
    category: v.optional(
      v.union(
        v.literal("Sports"),
        v.literal("Help"),
        v.literal("Meetup"),
        v.literal("Initiative"),
        v.literal("Civic"),
        v.literal("General")
      )
    ),
    status: v.union(v.literal("active"), v.literal("completed")),
    peopleNeeded: v.optional(v.number()),
    maxNeeded: v.optional(v.number()), // old
    compensationType: v.optional(
      v.union(v.literal("free"), v.literal("paying"), v.literal("charging"), v.literal("other"))
    ),
    compensationAmount: v.optional(v.string()),
    participantCount: v.optional(v.number()),
    urgency: v.optional(v.union(v.literal("normal"), v.literal("urgent"))),
    tags: v.optional(v.array(v.string())),
    groupRefId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_post", ["postId"])
    .index("by_status", ["status"])
    .index("by_group_ref", ["groupRefId"]),

  rallyParticipants: defineTable({
    userId: v.id("users"),
    rallyId: v.id("rallies"),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_rally", ["rallyId"]),

  pageEvents: defineTable({
    pageId: v.id("pages"),
    title: v.string(),
    type: v.string(),
    coverImage: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    isOnline: v.boolean(),
    registrationStatus: v.string(),
    isTournament: v.optional(v.boolean()),
    isTicketed: v.optional(v.boolean()),
    ticketPrice: v.optional(v.number()),
    prizePool: v.optional(v.number()),
    prizeCurrency: v.optional(v.string()),
    description: v.optional(v.string()),
    availableTickets: v.optional(v.number()),
    totalTickets: v.optional(v.number()),
    rules: v.optional(v.string()),
    schedule: v.optional(v.any()), // Array of objects or strings depending on client
    createdAt: v.number(),
  }).index("by_page", ["pageId"]),

  // ---- API PARTNERS SYSTEM ----
  apiPartners: defineTable({
    name: v.string(),
    slug: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    company: v.optional(v.string()),
    type: v.string(), // e.g., 'event_platform', 'ticketing_platform'
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("pending")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  apiPlans: defineTable({
    partnerId: v.id("apiPartners"),
    name: v.string(),
    monthlyPrice: v.number(),
    currency: v.string(),
    eventLimit: v.number(),
    requestLimit: v.number(),
    requestsPerMinute: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_partner", ["partnerId"]),

  apiCredentials: defineTable({
    partnerId: v.id("apiPartners"),
    environment: v.union(v.literal("test"), v.literal("live")),
    keyHash: v.string(), // Secure hash of the API key
    prefix: v.string(), // First few characters for display
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  }).index("by_partner", ["partnerId"])
    .index("by_keyHash", ["keyHash"]),

  apiPermissions: defineTable({
    partnerId: v.id("apiPartners"),
    permission: v.string(),
    createdAt: v.number(),
  }).index("by_partner", ["partnerId"]),

  apiUsage: defineTable({
    partnerId: v.id("apiPartners"),
    environment: v.union(v.literal("test"), v.literal("live")),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTimeMs: v.number(),
    timestamp: v.number(),
    monthKey: v.string(),
  })
    .index("by_partner", ["partnerId"])
    .index("by_partner_month", ["partnerId", "monthKey"]),

  apiBilling: defineTable({
    partnerId: v.id("apiPartners"),
    billingPeriod: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("overdue"), v.literal("suspended")),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_partner", ["partnerId"]),

  partnerEvents: defineTable({
    partnerId: v.id("apiPartners"),
    externalId: v.string(),
    lalaoEventId: v.optional(v.string()), 
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    locationName: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    organizerName: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("draft")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_partner", ["partnerId"])
    .index("by_externalId", ["partnerId", "externalId"]),

  cycleStories: defineTable({
    authorId: v.id("users"),
    groupCycleId: v.optional(v.id("groupCycles")),
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
    duration: v.optional(v.number()),
    viewsCount: v.number(),
    likesCount: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_group_cycle", ["groupCycleId"])
    .index("by_expires", ["expiresAt"]),

  cycleStoryInteractions: defineTable({
    storyId: v.id("cycleStories"),
    userId: v.id("users"),
    type: v.union(v.literal("view"), v.literal("like"), v.literal("reply")),
    replyText: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_story_user_type", ["storyId", "userId", "type"]),

  // ---- BETA TESTER SYSTEM ----
  betaTesters: defineTable({
    userId: v.optional(v.id("users")), // If logged in
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    lalaoUsername: v.string(),
    device: v.string(),
    androidVersion: v.string(),
    registrationDate: v.number(),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("inactive")),
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

  betaFeedback: defineTable({
    testerId: v.optional(v.id("betaTesters")), // Reference to beta tester record
    testerName: v.string(),
    testerEmail: v.string(),
    lalaoUsername: v.optional(v.string()),
    type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("general")),
    feature: v.string(),
    description: v.string(),
    device: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    attachments: v.optional(v.array(v.string())),
    status: v.union(v.literal("open"), v.literal("in_review"), v.literal("resolved"), v.literal("closed")),
    date: v.number(),
    internalNotes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_tester", ["testerEmail"]),

  betaReleases: defineTable({
    version: v.string(),
    releaseDate: v.number(),
    apkUrl: v.string(),
    fileSize: v.string(), // e.g. "45MB"
    minAndroidVersion: v.string(), // e.g. "Android 8.0"
    releaseNotes: v.string(),
    isCurrent: v.boolean(),
    status: v.union(v.literal("active"), v.literal("archived")),
  })
    .index("by_status", ["status"]),

  betaSettings: defineTable({
    openLalaoUrl: v.string(),
    betaCommunityUrl: v.string(),
    faqs: v.array(v.object({ question: v.string(), answer: v.string() })),
  }),

  // ---- SOUNDS & MUSIC LIBRARY ----
  sounds: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("music"),
      v.literal("original"),
      v.literal("effects"),
      v.literal("voice")
    ),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    duration: v.number(), // in seconds
    audioUrl: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    waveform: v.optional(v.array(v.number())), // normalized 0..1 peak points
    visibility: v.union(v.literal("public"), v.literal("private")),
    isOfficial: v.optional(v.boolean()),
    usageCount: v.number(),
    favoritesCount: v.number(),
    license: v.optional(v.string()),
    moderationStatus: v.optional(
      v.union(v.literal("safe"), v.literal("flagged"), v.literal("removed"))
    ),
    isDeleted: v.optional(v.boolean()), // Soft-deletion preserves existing videos
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_category", ["category"])
    .index("by_usage", ["usageCount"])
    .index("by_created", ["createdAt"])
    .index("by_visibility", ["visibility"])
    .searchIndex("search_sound", {
      searchField: "title",
      filterFields: ["category", "visibility"],
    }),

  soundFavourites: defineTable({
    userId: v.id("users"),
    soundId: v.id("sounds"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_sound", ["soundId"])
    .index("by_user_sound", ["userId", "soundId"]),

  // ──── PLUM DATING PLATFORM TABLES ────
  plumProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    age: v.number(), // Publicly rendered age (e.g. 24)
    gender: v.string(), // "man" | "woman" | "nonbinary" | "queer_man" | "queer_woman" | etc.
    datingPreferences: v.array(v.string()), // genders user is interested in meeting
    bio: v.string(),
    interests: v.array(v.string()),
    datingIntentions: v.string(), // "long-term" | "dating" | "casual" | "friends" | "open"
    datingGoal: v.optional(v.union(
      v.literal("long_term"),
      v.literal("marriage"),
      v.literal("casual"),
      v.literal("short_term"),
      v.literal("friendship_first"),
      v.literal("open")
    )),
    additionalDatingInfo: v.optional(v.string()),
    
    // Broad location display (safe label)
    broadLocation: v.string(), // e.g. "Warri, Delta State"
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    // Photos
    mainPhoto: v.optional(v.string()), // Main dating profile photo
    publicPhotos: v.array(v.string()), // URLs of public photos
    privatePhotos: v.array(v.string()), // URLs of private photos (access controlled)

    // Visibility & Privacy controls
    isAgeConfirmed: v.boolean(),
    ageConfirmedAt: v.number(),
    showOnMap: v.boolean(),
    profileVisibility: v.union(v.literal("active"), v.literal("hidden"), v.literal("deactivated")),

    flashesReceivedCount: v.optional(v.number()),
    giftsReceivedCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_visibility", ["profileVisibility"])
    .index("by_gender", ["gender"])
    .index("by_updated", ["updatedAt"]),

  plumPrivatePhotoAccess: defineTable({
    ownerId: v.id("users"), // Profile owner granting access
    viewerId: v.id("users"), // Target member granted access
    grantedAt: v.number(),
    status: v.union(v.literal("granted"), v.literal("revoked")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_viewer", ["viewerId"])
    .index("by_owner_viewer", ["ownerId", "viewerId"]),

  plumFlashes: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"]),

  plumGifts: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    giftId: v.string(), // e.g. "rose", "champagne", "diamond", "teddy"
    giftName: v.string(),
    giftIcon: v.string(),
    amountLC: v.number(), // Amount in LaLao Credits (wallet balance)
    message: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"]),

  plumReports: defineTable({
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported", ["reportedUserId"]),

  plumFavorites: defineTable({
    userId: v.id("users"), // Member who saved/pinned the profile
    targetUserId: v.id("users"), // Target member saved
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_target", ["targetUserId"])
    .index("by_user_target", ["userId", "targetUserId"]),

  plumInterests: defineTable({
    senderId: v.id("users"), // Member who expressed interest (heart)
    receiverId: v.id("users"), // Target member
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"]),

  userTopicPreferences: defineTable({
    userId: v.id("users"),
    topicSlug: v.string(),
    preference: v.union(
      v.literal("interested"), // Boost recommendations
      v.literal("reduced"),    // See less often
      v.literal("excluded")    // Exclude completely from recommendations
    ),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_topic", ["userId", "topicSlug"])
    .index("by_user_preference", ["userId", "preference"]),

  // Discovery Page Preferences (e.g., "I'm not interested" / hidden pages)
  userPagePreferences: defineTable({
    userId: v.id("users"),
    pageSlugOrId: v.string(), // e.g. "plum" or specific pageId
    hiddenFromRecommendations: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_page", ["userId", "pageSlugOrId"]),

  // Recent Searches for users
  recentSearches: defineTable({
    userId: v.id("users"),
    query: v.string(),
    type: v.union(
      v.literal("keyword"),
      v.literal("person"),
      v.literal("page"),
      v.literal("shop"),
      v.literal("content"),
      v.literal("event")
    ),
    entityId: v.optional(v.string()), // Target user ID, page ID, etc.
    title: v.optional(v.string()), // Display title (e.g. user name or page title)
    subtitle: v.optional(v.string()), // Display subtitle (e.g. @username or category)
    avatarUrl: v.optional(v.string()), // Display avatar for people / pages
    isVerified: v.optional(v.boolean()),
    verificationTier: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "timestamp"])
    .index("by_user_query", ["userId", "query"]),

  // ==========================================
  // LALAO ADS — PRODUCTION ADVERTISING DOMAIN
  // ==========================================

  // Advertising campaigns created by users or businesses
  adCampaigns: defineTable({
    userId: v.id("users"),
    pageId: v.optional(v.id("pages")), // Optional business or advertiser page profile
    name: v.string(),
    objective: v.union(
      v.literal("reach"),
      v.literal("website_visits"),
      v.literal("engagement"),
      v.literal("local_discovery")
    ),
    format: v.union(
      v.literal("sponsored_post"),
      v.literal("promoted_post"),
      v.literal("image_ad"),
      v.literal("video_ad")
    ),
    // Lifecycle states
    status: v.union(
      v.literal("draft"),
      v.literal("pending_payment"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("payment_failed")
    ),
    moderationStatus: v.union(
      v.literal("unreviewed"),
      v.literal("auto_flagged"),
      v.literal("pending_admin"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    moderationReason: v.optional(v.string()),
    reviewNote: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),

    // Format B: Existing post reference
    promotedPostId: v.optional(v.id("posts")),

    // Creative Content (Formats A, C, D and overrides)
    creative: v.object({
      headline: v.string(),
      description: v.optional(v.string()),
      mediaUrl: v.optional(v.string()),
      mediaStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
      ctaLabel: v.union(
        v.literal("Learn More"),
        v.literal("Sign Up"),
        v.literal("Shop Now"),
        v.literal("Contact Us"),
        v.literal("Visit Profile"),
        v.literal("Order Now"),
        v.literal("Book Now"),
        v.literal("View Post")
      ),
      destinationUrl: v.string(), // Must be valid https:// URL or internal lalao route
    }),

    // Audience targeting
    targeting: v.object({
      targetType: v.union(v.literal("local_radius"), v.literal("city_state"), v.literal("broad_nation")),
      locationName: v.optional(v.string()),
      subArea: v.optional(v.string()),
      radiusKm: v.optional(v.number()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      stateOrRegion: v.optional(v.string()),
      country: v.string(), // e.g. "Nigeria"
    }),

    // Budget & Pricing (Smallest currency unit: kobo for NGN)
    budget: v.object({
      currency: v.string(), // e.g. "NGN"
      totalBudgetKobo: v.number(), // Integer kobo, e.g. 500000 = 5,000 NGN
      dailyLimitKobo: v.optional(v.number()),
      spentKobo: v.number(), // Authoritative spend ledger total
    }),

    // Schedule
    schedule: v.object({
      startDate: v.number(), // Timestamp ms
      endDate: v.number(),   // Timestamp ms
    }),

    // High-level aggregates cached for fast dashboard rendering
    impressionsCount: v.number(),
    clicksCount: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_moderation", ["moderationStatus"])
    .index("by_status_moderation", ["status", "moderationStatus"])
    .index("by_promoted_post", ["promotedPostId"]),

  // Campaign Payments (Paystack transactions)
  adPayments: defineTable({
    campaignId: v.id("adCampaigns"),
    userId: v.id("users"),
    amountKobo: v.number(), // Integer kobo
    currency: v.string(), // e.g. "NGN"
    reference: v.string(), // Unique Paystack transaction reference
    status: v.union(
      v.literal("pending"),
      v.literal("successful"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paystackAccessCode: v.optional(v.string()),
    paystackTransactionId: v.optional(v.string()),
    bachsCheckoutId: v.optional(v.string()),
    paymentProvider: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    gatewayResponse: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reference", ["reference"])
    .index("by_campaign", ["campaignId"])
    .index("by_user", ["userId"]),

  bachsWebhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
  }).index("by_event_id", ["eventId"]),

  // Deduplicated Ad Events (Impressions & Clicks for fraud prevention & analytics)
  adEvents: defineTable({
    campaignId: v.id("adCampaigns"),
    eventType: v.union(v.literal("impression"), v.literal("click")),
    viewerUserId: v.optional(v.id("users")), // When authenticated
    viewerSessionId: v.string(), // Deduplication key (userId or device/session fingerprint)
    chargeKobo: v.number(), // Amount debited for this event (0 for prepaid impression, or per-cost model)
    timestamp: v.number(),
    dateBucket: v.string(), // YYYY-MM-DD for fast timeseries aggregation
    locationName: v.optional(v.string()),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_date", ["campaignId", "dateBucket"])
    .index("by_campaign_dedup", ["campaignId", "eventType", "viewerSessionId", "dateBucket"]),

  // Moderation Audit Trail
  adModerationLogs: defineTable({
    campaignId: v.id("adCampaigns"),
    reviewerId: v.id("users"),
    action: v.union(
      v.literal("auto_flag"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended"),
      v.literal("resumed")
    ),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_campaign", ["campaignId"]),

  // ==========================================
  // LA LAO REWARD POINTS SYSTEM
  // ==========================================

  userRewardBalances: defineTable({
    userId: v.id("users"),
    availablePoints: v.number(),
    pendingPoints: v.number(),
    lifetimePoints: v.number(),
    totalEarned: v.number(),
    totalRedeemed: v.number(),
    lastUpdatedAt: v.number(),
  }).index("by_user", ["userId"]),

  rewardTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("earn_purchase"),
      v.literal("earn_referral"),
      v.literal("earn_bonus"),
      v.literal("redeem_reward"),
      v.literal("reverse_purchase"),
      v.literal("adjustment")
    ),
    description: v.string(),
    amount: v.number(),
    pointsBefore: v.number(),
    pointsAfter: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("reversed")
    ),
    relatedTransactionId: v.optional(v.id("walletTransactions")),
    relatedRedemptionId: v.optional(v.id("rewardRedemptions")),
    relatedReferralId: v.optional(v.id("referralRelationships")),
    idempotencyKey: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
   .index("by_user_created", ["userId", "createdAt"])
   .index("by_type", ["type"])
   .index("by_idempotency", ["idempotencyKey"]),

  rewardCatalogue: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("gift_card"),
      v.literal("airtime"),
      v.literal("data_bundle"),
      v.literal("voucher"),
      v.literal("partner_offer"),
      v.literal("other")
    ),
    imageUrl: v.optional(v.string()),
    pointsCost: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("archived")
    ),
    stockLimit: v.optional(v.number()),
    stockRemaining: v.optional(v.number()),
    availabilityStart: v.optional(v.number()),
    availabilityEnd: v.optional(v.number()),
    eligibilityRequirements: v.optional(v.any()),
    fulfillmentInstructions: v.optional(v.string()),
    providerIntegration: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_type", ["type"])
   .index("by_status", ["status"]),

  rewardRedemptions: defineTable({
    userId: v.id("users"),
    rewardId: v.id("rewardCatalogue"),
    rewardName: v.string(),
    rewardType: v.string(),
    pointsCost: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("fulfilled"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    rejectionReason: v.optional(v.string()),
    fulfillmentReference: v.optional(v.string()),
    fulfilledAt: v.optional(v.number()),
    fulfilledBy: v.optional(v.id("users")),
    idempotencyKey: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
   .index("by_user_created", ["userId", "createdAt"])
   .index("by_status", ["status"])
   .index("by_reward", ["rewardId"])
   .index("by_idempotency", ["idempotencyKey"]),

  referralCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    isActive: v.boolean(),
    totalReferrals: v.number(),
    qualifiedReferrals: v.number(),
    totalPointsEarned: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
   .index("by_code", ["code"]),

  referralRelationships: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    referralCode: v.string(),
    status: v.union(
      v.literal("invited"),
      v.literal("registered"),
      v.literal("qualified"),
      v.literal("rewarded")
    ),
    qualificationRequirement: v.string(),
    qualificationCompletedAt: v.optional(v.number()),
    rewardAwardedAt: v.optional(v.number()),
    rewardPoints: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_referrer", ["referrerId"])
   .index("by_referred", ["referredUserId"])
   .index("by_code", ["referralCode"])
   .index("by_status", ["status"]),

  rewardConfiguration: defineTable({
    key: v.string(),
    value: v.string(),
    description: v.string(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  rewardAdminAudit: defineTable({
    actorId: v.id("users"),
    action: v.string(),
    target: v.optional(v.string()),
    before: v.optional(v.string()),
    after: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_actor", ["actorId"])
   .index("by_created", ["createdAt"]),
});


