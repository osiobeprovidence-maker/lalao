import { getUserByAuthIdentity } from "./lib/authIdentity";
import { requireAdmin } from "./admin";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { resolveUserVerification } from "./social";

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
    description: "Full Creator Hub, monetization, and rankings for every creator category, including approved Manga & Webtoon publishers.",
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
  // Delegates to the single shared source of truth for current subscription status.
  return resolveUserVerification(user).isVerified;
}

export function getActiveVerificationTier(user: any): "none" | "verified" | "priority" | "creator" {
  if (!isUserVerified(user)) return "none";
  return user.verificationTier as any;
}

async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await getUserByAuthIdentity(ctx, identity);
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
    const approvedApplications = user.creatorType
      ? await ctx.db.query("creatorApplications")
          .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "approved"))
          .collect()
      : [];
    const application = approvedApplications.find((item) => item.creatorType === user.creatorType) ?? null;
    const creatorApproved = Boolean(application && user.creatorAccountStatus !== "suspended" && user.creatorAccountStatus !== "closed" && !user.suspended);
    const monetizationEligible = isCreator && creatorApproved;

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
    const postsWithMetrics = await Promise.all(userPosts.map(async (p) => {
      const postComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", p._id))
        .collect();
      
      const likesCount = p.likesCount || 0;
      const commentsCount = postComments.length;
      const viewsCount = likesCount * 12 + commentsCount * 18 + 45;
      const score = likesCount * 2 + commentsCount * 3 + viewsCount;

      return {
        id: p._id,
        text: p.text,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        createdAt: new Date(p.createdAt).toLocaleDateString(),
        likesCount,
        commentsCount,
        viewsCount,
        score
      };
    }));

    postsWithMetrics.sort((a, b) => b.score - a.score);
    const topPosts = postsWithMetrics.slice(0, 5);

    // 9. Wallet & Payout info
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      isCreator,
      creatorApproved,
      monetizationEligible,
      creatorType: user.creatorType ?? null,
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
        currentRank: null,
        rankMovement: null,
        totalEarnings: monetizationEligible ? user.creatorEarnings ?? 0 : 0,
        pendingEarnings: monetizationEligible ? user.creatorPendingEarnings ?? 0 : 0,
      },

      monetization: {
        status: monetizationEligible ? "active" : "inactive",
        totalEarnings: monetizationEligible ? user.creatorEarnings ?? 0 : 0,
        pendingEarnings: monetizationEligible ? user.creatorPendingEarnings ?? 0 : 0,
        availableWalletBalance: monetizationEligible ? wallet?.balance ?? 0 : 0,
        accountNumber: wallet?.accountNumber ?? "Not set",
        bankName: wallet?.bankName ?? "LaLao Payout",
        features: [
          { id: "tips", title: "Viewer Tips & Direct Gifts", active: monetizationEligible, desc: "Fans can tip your posts directly with wallet funds." },
          { id: "rankings", title: "Creator Leaderboard Rewards", active: monetizationEligible, desc: "Compete in Explore Rankings for weekly rewards." },
          { id: "exclusive", title: "Supporter Subscriptions", active: monetizationEligible, desc: "Offer exclusive content tiers to your top fans." },
          { id: "events", title: "Paid Creative Workshops", active: monetizationEligible, desc: "Host paid rallies and ticketed community meetups." },
        ],
        eligibilityChecklist: [
          { label: "Creator Premium active", passed: isCreator },
          { label: "Professional creator application approved", passed: creatorApproved },
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
      const hash = (item.user.username || "creator").split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
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
        const hash = (currentUser.username || "me").split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
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

/** Start an unactivated creator-tier purchase. Access is granted only by verified Bachs settlement. */
export const beginBachsTierPurchase = mutation({
  args: {
    tier: v.union(v.literal("verified"), v.literal("priority"), v.literal("creator")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");
    const tierInfo = CREATOR_TIER_CONFIG[args.tier];
    const settings = await ctx.db.query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "creator_tier_settings"))
      .first();
    let price = tierInfo.price;
    if (settings?.value) {
      try {
        const parsed = JSON.parse(settings.value);
        const configured = parsed[`${args.tier}Price`];
        if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) price = configured;
      } catch {
        // Keep the configured default when stored settings are malformed.
      }
    }
    const now = Date.now();
    const reference = `LALAO_CREATOR_${String(user._id)}_${args.tier}_${now}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const purchaseId = await ctx.db.insert("creatorSubscriptions", {
      userId: user._id,
      tier: args.tier,
      status: "pending",
      price,
      currency: "NGN",
      paymentMethod: "bachs",
      bachsReference: reference,
      startedAt: now,
      expiresAt: now + 15 * 60 * 1000,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
    return { purchaseId, reference, amount: price, currency: "NGN" };
  },
});

export const settleBachsTierPayment = internalMutation({
  args: { reference: v.string(), amount: v.number(), checkoutId: v.string() },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.query("creatorSubscriptions")
      .withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference)).first();
    if (!purchase) throw new Error("Creator subscription payment not found.");
    if (purchase.status === "active") return { success: true, alreadySettled: true, subscriptionId: purchase._id };
    if (purchase.status !== "pending" || purchase.expiresAt <= Date.now() || !purchase.bachsCheckoutId || purchase.bachsCheckoutId !== args.checkoutId || purchase.price !== args.amount || purchase.currency !== "NGN") {
      throw new Error("Verified Bachs payment does not match the pending creator subscription.");
    }
    const user = await ctx.db.get(purchase.userId);
    if (!user) throw new Error("Creator account not found.");
    const now = Date.now();
    const durationMs = 30 * 24 * 60 * 60 * 1000;
    for (const sub of await ctx.db.query("creatorSubscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", purchase.userId).eq("status", "active")).collect()) {
      await ctx.db.patch(sub._id, { status: "cancelled", cancelledAt: now, updatedAt: now });
    }
    await ctx.db.patch(purchase._id, {
      status: "active", bachsCheckoutId: args.checkoutId,
      startedAt: now, expiresAt: now + durationMs, billingStatus: "renewal_due_manually", updatedAt: now,
    });
    const tierInfo = CREATOR_TIER_CONFIG[purchase.tier];
    const updates: any = {
      verificationTier: purchase.tier, verificationStatus: "active", verificationExpiresAt: now + durationMs,
      creatorPriorityWeight: tierInfo.priorityWeight, updatedAt: now,
    };
    if (purchase.tier === "creator") {
      if (!user.creatorLevel) updates.creatorLevel = 1;
      if (!user.creatorCategory) updates.creatorCategory = "Content Creator";
      if (!user.creatorAchievements) updates.creatorAchievements = ["Creator Premium Unlocked"];
    }
    await ctx.db.patch(user._id, updates);
    await ctx.db.insert("notifications", {
      recipientId: user._id, actorId: user._id, type: "system_alert",
      targetExcerpt: `Congratulations! Your account is now ${tierInfo.name}.`, isRead: false, createdAt: now,
    });
    return { success: true, subscriptionId: purchase._id, tier: purchase.tier, expiresAt: now + durationMs };
  },
});

export const attachBachsTierCheckout = mutation({
  args: { reference: v.string(), checkoutId: v.string(), checkoutUrl: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");
    const purchase = await ctx.db.query("creatorSubscriptions")
      .withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference)).first();
    if (!purchase || purchase.userId !== user._id || purchase.status !== "pending" || purchase.expiresAt <= Date.now()) throw new Error("Pending checkout not found.");
    if (purchase.bachsCheckoutId && purchase.bachsCheckoutId !== args.checkoutId) throw new Error("A checkout is already attached to this purchase.");
    await ctx.db.patch(purchase._id, { bachsCheckoutId: args.checkoutId, bachsCheckoutUrl: args.checkoutUrl, updatedAt: Date.now() });
    return { success: true };
  },
});

export const getBachsCreatorPaymentOwner = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.query("creatorSubscriptions")
      .withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference)).first();
    if (!purchase) return null;
    const user = await ctx.db.get(purchase.userId);
    return user ? { userId: String(user._id), email: user.email || `${user.username || "user"}@lalao.app`, amount: purchase.price, currency: purchase.currency, checkoutId: purchase.bachsCheckoutId, status: purchase.status, expiresAt: purchase.expiresAt } : null;
  },
});

export const maintainCreatorSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysAhead = now + 3 * 24 * 60 * 60 * 1000;
    const subscriptions = await ctx.db.query("creatorSubscriptions").collect();
    let reminders = 0;
    let expired = 0;
    for (const sub of subscriptions) {
      if (sub.status !== "active") continue;
      const user = await ctx.db.get(sub.userId);
      if (!user) continue;
      if (sub.expiresAt <= now) {
        await ctx.db.patch(sub._id, { status: "expired", billingStatus: "expired", updatedAt: now });
        if (user.verificationExpiresAt === sub.expiresAt && user.verificationTier === sub.tier) {
          await ctx.db.patch(user._id, { verificationTier: "none", verificationStatus: "expired", verificationExpiresAt: undefined, creatorPriorityWeight: 1, updatedAt: now });
        }
        await ctx.db.insert("notifications", {
          recipientId: user._id, actorId: user._id, type: "system_alert",
          targetExcerpt: `Your ${CREATOR_TIER_CONFIG[sub.tier].name} plan expired. Renew with Batch checkout to restore access.`,
          isRead: false, createdAt: now,
        });
        expired += 1;
      } else if (sub.expiresAt < threeDaysAhead && sub.renewalReminderSentFor !== sub.expiresAt) {
        await ctx.db.patch(sub._id, { renewalReminderSentFor: sub.expiresAt, updatedAt: now });
        await ctx.db.insert("notifications", {
          recipientId: user._id, actorId: user._id, type: "system_alert",
          targetExcerpt: `Your ${CREATOR_TIER_CONFIG[sub.tier].name} plan ends on ${new Date(sub.expiresAt).toLocaleDateString()}. Renew manually with Batch checkout to keep access.`,
          isRead: false, createdAt: now,
        });
        reminders += 1;
      }
    }
    return { reminders, expired };
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

    const now = Date.now();
    await ctx.db.patch(activeSub._id, {
      status: "cancelled",
      cancelledAt: now,
      cancelAtPeriodEnd: true,
      updatedAt: now,
    });

    // Revoke user verification status immediately
    await ctx.db.patch(user._id, {
      verificationTier: "none",
      verificationStatus: "cancelled",
      verificationExpiresAt: undefined,
      updatedAt: now,
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

    const category = args.category.trim();
    if (!category) throw new Error("Choose a creator category.");
    if (/manga|webtoon/i.test(category) && user.creatorType !== "manga") {
      throw new Error("Apply and receive approval for the Manga Creator profile before selecting this category.");
    }
    if (/short.movie|short drama|film/i.test(category) && user.creatorType !== "short_movie") {
      throw new Error("Apply and receive approval for the Short-Movie Creator profile before selecting this category.");
    }

    await ctx.db.patch(user._id, {
      creatorCategory: category,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/** Return the signed-in user's most relevant professional creator application. */
export const getMyProfessionalCreatorApplication = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return null;
    const applications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    applications.sort((a, b) => b.submittedAt - a.submittedAt);
    return applications.find((application) => application.creatorType === user.creatorType)
      ?? applications.find((application) => application.status === "pending")
      ?? applications[0]
      ?? null;
  },
});

/** Backwards-compatible query alias for existing clients. */
export const getMyMangaCreatorApplication = getMyProfessionalCreatorApplication;

/** Return the signed-in user's most recent professional creator application. */
/** Apply for a professional manga or short-movie creator profile. */
export const applyForProfessionalCreator = mutation({
  args: {
    creatorType: v.union(v.literal("manga"), v.literal("short_movie")),
    publisherName: v.string(),
    portfolioUrl: v.string(),
    sampleChapterUrl: v.optional(v.string()),
    about: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Sign in before applying to become a Manga Creator.");
    if (user.creatorType === args.creatorType) throw new Error("This professional creator profile is already approved.");

    const publisherName = args.publisherName.trim();
    const portfolioUrl = args.portfolioUrl.trim();
    const sampleChapterUrl = args.sampleChapterUrl?.trim() || undefined;
    const about = args.about.trim();
    if (publisherName.length < 2 || publisherName.length > 60) {
      throw new Error("Publisher name must be between 2 and 60 characters.");
    }
    if (!/^https:\/\//i.test(portfolioUrl)) {
      throw new Error("Add a portfolio link that starts with https://.");
    }
    if (sampleChapterUrl && !/^https:\/\//i.test(sampleChapterUrl)) {
      throw new Error("Sample chapter links must start with https://.");
    }
    if (about.length < 30 || about.length > 1200) {
      throw new Error("Tell us about your creator work in 30 to 1,200 characters.");
    }

    const applications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (applications.some((application) => application.status === "pending" && application.creatorType === args.creatorType)) {
      throw new Error("Your application for this creator category is already under review.");
    }
    if (applications.some((application) => application.status === "approved" && application.creatorType === args.creatorType)) {
      throw new Error("This professional creator profile is already approved.");
    }

    const now = Date.now();
    return await ctx.db.insert("creatorApplications", {
      userId: user._id,
      creatorType: args.creatorType,
      publisherName,
      portfolioUrl,
      sampleChapterUrl,
      about,
      status: "pending",
      submittedAt: now,
      updatedAt: now,
    });
  },
});

/** Admin queue for Manga Creator applications. */
export const listProfessionalCreatorApplications = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))) },
  handler: async (ctx, { status = "pending" }) => {
    await requireAdmin(ctx);
    const applications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
    applications.sort((a, b) => b.submittedAt - a.submittedAt);
    return await Promise.all(applications.map(async (application) => {
      const user = await ctx.db.get(application.userId);
      return {
        ...application,
        applicant: user ? {
          id: user._id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          email: user.email,
        } : null,
      };
    }));
  },
});

/** Approve or reject a pending Manga Creator application. */
export const reviewProfessionalCreatorApplication = mutation({
  args: {
    applicationId: v.id("creatorApplications"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Unauthorized: administrator account required.");
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found.");
    if (application.status !== "pending") throw new Error("This application has already been reviewed.");
    const user = await ctx.db.get(application.userId);
    if (!user) throw new Error("Applicant account no longer exists.");

    const now = Date.now();
    const reviewNote = args.reviewNote?.trim().slice(0, 1200) || undefined;
    await ctx.db.patch(application._id, {
      status: args.decision,
      reviewNote,
      reviewedBy: admin._id,
      reviewedAt: now,
      updatedAt: now,
    });

    if (args.decision === "approved") {
      await ctx.db.patch(user._id, {
        creatorType: application.creatorType,
        creatorCategory: application.creatorType === "manga" ? "Manga & Webtoon" : "Short Movies & Dramas",
        ...(application.creatorType === "manga" ? {
          mangaPublisherName: application.publisherName,
          mangaCreatorAbout: application.about,
        } : {
          shortMovieStudioName: application.publisherName,
          shortMovieCreatorAbout: application.about,
        }),
        creatorAccountStatus: "active",
        creatorLevel: user.creatorLevel || 1,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLog", {
      actorId: admin._id,
      action: `professional_creator_${application.creatorType}_application_${args.decision}`,
      target: application.userId,
      before: "pending",
      after: args.decision,
      createdAt: now,
    });

    return { success: true, status: args.decision, userId: user._id };
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
    if (creator.suspended || creator.creatorAccountStatus === "suspended" || creator.creatorAccountStatus === "closed") {
      throw new Error("This creator cannot receive tips right now.");
    }
    if (creator.creatorType) {
      const approvedApplications = await ctx.db.query("creatorApplications")
        .withIndex("by_user_status", (q) => q.eq("userId", creator._id).eq("status", "approved"))
        .collect();
      const approvedApplication = approvedApplications.find((application) => application.creatorType === creator.creatorType);
      if (!approvedApplication || getActiveVerificationTier(creator) !== "creator") {
        throw new Error("This professional creator is not eligible to receive monetized tips.");
      }
    }

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
