import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

/**
 * Available Plum Virtual Gifts with LaLao Credit (LC) pricing
 */
export const PLUM_GIFTS_CATALOG = [
  { id: "rose", name: "Red Rose", icon: "🌹", priceLC: 50, description: "A classic sign of affection" },
  { id: "cocktail", name: "Sweet Cocktail", icon: "🍸", priceLC: 100, description: "Cheers to good conversation" },
  { id: "chocolate", name: "Artisan Chocolates", icon: "🍫", priceLC: 150, description: "Sweet & thoughtful" },
  { id: "teddy", name: "Cuddly Teddy", icon: "🧸", priceLC: 250, description: "Warm and friendly gesture" },
  { id: "champagne", name: "Sparkling Champagne", icon: "🍾", priceLC: 500, description: "For special connections" },
  { id: "diamond", name: "Plum Diamond", icon: "💎", priceLC: 1000, description: "The ultimate sparkle of interest" },
];

/**
 * Check or confirm age eligibility (18+)
 */
export const getPlumEligibility = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getAuthedUser(ctx);
      if (!user) {
        return { isAuthenticated: false, isAgeConfirmed: false, hasProfile: false, profile: null };
      }

      const profile = await ctx.db
        .query("plumProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      return {
        isAuthenticated: true,
        userId: user._id,
        isAgeConfirmed: !!profile?.isAgeConfirmed,
        ageConfirmedAt: profile?.ageConfirmedAt,
        hasProfile: !!profile && profile.profileVisibility !== "deactivated",
        profile: profile || null,
      };
    } catch {
      return { isAuthenticated: false, isAgeConfirmed: false, hasProfile: false, profile: null };
    }
  },
});

/**
 * Confirm user is 18+ and create initial confirmation record
 */
export const confirmAge = mutation({
  args: {
    confirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (!args.confirmed) throw new Error("Must confirm you are 18 or older to access Plum");

    const existing = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isAgeConfirmed: true,
        ageConfirmedAt: now,
        updatedAt: now,
      });
      return { success: true, profileId: existing._id };
    }

    // Create an initial record with isAgeConfirmed=true so eligibility immediately reflects confirmation
    const newProfileId = await ctx.db.insert("plumProfiles", {
      userId: user._id,
      displayName: user.name || "Plum Member",
      age: 18,
      gender: "unspecified",
      datingPreferences: [],
      bio: "",
      interests: [],
      datingIntentions: "dating",
      broadLocation: user.locationName || "Nigeria",
      publicPhotos: [],
      privatePhotos: [],
      isAgeConfirmed: true,
      ageConfirmedAt: now,
      showOnMap: false,
      profileVisibility: "hidden", // hidden until profile creation is completed
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, profileId: newProfileId, confirmedAt: now };
  },
});

/**
 * Create or update Plum Dating Profile
 */
export const savePlumProfile = mutation({
  args: {
    displayName: v.string(),
    age: v.number(),
    gender: v.string(),
    datingPreferences: v.array(v.string()),
    bio: v.string(),
    interests: v.array(v.string()),
    datingIntentions: v.string(),
    datingGoal: v.optional(v.union(
      v.literal("long_term"),
      v.literal("marriage"),
      v.literal("casual"),
      v.literal("short_term"),
      v.literal("friendship_first"),
      v.literal("open")
    )),
    additionalDatingInfo: v.optional(v.string()),
    broadLocation: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mainPhoto: v.optional(v.string()),
    publicPhotos: v.array(v.string()),
    privatePhotos: v.array(v.string()),
    showOnMap: v.boolean(),
    profileVisibility: v.union(v.literal("active"), v.literal("hidden"), v.literal("deactivated")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.age < 18) {
      throw new Error("You must be 18 or older to create a Plum dating profile.");
    }
    if (args.publicPhotos.length === 0 && !args.mainPhoto) {
      throw new Error("Please add at least one public profile photo to create your Plum profile.");
    }

    // Ensure mainPhoto is set; defaults to first public photo if not provided
    const effectiveMainPhoto = args.mainPhoto || args.publicPhotos[0] || "";
    // Ensure effective publicPhotos contains the main photo at index 0 if not present
    let effectivePublicPhotos = [...args.publicPhotos];
    if (effectiveMainPhoto && !effectivePublicPhotos.includes(effectiveMainPhoto)) {
      effectivePublicPhotos.unshift(effectiveMainPhoto);
    } else if (effectiveMainPhoto && effectivePublicPhotos.includes(effectiveMainPhoto)) {
      // Reorder so main photo is first
      effectivePublicPhotos = [effectiveMainPhoto, ...effectivePublicPhotos.filter(p => p !== effectiveMainPhoto)];
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName.trim(),
        age: args.age,
        gender: args.gender,
        datingPreferences: args.datingPreferences,
        bio: args.bio.trim(),
        interests: args.interests,
        datingIntentions: args.datingIntentions,
        datingGoal: args.datingGoal || (existing as any).datingGoal || "long_term",
        additionalDatingInfo: args.additionalDatingInfo?.trim(),
        broadLocation: args.broadLocation.trim(),
        latitude: args.latitude,
        longitude: args.longitude,
        mainPhoto: effectiveMainPhoto,
        publicPhotos: effectivePublicPhotos,
        privatePhotos: args.privatePhotos,
        showOnMap: args.showOnMap,
        profileVisibility: args.profileVisibility,
        isAgeConfirmed: true,
        ageConfirmedAt: existing.ageConfirmedAt || now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const profileId = await ctx.db.insert("plumProfiles", {
        userId: user._id,
        displayName: args.displayName.trim(),
        age: args.age,
        gender: args.gender,
        datingPreferences: args.datingPreferences,
        bio: args.bio.trim(),
        interests: args.interests,
        datingIntentions: args.datingIntentions,
        datingGoal: args.datingGoal || "long_term",
        additionalDatingInfo: args.additionalDatingInfo?.trim(),
        broadLocation: args.broadLocation.trim(),
        latitude: args.latitude,
        longitude: args.longitude,
        mainPhoto: effectiveMainPhoto,
        publicPhotos: effectivePublicPhotos,
        privatePhotos: args.privatePhotos,
        showOnMap: args.showOnMap,
        profileVisibility: args.profileVisibility,
        isAgeConfirmed: true,
        ageConfirmedAt: now,
        flashesReceivedCount: 0,
        giftsReceivedCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return profileId;
    }
  },
});

/**
 * Get current user's Plum Profile
 */
export const getMyPlumProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return null;

    const profile = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});

/**
 * List Plum Members with mutual dating preference filtering
 */
export const listPlumMembers = query({
  args: {
    genderFilter: v.optional(v.string()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
    intentionsFilter: v.optional(v.string()),
    goalFilter: v.optional(v.string()),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const limit = args.limit ?? 60;

    let myProfile: any = null;
    if (currentUser) {
      myProfile = await ctx.db
        .query("plumProfiles")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .first();
    }

    // Query active profiles
    const allProfiles = await ctx.db
      .query("plumProfiles")
      .withIndex("by_visibility", (q) => q.eq("profileVisibility", "active"))
      .order("desc")
      .take(200);

    const filtered = allProfiles.filter((p) => {
      // Exclude self
      if (currentUser && p.userId === currentUser._id) return false;

      // Adult check
      if (p.age < 18 || !p.isAgeConfirmed) return false;

      // Filter by age range if specified
      if (args.minAge !== undefined && p.age < args.minAge) return false;
      if (args.maxAge !== undefined && p.age > args.maxAge) return false;

      // Filter by intention if specified
      if (args.intentionsFilter && args.intentionsFilter !== "all") {
        if (p.datingIntentions !== args.intentionsFilter) return false;
      }

      // Filter by dating goal if specified
      if (args.goalFilter && args.goalFilter !== "all") {
        const pGoal = (p as any).datingGoal || "long_term";
        if (pGoal !== args.goalFilter) return false;
      }

      // Filter by explicit gender selection in the UI
      if (args.genderFilter && args.genderFilter !== "all") {
        if (p.gender !== args.genderFilter) return false;
      }

      // Mutual dating preference compatibility
      if (myProfile) {
        const normalizeGender = (g: string) => {
          const lower = (g || "").toLowerCase();
          if (lower === "man" || lower === "men" || lower === "trans-man") return "men";
          if (lower === "woman" || lower === "women" || lower === "trans-woman") return "women";
          if (lower === "non-binary" || lower === "genderqueer") return "non-binary";
          return lower;
        };

        const targetGenderNorm = normalizeGender(p.gender);
        const myGenderNorm = normalizeGender(myProfile.gender);

        const normalizePrefs = (prefs: string[] = []) =>
          prefs.map((pref) => normalizeGender(pref));

        // Does target profile match what I am looking for?
        const myPrefs = normalizePrefs(myProfile.datingPreferences || []);
        if (
          myPrefs.length > 0 &&
          !myPrefs.includes("everyone") &&
          !myPrefs.includes("open") &&
          !myPrefs.includes(targetGenderNorm) &&
          targetGenderNorm !== "unspecified"
        ) {
          return false;
        }

        // Does my gender match what the target profile is looking for?
        const theirPrefs = normalizePrefs(p.datingPreferences || []);
        if (
          theirPrefs.length > 0 &&
          !theirPrefs.includes("everyone") &&
          !theirPrefs.includes("open") &&
          !theirPrefs.includes(myGenderNorm) &&
          myGenderNorm !== "unspecified"
        ) {
          return false;
        }
      }

      return true;
    });

    // Get favorite IDs for current user to include in previews
    let userFavoriteSet = new Set<string>();
    if (currentUser) {
      const favs = await ctx.db
        .query("plumFavorites")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .collect();
      userFavoriteSet = new Set(favs.map((f) => f.targetUserId));
    }

    // Return safe member previews with generalized discovery coordinates
    // (exact coordinates are protected on the server; approximate coordinates with ~300-500m privacy jitter are exposed for the map)
    const viewerLat = myProfile?.latitude ?? currentUser?.latitude;
    const viewerLng = myProfile?.longitude ?? currentUser?.longitude;

    return filtered.slice(0, limit).map((p) => {
      let approxLat: number | undefined = undefined;
      let approxLng: number | undefined = undefined;
      let distanceKm: number | undefined = undefined;

      if (p.showOnMap && typeof p.latitude === "number" && typeof p.longitude === "number") {
        // Deterministic generalized privacy jitter based on profile ID
        const hashSeed = (p._id.charCodeAt(p._id.length - 1) % 7) - 3;
        const latJitter = (hashSeed * 0.0035); // ~300-400m offset
        const lngJitter = (((p._id.charCodeAt(0) % 7) - 3) * 0.0035);

        approxLat = Number((p.latitude + latJitter).toFixed(4));
        approxLng = Number((p.longitude + lngJitter).toFixed(4));

        if (typeof viewerLat === "number" && typeof viewerLng === "number") {
          // Haversine formula
          const R = 6371;
          const toRad = (d: number) => (d * Math.PI) / 180;
          const dLat = toRad(p.latitude - viewerLat);
          const dLng = toRad(p.longitude - viewerLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(viewerLat)) * Math.cos(toRad(p.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = Math.round(R * c * 10) / 10;
        }
      }

      return {
        _id: p._id,
        userId: p.userId,
        displayName: p.displayName,
        age: p.age,
        gender: p.gender,
        bio: p.bio,
        interests: p.interests,
        datingIntentions: p.datingIntentions,
        datingGoal: (p as any).datingGoal || "long_term",
        additionalDatingInfo: p.additionalDatingInfo,
        broadLocation: p.broadLocation,
        mainPhoto: (p as any).mainPhoto || p.publicPhotos[0] || "",
        publicPhotosCount: p.publicPhotos.length,
        privatePhotosCount: (p.privatePhotos || []).length,
        flashesReceivedCount: p.flashesReceivedCount || 0,
        giftsReceivedCount: p.giftsReceivedCount || 0,
        showOnMap: p.showOnMap,
        approxLat,
        approxLng,
        distanceKm,
        isFavorited: userFavoriteSet.has(p.userId),
      };
    });
  },
});

/**
 * Get full Plum Member Profile with authorized private photo access and interaction states
 */
export const getPlumMemberDetails = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const profile = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile || profile.profileVisibility === "deactivated") {
      return null;
    }

    const isSelf = currentUser && currentUser._id === args.userId;

    // Check private photo authorization
    let hasPrivateAccess = Boolean(isSelf);
    if (currentUser && !isSelf) {
      const accessGrant = await ctx.db
        .query("plumPrivatePhotoAccess")
        .withIndex("by_owner_viewer", (q) =>
          q.eq("ownerId", args.userId).eq("viewerId", currentUser._id)
        )
        .first();
      hasPrivateAccess = accessGrant?.status === "granted";
    }

    // Check if favorited by currentUser
    let isFavorited = false;
    let hasExpressedInterest = false;
    let interestCount = 0;

    if (currentUser && !isSelf) {
      const fav = await ctx.db
        .query("plumFavorites")
        .withIndex("by_user_target", (q) =>
          q.eq("userId", currentUser._id).eq("targetUserId", args.userId)
        )
        .first();
      isFavorited = !!fav;

      const interest = await ctx.db
        .query("plumInterests")
        .withIndex("by_sender_receiver", (q) =>
          q.eq("senderId", currentUser._id).eq("receiverId", args.userId)
        )
        .first();
      hasExpressedInterest = !!interest;
    }

    const allInterests = await ctx.db
      .query("plumInterests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
    interestCount = allInterests.length;

    return {
      _id: profile._id,
      userId: profile.userId,
      displayName: profile.displayName,
      age: profile.age,
      gender: profile.gender,
      datingPreferences: profile.datingPreferences,
      bio: profile.bio,
      interests: profile.interests,
      datingIntentions: profile.datingIntentions,
      datingGoal: (profile as any).datingGoal || "long_term",
      additionalDatingInfo: profile.additionalDatingInfo,
      broadLocation: profile.broadLocation,
      mainPhoto: (profile as any).mainPhoto || profile.publicPhotos[0] || "",
      publicPhotos: profile.publicPhotos,
      // Private photos are delivered ONLY if authorized
      privatePhotos: hasPrivateAccess ? profile.privatePhotos : [],
      privatePhotosCount: (profile.privatePhotos || []).length,
      hasPrivateAccess,
      showOnMap: profile.showOnMap,
      latitude: profile.latitude,
      longitude: profile.longitude,
      flashesReceivedCount: profile.flashesReceivedCount || 0,
      giftsReceivedCount: profile.giftsReceivedCount || 0,
      interestCount,
      isFavorited,
      hasExpressedInterest,
      isSelf,
    };
  },
});

/**
 * Toggle Pin / Favorite a member
 */
export const togglePlumFavorite = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user._id === args.targetUserId) {
      throw new Error("Cannot favorite your own profile");
    }

    const existing = await ctx.db
      .query("plumFavorites")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", user._id).eq("targetUserId", args.targetUserId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { isFavorited: false };
    } else {
      await ctx.db.insert("plumFavorites", {
        userId: user._id,
        targetUserId: args.targetUserId,
        createdAt: Date.now(),
      });
      return { isFavorited: true };
    }
  },
});

/**
 * Express Interest (Heart) in a member
 */
export const expressPlumInterest = mutation({
  args: {
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user._id === args.receiverId) {
      throw new Error("Cannot express interest in your own profile");
    }

    // Check if interest was already sent
    const existing = await ctx.db
      .query("plumInterests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", user._id).eq("receiverId", args.receiverId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyExpressed: true };
    }

    await ctx.db.insert("plumInterests", {
      senderId: user._id,
      receiverId: args.receiverId,
      createdAt: Date.now(),
    });

    return { success: true, alreadyExpressed: false };
  },
});

/**
 * Get list of favorited target user IDs for current user
 */
export const getMyPlumFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return [];

    const favs = await ctx.db
      .query("plumFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return favs.map((f) => f.targetUserId);
  },
});

/**
 * Grant or revoke private photo access to another Plum member
 */
export const togglePrivatePhotoAccess = mutation({
  args: {
    targetUserId: v.id("users"),
    grant: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("plumPrivatePhotoAccess")
      .withIndex("by_owner_viewer", (q) =>
        q.eq("ownerId", user._id).eq("viewerId", args.targetUserId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.grant ? "granted" : "revoked",
        grantedAt: now,
      });
    } else {
      await ctx.db.insert("plumPrivatePhotoAccess", {
        ownerId: user._id,
        viewerId: args.targetUserId,
        grantedAt: now,
        status: args.grant ? "granted" : "revoked",
      });
    }

    return { success: true, granted: args.grant };
  },
});

/**
 * Send a Plum Flash (Distinct speed-interaction / compliment)
 */
export const sendPlumFlash = mutation({
  args: {
    receiverId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user._id === args.receiverId) throw new Error("Cannot send a flash to yourself");

    // Rate-limit check: max 1 flash to the same member per 12 hours
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("plumFlashes")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", user._id).eq("receiverId", args.receiverId)
      )
      .filter((q) => q.gt(q.field("createdAt"), twelveHoursAgo))
      .first();

    if (recent) {
      throw new Error("You already sent a Flash to this member recently. Please wait before flashing again.");
    }

    const now = Date.now();
    await ctx.db.insert("plumFlashes", {
      senderId: user._id,
      receiverId: args.receiverId,
      note: args.note?.trim(),
      createdAt: now,
    });

    // Increment receiver counter
    const receiverProfile = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.receiverId))
      .first();

    if (receiverProfile) {
      await ctx.db.patch(receiverProfile._id, {
        flashesReceivedCount: (receiverProfile.flashesReceivedCount || 0) + 1,
      });
    }

    // Auto-create a LaLao notification for the recipient
    await ctx.db.insert("notifications", {
      recipientId: args.receiverId,
      actorId: user._id,
      type: "like", // Reuses notification system
      isRead: false,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Send a Plum Gift (Validates sender LaLao Credits wallet balance)
 */
export const sendPlumGift = mutation({
  args: {
    receiverId: v.id("users"),
    giftId: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user._id === args.receiverId) throw new Error("Cannot send a gift to yourself");

    const gift = PLUM_GIFTS_CATALOG.find((g) => g.id === args.giftId);
    if (!gift) throw new Error("Gift not found in Plum catalog");

    // Check sender wallet balance
    const senderWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!senderWallet || senderWallet.balance < gift.priceLC) {
      throw new Error(
        `Insufficient LaLao Credits. You need ${gift.priceLC} LC to send a ${gift.name}. Current balance: ${senderWallet?.balance ?? 0} LC.`
      );
    }

    // Deduct from sender wallet
    const now = Date.now();
    await ctx.db.patch(senderWallet._id, {
      balance: senderWallet.balance - gift.priceLC,
      updatedAt: now,
    });

    // Record sender transaction
    await ctx.db.insert("walletTransactions", {
      walletId: senderWallet._id,
      userId: user._id,
      relatedUserId: args.receiverId,
      type: "transfer_out",
      amount: -gift.priceLC,
      currency: "LC",
      status: "completed",
      description: `Sent Plum Gift: ${gift.name} (${gift.icon})`,
      createdAt: now,
    });

    // Credit recipient wallet
    let receiverWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.receiverId))
      .first();

    if (!receiverWallet) {
      const newWalletId = await ctx.db.insert("userWallets", {
        userId: args.receiverId,
        balance: 0,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: "Plum Member",
        bankName: "LaLao Platform",
        updatedAt: now,
      });
      receiverWallet = await ctx.db.get(newWalletId);
    }

    if (receiverWallet) {
      await ctx.db.patch(receiverWallet._id, {
        balance: receiverWallet.balance + gift.priceLC,
        updatedAt: now,
      });

      await ctx.db.insert("walletTransactions", {
        walletId: receiverWallet._id,
        userId: args.receiverId,
        relatedUserId: user._id,
        relatedUserName: user.name,
        type: "deposit",
        amount: gift.priceLC,
        currency: "LC",
        status: "completed",
        description: `Received Plum Gift: ${gift.name} (${gift.icon}) from ${user.name || "Member"}`,
        createdAt: now,
      });
    }

    // Record Gift
    await ctx.db.insert("plumGifts", {
      senderId: user._id,
      receiverId: args.receiverId,
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      amountLC: gift.priceLC,
      message: args.message?.trim(),
      createdAt: now,
    });

    // Update receiver profile counter
    const receiverProfile = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.receiverId))
      .first();

    if (receiverProfile) {
      await ctx.db.patch(receiverProfile._id, {
        giftsReceivedCount: (receiverProfile.giftsReceivedCount || 0) + 1,
      });
    }

    return { success: true, giftName: gift.name, costLC: gift.priceLC };
  },
});

/**
 * Report a Plum Member for safety and moderation
 */
export const reportPlumMember = mutation({
  args: {
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await ctx.db.insert("plumReports", {
      reporterId: user._id,
      reportedUserId: args.reportedUserId,
      reason: args.reason.trim(),
      details: args.details?.trim(),
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Deactivate or Delete Plum Profile
 */
export const updatePlumStatus = mutation({
  args: {
    status: v.union(v.literal("active"), v.literal("hidden"), v.literal("deactivated")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("plumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) throw new Error("Plum profile not found");

    await ctx.db.patch(profile._id, {
      profileVisibility: args.status,
      updatedAt: Date.now(),
    });

    return { success: true, status: args.status };
  },
});

/**
 * Get user discovery preference for a page (e.g. Plum "I'm not interested")
 */
export const getPageDiscoveryPreference = query({
  args: { pageSlugOrId: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await getAuthedUser(ctx);
      if (!user) return { isHidden: false };

      const pref = await ctx.db
        .query("userPagePreferences")
        .withIndex("by_user_page", (q) =>
          q.eq("userId", user._id).eq("pageSlugOrId", args.pageSlugOrId)
        )
        .first();

      return { isHidden: !!pref?.hiddenFromRecommendations };
    } catch {
      return { isHidden: false };
    }
  },
});

/**
 * Update user discovery preference for a page (e.g., "I'm not interested" / "Hide this page")
 */
export const setPageDiscoveryPreference = mutation({
  args: {
    pageSlugOrId: v.string(),
    hidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPagePreferences")
      .withIndex("by_user_page", (q) =>
        q.eq("userId", user._id).eq("pageSlugOrId", args.pageSlugOrId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        hiddenFromRecommendations: args.hidden,
        updatedAt: now,
      });
      return { success: true, hidden: args.hidden };
    }

    await ctx.db.insert("userPagePreferences", {
      userId: user._id,
      pageSlugOrId: args.pageSlugOrId,
      hiddenFromRecommendations: args.hidden,
      updatedAt: now,
    });

    return { success: true, hidden: args.hidden };
  },
});
