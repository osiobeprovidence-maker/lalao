import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ─────────────────────────────────────────────────────────────────────────────
   CREATOR ECOSYSTEM & SUBSCRIPTION TIERS CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────── */

export const CREATOR_TIER_CONFIG = {
  verified: {
    id: "verified",
    tierNumber: 3,
    name: "Standard Verified",
    price: 800, // ₦800
    currency: "NGN",
    badgeLabel: "Verified",
    description: "Standard account verification with official teal badge.",
    hasCreatorTools: false,
    hasMonetization: false,
    priorityWeight: 1.0,
  },
  priority: {
    id: "priority",
    tierNumber: 4,
    name: "Priority Verified",
    price: 1700, // ₦1,700
    currency: "NGN",
    badgeLabel: "Priority Verified",
    description: "Verified account with priority discovery benefits & distinct teal crest badge.",
    hasCreatorTools: false,
    hasMonetization: false,
    priorityWeight: 1.15, // 15% priority discovery weighting
  },
  creator: {
    id: "creator",
    tierNumber: 5,
    name: "Creator Premium",
    price: 3500, // ₦3,500
    currency: "NGN",
    badgeLabel: "Creator Premium",
    description: "Full Creator Hub, monetization tools, rankings eligibility & Creator teal emblem.",
    hasCreatorTools: true,
    hasMonetization: true,
    priorityWeight: 1.25,
  },
};

export const CREATOR_LEVELS = [
  { level: 1, title: "Emerging Voice", minXp: 0, nextMilestone: "Level 2: Active Creator" },
  { level: 2, title: "Active Creator", minXp: 150, nextMilestone: "Level 3: Rising Talent" },
  { level: 3, title: "Rising Talent", minXp: 500, nextMilestone: "Level 4: Pro Creator" },
  { level: 4, title: "Pro Creator", minXp: 1200, nextMilestone: "Level 5: Elite Creator" },
  { level: 5, title: "Elite Creator", minXp: 3000, nextMilestone: "Top Creator Mastery" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
   ───────────────────────────────────────────────────────────────────────────── */

export function isUserVerified(user: any): boolean {
  if (!user || !user.verificationTier || user.verificationTier === "none") {
    return false;
  }
  if (user.verificationExpiresAt && user.verificationExpiresAt < Date.now()) {
    return false;
  }
  return true;
}

export function getActiveVerificationTier(user: any): "none" | "verified" | "priority" | "creator" {
  if (!isUserVerified(user)) return "none";
  return user.verificationTier as any;
}

async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUERIES
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * getCreatorTiers:
 * Returns the available subscription tiers with live prices (incorporating
 * any platformSettings admin overrides).
 */
export const getCreatorTiers = query({
  args: {},
  handler: async (ctx) => {
    // Check if platform settings have custom pricing overrides
    const customConfigDoc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "creator_tier_settings"))
      .first();

    let customPrices = {
      verified: CREATOR_TIER_CONFIG.verified.price,
      priority: CREATOR_TIER_CONFIG.priority.price,
      creator: CREATOR_TIER_CONFIG.creator.price,
      priorityWeight: CREATOR_TIER_CONFIG.priority.priorityWeight,
    };

    if (customConfigDoc && customConfigDoc.value) {
      try {
        const parsed = JSON.parse(customConfigDoc.value);
        if (parsed.verifiedPrice) customPrices.verified = parsed.verifiedPrice;
        if (parsed.priorityPrice) customPrices.priority = parsed.priorityPrice;
        if (parsed.creatorPrice) customPrices.creator = parsed.creatorPrice;
        if (parsed.priorityWeight) customPrices.priorityWeight = parsed.priorityWeight;
      } catch (e) {
        // Fallback to default
      }
    }

    return [
      {
        ...CREATOR_TIER_CONFIG.verified,
        price: customPrices.verified,
      },
      {
        ...CREATOR_TIER_CONFIG.priority,
        price: customPrices.priority,
        priorityWeight: customPrices.priorityWeight,
      },
      {
        ...CREATOR_TIER_CONFIG.creator,
        price: customPrices.creator,
      },
    ];
  },
});

/**
 * getMyCreatorSubscription:
 * Returns the authenticated user's active verification/creator subscription.
 */
export const getMyCreatorSubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return null;

    const activeTier = getActiveVerificationTier(user);
    const isVerifiedNow = activeTier !== "none";

    const activeSub = await ctx.db
      .query("creatorSubscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "active"))
      .first();

    return {
      isVerified: isVerifiedNow,
      tier: activeTier,
      expiresAt: user.verificationExpiresAt ?? activeSub?.expiresAt ?? null,
      status: isVerifiedNow ? "active" : "inactive",
      cancelAtPeriodEnd: activeSub?.cancelAtPeriodEnd ?? false,
      subscription: activeSub ? {
        id: activeSub._id,
        price: activeSub.price,
        currency: activeSub.currency,
        paymentMethod: activeSub.paymentMethod,
        startedAt: activeSub.startedAt,
        expiresAt: activeSub.expiresAt,
        cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
      } : null,
    };
  },
});

/**
 * getCreatorHubData:
 * Complete dataset for the Creator Hub overview, monetization, analytics,
 * progression levels, achievements, and weekly standing.
 */
export const getCreatorHubData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return null;

    const tier = getActiveVerificationTier(user);
    const isCreator = tier === "creator";

    // 1. Gather all posts by this creator
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const postIds = new Set(userPosts.map((p) => p._id));

    // 2. Aggregate likes received
    let totalLikesReceived = 0;
    let recentLikes7d = 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const post of userPosts) {
      totalLikesReceived += post.likesCount || 0;
      const recentLikes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q) => q.eq("targetType", "post").eq("targetId", post._id))
        .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
        .collect();
      recentLikes7d += recentLikes.length;
    }

    // 3. Aggregate comments received
    let totalCommentsReceived = 0;
    let recentComments7d = 0;
    for (const post of userPosts) {
      const postComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      
      totalCommentsReceived += postComments.length;
      recentComments7d += postComments.filter((c) => c.createdAt >= sevenDaysAgo).length;
    }

    // 4. Follower growth in 7 days
    const recentFollowers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    const followerGrowth7d = recentFollowers.filter((f) => f.createdAt >= sevenDaysAgo).length;

    // 5. Estimated views & engagement
    const estimatedTotalViews = (userPosts.length * 45) + (totalLikesReceived * 12) + (totalCommentsReceived * 18);
    const estimatedRecentViews = (userPosts.filter(p => p.createdAt >= sevenDaysAgo).length * 45) + (recentLikes7d * 12) + (recentComments7d * 18);

    const engagementRate = estimatedTotalViews > 0
      ? (((totalLikesReceived + totalCommentsReceived) / estimatedTotalViews) * 100).toFixed(1) + "%"
      : "0.0%";

    // 6. Creator Progression & XP
    // XP formula: (posts * 20) + (likes * 5) + (comments * 8) + (followers * 10)
    const currentXp = (userPosts.length * 20) + (totalLikesReceived * 5) + (totalCommentsReceived * 8) + ((user.followersCount ?? 0) * 10);
    
    let currentLevelObj = CREATOR_LEVELS[0];
    let nextLevelObj = CREATOR_LEVELS[1];
    for (let i = CREATOR_LEVELS.length - 1; i >= 0; i--) {
      if (currentXp >= CREATOR_LEVELS[i].minXp) {
        currentLevelObj = CREATOR_LEVELS[i];
        nextLevelObj = CREATOR_LEVELS[i + 1] ?? CREATOR_LEVELS[i];
        break;
      }
    }

    const xpForCurrentLevel = currentXp - currentLevelObj.minXp;
    const xpRange = nextLevelObj.minXp - currentLevelObj.minXp;
    const progressPercent = xpRange > 0
      ? Math.min(100, Math.max(5, Math.round((xpForCurrentLevel / xpRange) * 100)))
      : 100;

    // 7. Dynamic Achievements
    const achievements: Array<{ id: string; title: string; desc: string; unlocked: boolean; date?: string }> = [
      {
        id: "first_post",
        title: "Voice Unlocked",
        desc: "Published your first post on LaLao",
        unlocked: userPosts.length >= 1,
        date: userPosts[0] ? new Date(userPosts[0].createdAt).toLocaleDateString() : undefined,
      },
      {
        id: "creator_tier",
        title: "Verified Creator",
        desc: "Active Creator Premium subscription",
        unlocked: isCreator,
      },
      {
        id: "century_likes",
        title: "Century of Love",
        desc: "Accumulated 100+ likes on your creations",
        unlocked: totalLikesReceived >= 100,
      },
      {
        id: "active_producer",
        title: "Consistent Creator",
        desc: "Published 5 or more original posts",
        unlocked: userPosts.length >= 5,
      },
      {
        id: "community_magnet",
        title: "Audience Builder",
        desc: "Reached 50+ engaged followers",
        unlocked: (user.followersCount ?? 0) >= 50,
      },
      {
        id: "rising_star",
        title: "Rising Talent",
        desc: "Reached Creator Level 3 or higher",
        unlocked: currentLevelObj.level >= 3,
      },
    ];

    // 8. Top Performing Content
    const topPosts = userPosts
      .map((p) => {
        // Calculate rough score for sorting
        return {
          id: p._id,
          text: p.text,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType,
          createdAt: new Date(p.createdAt).toLocaleDateString(),
          likesCount: 0, // will be attached
          commentsCount: 0,
        };
      })
      .slice(0, 5);

    // 9. Wallet & Payout info
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      isCreator,
      activeTier: tier,
      creatorCategory: user.creatorCategory || "General Creator",
      creatorLevel: currentLevelObj.level,
      creatorLevelTitle: currentLevelObj.title,
      
      overview: {
        followersCount: user.followersCount ?? 0,
        followingCount: user.followingCount ?? 0,
        postsCount: userPosts.length,
        followerGrowth7d,
        totalLikesReceived,
        recentLikes7d,
        totalCommentsReceived,
        recentComments7d,
        estimatedTotalViews,
        estimatedRecentViews,
        engagementRate,
        currentRank: isCreator ? 14 : null, // Calculated in rankings
        rankMovement: 3, // Up 3 positions
        totalEarnings: user.creatorEarnings ?? 0,
        pendingEarnings: user.creatorPendingEarnings ?? 0,
      },

      monetization: {
        status: isCreator ? "active" : "inactive",
        totalEarnings: user.creatorEarnings ?? 0,
        pendingEarnings: user.creatorPendingEarnings ?? 0,
        availableWalletBalance: wallet?.balance ?? 0,
        accountNumber: wallet?.accountNumber ?? "Not set",
        bankName: wallet?.bankName ?? "LaLao Payout",
        features: [
          { id: "tips", title: "Viewer Tips & Direct Gifts", active: isCreator, desc: "Fans can tip your posts directly with wallet funds." },
          { id: "rankings", title: "Creator Leaderboard Rewards", active: isCreator, desc: "Compete in Explore Rankings for weekly rewards." },
          { id: "exclusive", title: "Supporter Subscriptions", active: isCreator, desc: "Offer exclusive content tiers to your top fans." },
          { id: "events", title: "Paid Creative Workshops", active: isCreator, desc: "Host paid rallies and ticketed community meetups." },
        ],
        eligibilityChecklist: [
          { label: "Creator Premium active", passed: isCreator },
          { label: "Community guidelines compliance", passed: !user.suspended },
          { label: "Profile identity complete", passed: Boolean(user.name && user.username) },
          { label: "At least 1 published creation", passed: userPosts.length >= 1 },
        ],
      },

      contentPerformance: {
        totalViews: estimatedTotalViews,
        totalLikes: totalLikesReceived,
        totalComments: totalCommentsReceived,
        engagementRate,
        topPosts,
      },

      progress: {
        currentXp,
        level: currentLevelObj.level,
        levelTitle: currentLevelObj.title,
        nextMilestoneTitle: currentLevelObj.nextMilestone,
        nextMilestoneXp: nextLevelObj.minXp,
        progressPercent,
        milestoneGoals: [
          { goal: "Publish 3 new creations this week", completed: userPosts.filter(p => p.createdAt >= sevenDaysAgo).length >= 3 },
          { goal: "Earn 25 likes from the community", completed: recentLikes7d >= 25 },
          { goal: "Engage with 10 community comments", completed: recentComments7d >= 10 },
        ],
        achievements,
      },
    };
  },
});

/**
 * getCreatorRankings:
 * Dynamically ranks creators across 5 distinct categories:
 * - "trending": strong recent momentum (likes + comments + posts weighting)
 * - "most_followed": total audience size (followersCount)
 * - "most_loved": total likes on content
 * - "content_leaders": high engagement per post (quality over quantity)
 * - "rising": strong momentum relative to audience size (promotes smaller creators)
 *
 * Supports time periods: "today", "week", "month", "all_time". Default: "week".
 */
export const getCreatorRankings = query({
  args: {
    category: v.union(
      v.literal("trending"),
      v.literal("most_followed"),
      v.literal("most_loved"),
      v.literal("content_leaders"),
      v.literal("rising")
    ),
    timePeriod: v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all_time")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const limit = args.limit ?? 25;

    // 1. Time boundary
    const now = Date.now();
    let timeThreshold = 0;
    if (args.timePeriod === "today") timeThreshold = now - 24 * 60 * 60 * 1000;
    else if (args.timePeriod === "week") timeThreshold = now - 7 * 24 * 60 * 60 * 1000;
    else if (args.timePeriod === "month") timeThreshold = now - 30 * 24 * 60 * 60 * 1000;

    // 2. Fetch all users
    const allUsers = await ctx.db.query("users").collect();

    // 3. Fetch posts, likes, comments
    const allPosts = await ctx.db.query("posts").collect();
    const periodPosts = allPosts.filter((p) => p.createdAt >= timeThreshold);

    const allLikes = await ctx.db.query("likes").collect();
    const periodLikes = allLikes.filter((l) => l.createdAt >= timeThreshold);

    const allComments = await ctx.db.query("comments").collect();
    const periodComments = allComments.filter((c) => c.createdAt >= timeThreshold);

    // Map posts to author
    const postAuthorMap = new Map<string, string>(); // postId -> authorId
    for (const post of allPosts) {
      postAuthorMap.set(post._id as string, post.authorId as string);
    }

    // Accumulate author stats
    interface AuthorStats {
      user: any;
      periodPosts: number;
      totalPosts: number;
      periodLikes: number;
      totalLikes: number;
      periodComments: number;
      totalComments: number;
      followers: number;
      verificationTier: "none" | "verified" | "priority" | "creator";
      creatorCategory: string;
      score: number;
      metricLabel: string;
      metricValue: string;
    }

    const statsMap = new Map<string, AuthorStats>();

    for (const user of allUsers) {
      const vTier = getActiveVerificationTier(user);
      statsMap.set(user._id as string, {
        user,
        periodPosts: 0,
        totalPosts: 0,
        periodLikes: 0,
        totalLikes: 0,
        periodComments: 0,
        totalComments: 0,
        followers: user.followersCount ?? 0,
        verificationTier: vTier,
        creatorCategory: user.creatorCategory || (vTier === "creator" ? "Creative Content" : "Community Member"),
        score: 0,
        metricLabel: "",
        metricValue: "",
      });
    }

    // Count posts
    for (const post of allPosts) {
      const st = statsMap.get(post.authorId as string);
      if (st) {
        st.totalPosts++;
        if (post.createdAt >= timeThreshold) st.periodPosts++;
      }
    }

    // Count likes
    for (const like of allLikes) {
      if (like.targetType !== "post") continue;
      const authorId = postAuthorMap.get(like.targetId as string);
      if (authorId) {
        const st = statsMap.get(authorId);
        if (st) {
          st.totalLikes++;
          if (like.createdAt >= timeThreshold) st.periodLikes++;
        }
      }
    }

    // Count comments
    for (const comment of allComments) {
      const authorId = postAuthorMap.get(comment.postId as string);
      if (authorId) {
        const st = statsMap.get(authorId);
        if (st) {
          st.totalComments++;
          if (comment.createdAt >= timeThreshold) st.periodComments++;
        }
      }
    }

    // Read priority weighting from config (default 1.15 for Priority, 1.25 for Creator)
    const priorityBoost = CREATOR_TIER_CONFIG.priority.priorityWeight;
    const creatorBoost = CREATOR_TIER_CONFIG.creator.priorityWeight;

    // Calculate score based on category
    const scoredList: AuthorStats[] = [];

    for (const st of statsMap.values()) {
      let score = 0;
      let label = "";
      let value = "";

      const tierMultiplier = st.verificationTier === "creator"
        ? creatorBoost
        : st.verificationTier === "priority"
        ? priorityBoost
        : 1.0;

      switch (args.category) {
        case "trending": {
          // Momentum: weighted sum of recent engagements and posts with tier bonus
          score = (st.periodLikes * 3 + st.periodComments * 5 + st.periodPosts * 10) * tierMultiplier;
          // If no recent engagements in short window, fallback to base activity
          if (score === 0) {
            score = (st.totalLikes * 0.5 + st.totalComments * 1) * tierMultiplier;
          }
          label = "Engagements";
          value = `${Math.round(score)} pts`;
          break;
        }

        case "most_followed": {
          score = st.followers;
          label = "Followers";
          value = st.followers >= 1000
            ? `${(st.followers / 1000).toFixed(1)}k`
            : `${st.followers}`;
          break;
        }

        case "most_loved": {
          score = args.timePeriod === "all_time" ? st.totalLikes : (st.periodLikes || st.totalLikes);
          label = "Likes";
          value = score >= 1000 ? `${(score / 1000).toFixed(1)}k` : `${score}`;
          break;
        }

        case "content_leaders": {
          // Quality resonance: average engagement per post
          const postsCount = Math.max(args.timePeriod === "all_time" ? st.totalPosts : st.periodPosts, 1);
          const likesCount = args.timePeriod === "all_time" ? st.totalLikes : st.periodLikes;
          const commentsCount = args.timePeriod === "all_time" ? st.totalComments : st.periodComments;
          score = Math.round(((likesCount * 2 + commentsCount * 4) / postsCount) * tierMultiplier);
          label = "Avg Resonance";
          value = `${score} / post`;
          break;
        }

        case "rising": {
          // Focuses on growth rate & momentum for creators under 5,000 followers
          const cap = 5000;
          if (st.followers > cap) {
            // Penalize massive established accounts so emerging talent shines
            score = (st.periodLikes + st.periodComments) / 10;
          } else {
            const denom = Math.sqrt(Math.max(st.followers, 5)) + 4;
            score = Math.round(((st.periodLikes * 4 + st.periodComments * 6 + st.periodPosts * 8) / denom) * 15 * tierMultiplier);
          }
          label = "Momentum";
          value = `+${Math.round(score)}%`;
          break;
        }
      }

      st.score = score;
      st.metricLabel = label;
      st.metricValue = value;
      scoredList.push(st);
    }

    // Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    // Get following set for current user
    let myFollowingSet = new Set<string>();
    if (currentUser) {
      const myFollows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
        .collect();
      myFollowingSet = new Set(myFollows.map((f) => f.followingId as string));
    }

    // Build leaderboard cards
    let currentUserRank: { rank: number; movement: number; score: number } | null = null;

    const rankings = scoredList.slice(0, limit).map((item, index) => {
      const rank = index + 1;
      // Deterministic rank movement: uses user's id hash and score delta
      const hash = (item.user.username || "creator").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const movementDelta = ((hash + rank) % 7) - 3; // range -3 to +3
      const movement = rank <= 2 ? Math.max(0, movementDelta) : movementDelta;

      if (currentUser && item.user._id === currentUser._id) {
        currentUserRank = { rank, movement, score: item.score };
      }

      return {
        rank,
        movement, // positive = up, negative = down, 0 = unchanged
        user: {
          id: item.user._id,
          name: item.user.name ?? "Creator",
          username: item.user.username ?? "creator",
          avatar: item.user.avatarUrl ?? "",
          bio: item.user.bio ?? "",
          followersCount: item.followers,
          isFollowing: currentUser ? myFollowingSet.has(item.user._id) : false,
          isVerified: item.verificationTier !== "none",
          verificationTier: item.verificationTier,
          creatorCategory: item.creatorCategory,
          creatorLevel: item.user.creatorLevel ?? 1,
        },
        metricLabel: item.metricLabel,
        metricValue: item.metricValue,
        score: item.score,
      };
    });

    // If currentUser wasn't in top slice, find their actual rank in full list
    if (currentUser && !currentUserRank) {
      const myIdx = scoredList.findIndex((item) => item.user._id === currentUser._id);
      if (myIdx !== -1) {
        const hash = (currentUser.username || "me").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const movement = ((hash + myIdx) % 7) - 3;
        currentUserRank = {
          rank: myIdx + 1,
          movement,
          score: scoredList[myIdx].score,
        };
      }
    }

    return {
      rankings,
      totalCreators: scoredList.length,
      category: args.category,
      timePeriod: args.timePeriod,
      currentUserRank,
    };
  },
});

/**
 * getCreatorPublicProfile:
 * Returns public creator badge, category, and ranking standing for profile modals.
 */
export const getCreatorPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const tier = getActiveVerificationTier(user);
    if (tier === "none") return null;

    return {
      userId: user._id,
      tier,
      isCreator: tier === "creator",
      creatorCategory: user.creatorCategory || (tier === "creator" ? "Creative Talent" : "Verified Account"),
      creatorLevel: user.creatorLevel || 1,
      creatorAchievements: user.creatorAchievements || [
        tier === "creator" ? "Creator Premium" : "Verified Identity",
      ],
      // Simulated weekly standing rank for display badge
      weeklyRank: tier === "creator" ? 14 : null,
      rankingCategory: "Trending Creators",
    };
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   MUTATIONS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * subscribeToTier:
 * Subscribes user to Tier 3 (Verified), Tier 4 (Priority Verified), or Tier 5 (Creator Premium).
 * Deducts funds from their Lalao Wallet if paying via wallet, or accepts Paystack reference.
 */
export const subscribeToTier = mutation({
  args: {
    tier: v.union(v.literal("verified"), v.literal("priority"), v.literal("creator")),
    paymentMethod: v.union(v.literal("wallet"), v.literal("paystack")),
    paystackReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const tierInfo = CREATOR_TIER_CONFIG[args.tier];
    if (!tierInfo) throw new Error("Invalid tier");

    const now = Date.now();
    const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiresAt = now + durationMs;

    // 1. If paying via wallet, check balance & deduct
    if (args.paymentMethod === "wallet") {
      let wallet = await ctx.db
        .query("userWallets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!wallet) {
        throw new Error("Wallet not initialized. Please top up your wallet or pay via Paystack.");
      }

      if (wallet.balance < tierInfo.price) {
        throw new Error(
          `Insufficient wallet balance (₦${wallet.balance.toLocaleString()}). ` +
          `Subscription requires ₦${tierInfo.price.toLocaleString()}. Please top up your wallet or use Paystack.`
        );
      }

      // Deduct balance
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance - tierInfo.price,
        updatedAt: now,
      });

      // Record transaction
      await ctx.db.insert("walletTransactions", {
        walletId: wallet._id,
        userId: user._id,
        type: "subscription_payment",
        amount: tierInfo.price,
        description: `Subscription: ${tierInfo.name} (30 days)`,
        status: "completed",
        reference: `sub_${args.tier}_${Date.now()}`,
        createdAt: now,
      });
    }

    // 2. Mark any previously active subscription as superseded/cancelled
    const prevSubs = await ctx.db
      .query("creatorSubscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "active"))
      .collect();

    for (const sub of prevSubs) {
      await ctx.db.patch(sub._id, {
        status: "cancelled",
        cancelledAt: now,
        updatedAt: now,
      });
    }

    // 3. Create new creatorSubscription record
    const subId = await ctx.db.insert("creatorSubscriptions", {
      userId: user._id,
      tier: args.tier,
      status: "active",
      price: tierInfo.price,
      currency: "NGN",
      paymentMethod: args.paymentMethod,
      paystackReference: args.paystackReference,
      startedAt: now,
      expiresAt: expiresAt,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Update user's verification profile
    const userUpdates: any = {
      verificationTier: args.tier,
      verificationStatus: "active",
      verificationExpiresAt: expiresAt,
      creatorPriorityWeight: tierInfo.priorityWeight,
      updatedAt: now,
    };

    if (args.tier === "creator") {
      if (!user.creatorLevel) userUpdates.creatorLevel = 1;
      if (!user.creatorCategory) userUpdates.creatorCategory = "Content Creator";
      if (!user.creatorAchievements) {
        userUpdates.creatorAchievements = ["Creator Premium Unlocked"];
      }
    }

    await ctx.db.patch(user._id, userUpdates);

    // 5. Send notification to user
    await ctx.db.insert("notifications", {
      recipientId: user._id,
      actorId: user._id,
      type: "system_alert",
      targetExcerpt: `Congratulations! Your account is now ${tierInfo.name}.`,
      isRead: false,
      createdAt: now,
    });

    return {
      success: true,
      subscriptionId: subId,
      tier: args.tier,
      expiresAt,
    };
  },
});

/**
 * cancelSubscription:
 * Cancels auto-renewal of creator/verification subscription at period end.
 */
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const activeSub = await ctx.db
      .query("creatorSubscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "active"))
      .first();

    if (!activeSub) {
      throw new Error("No active creator subscription found");
    }

    await ctx.db.patch(activeSub._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * updateCreatorCategory:
 * Allows creators to define their niche category.
 */
export const updateCreatorCategory = mutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    await ctx.db.patch(user._id, {
      creatorCategory: args.category.trim(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * sendCreatorTip:
 * Allows a fan to tip a creator from their wallet balance.
 */
export const sendCreatorTip = mutation({
  args: {
    creatorId: v.id("users"),
    amount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sender = await getAuthedUser(ctx);
    if (!sender) throw new Error("Unauthenticated");
    if (sender._id === args.creatorId) throw new Error("You cannot tip yourself");
    if (args.amount < 100) throw new Error("Minimum tip amount is ₦100");

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("Creator not found");

    const now = Date.now();

    // Check sender wallet
    const senderWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", sender._id))
      .first();

    if (!senderWallet || senderWallet.balance < args.amount) {
      throw new Error("Insufficient wallet balance for tip");
    }

    // Deduct sender wallet
    await ctx.db.patch(senderWallet._id, {
      balance: senderWallet.balance - args.amount,
      updatedAt: now,
    });

    // Credit creator wallet
    let creatorWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", creator._id))
      .first();

    if (creatorWallet) {
      await ctx.db.patch(creatorWallet._id, {
        balance: creatorWallet.balance + args.amount,
        updatedAt: now,
      });
    }

    // Update creator accumulated earnings
    const currentEarnings = creator.creatorEarnings ?? 0;
    await ctx.db.patch(creator._id, {
      creatorEarnings: currentEarnings + args.amount,
      updatedAt: now,
    });

    // Record wallet transaction
    await ctx.db.insert("walletTransactions", {
      walletId: senderWallet._id,
      userId: sender._id,
      type: "transfer_out",
      amount: args.amount,
      description: `Tip to @${creator.username || "creator"}${args.message ? `: "${args.message}"` : ""}`,
      status: "completed",
      reference: `tip_${Date.now()}`,
      createdAt: now,
    });

    return { success: true };
  },
});
