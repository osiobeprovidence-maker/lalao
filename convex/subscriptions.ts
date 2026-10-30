import { getUserByAuthIdentity } from "./lib/authIdentity";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";

// Helper to resolve authenticated user
async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await getUserByAuthIdentity(ctx, identity);
}

// ─────────────────────────────────────────────────────────────
// 1. JOINTHEQ SYSTEM PAGE BOOTSTRAP
// ─────────────────────────────────────────────────────────────

export const ensureJointheQPage = mutation({
  args: {},
  handler: async (ctx) => {
    let existing = await ctx.db
      .query("pages")
      .withIndex("by_username", (q) => q.eq("username", "jointheq"))
      .first();

    if (!existing) {
      existing = await ctx.db
        .query("pages")
        .filter((q) => q.eq(q.field("name"), "JointheQ"))
        .first();
    }

    if (existing) {
      const activeTools = existing.activeTools || [];
      if (!activeTools.includes("subscriptions")) {
        await ctx.db.patch(existing._id, {
          activeTools: [...activeTools, "subscriptions"],
          businessType: "subscription",
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }

    const user = await getAuthedUser(ctx);

    // Fallback owner if current user isn't logged in yet
    let ownerId = user?._id;
    if (!ownerId) {
      const superAdmin = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "super_admin"))
        .first();
      const admin = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .first();
      const firstUser = await ctx.db.query("users").first();
      ownerId = superAdmin?._id || admin?._id || firstUser?._id;
    }
    if (!ownerId) {
      // Return null gracefully if DB is completely empty rather than crashing the client
      return null;
    }

    const pageId = await ctx.db.insert("pages", {
      ownerId,
      name: "JointheQ",
      username: "jointheq",
      type: "business",
      badge: "BIZ",
      businessType: "subscription",
      description: "JointheQ allows people to join shared subscription groups for Spotify, Apple Music, Netflix, YouTube Family, and more at discounted group rates.",
      location: "Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
      category: "Subscription & Entertainment",
      activeTools: ["subscriptions"],
      followersCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("pageMembers", {
      pageId,
      userId: ownerId,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Seed initial subscription offerings for JointheQ
    await seedDefaultSubscriptions(ctx, pageId);

    return pageId;
  },
});

async function seedDefaultSubscriptions(ctx: any, pageId: any) {
  const seedItems = [
    {
      name: "Spotify Premium Family Slot",
      description: "Get your own independent Spotify Premium account under JointheQ's verified Family plan. High quality audio & zero ads.",
      category: "Music & Audio",
      platformName: "Spotify",
      platformLogo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
      totalAccountCost: 3500,
      defaultSlotPrice: 1200,
      currency: "NGN",
      billingCycle: "monthly" as const,
      totalCapacity: 5,
      benefits: ["Individual personal account", "Offline song downloads", "Ad-free uninterrupted streaming", "Personalized playlists"],
      memberInstructions: "After joining, an invitation link will be delivered to your JointheQ dashboard and notifications within 10 minutes.",
      eligibilityRules: "Requires a standard Spotify account not currently attached to any active Family or Duo subscription.",
      cancellationPolicy: "Cancel future renewals anytime with 1 click before the next billing cycle.",
      renewalRules: "Monthly access period. Renew manually before expiry using Lalao Wallet or Batch hosted checkout.",
      gracePeriodDays: 3,
    },
    {
      name: "Apple Music Family Slot",
      description: "Lossless Spatial Audio and 100M+ songs with Siri integration and lyrics. Works on Apple and Android devices.",
      category: "Music & Audio",
      platformName: "Apple Music",
      platformLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_Music_logo.svg",
      totalAccountCost: 3000,
      defaultSlotPrice: 1000,
      currency: "NGN",
      billingCycle: "monthly" as const,
      totalCapacity: 5,
      benefits: ["Spatial Audio with Dolby Atmos", "Lossless audio quality", "100 million songs on demand", "Works on iOS, Android & Mac"],
      memberInstructions: "Provide your Apple ID email after payment to receive the iCloud Family invitation.",
      eligibilityRules: "Your Apple ID region must be set to Nigeria.",
      cancellationPolicy: "Cancel anytime before your monthly cycle renewal date.",
      renewalRules: "Monthly access period. Renew manually before expiry using Lalao Wallet or Batch hosted checkout.",
      gracePeriodDays: 3,
    },
    {
      name: "YouTube Premium Family Slot",
      description: "Ad-free YouTube videos, background play, and YouTube Music Premium included for your personal Google account.",
      category: "Video & Streaming",
      platformName: "YouTube",
      platformLogo: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
      totalAccountCost: 4000,
      defaultSlotPrice: 1500,
      currency: "NGN",
      billingCycle: "monthly" as const,
      totalCapacity: 5,
      benefits: ["Ad-free YouTube playback", "Background play while using other apps", "Video downloads for offline viewing", "YouTube Music Premium included"],
      memberInstructions: "Invitation link will be dispatched to your email address.",
      eligibilityRules: "Google account must not have switched family groups within the last 12 months.",
      cancellationPolicy: "Cancel future renewals anytime with 1-click.",
      renewalRules: "Monthly plan; renew manually before access expires.",
      gracePeriodDays: 3,
    },
    {
      name: "Netflix Premium 4K Profile",
      description: "Dedicated personal PIN-protected Ultra HD 4K profile with individual watch history and personalized recommendations.",
      category: "Movies & TV",
      platformName: "Netflix",
      platformLogo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      totalAccountCost: 7000,
      defaultSlotPrice: 2500,
      currency: "NGN",
      billingCycle: "monthly" as const,
      totalCapacity: 4,
      benefits: ["Ultra HD 4K + HDR video quality", "Dedicated PIN-protected profile", "Spatial Audio support", "Personal watch list & history"],
      memberInstructions: "Login credentials and profile PIN are assigned directly in your membership details.",
      eligibilityRules: "Open to all users.",
      cancellationPolicy: "Cancel anytime before the next billing cycle.",
      renewalRules: "Renew manually before access expires to keep membership active.",
      gracePeriodDays: 2,
    }
  ];

  for (const item of seedItems) {
    const listingId = await ctx.db.insert("subscriptionListings", {
      pageId,
      name: item.name,
      description: item.description,
      category: item.category,
      platformName: item.platformName,
      platformLogo: item.platformLogo,
      totalAccountCost: item.totalAccountCost,
      currency: item.currency,
      billingCycle: item.billingCycle,
      totalCapacity: item.totalCapacity,
      defaultSlotPrice: item.defaultSlotPrice,
      allowDifferentSlotPrices: false,
      memberInstructions: item.memberInstructions,
      eligibilityRules: item.eligibilityRules,
      cancellationPolicy: item.cancellationPolicy,
      renewalRules: item.renewalRules,
      gracePeriodDays: item.gracePeriodDays,
      benefits: item.benefits,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (let i = 1; i <= item.totalCapacity; i++) {
      await ctx.db.insert("subscriptionSlots", {
        subscriptionId: listingId,
        pageId,
        slotNumber: i,
        status: "available",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 2. SUBSCRIPTION CATALOGUE & DISCOVERY
// ─────────────────────────────────────────────────────────────

export const getJointheQPage = query({
  args: {},
  handler: async (ctx) => {
    const page = await ctx.db
      .query("pages")
      .withIndex("by_username", (q) => q.eq("username", "jointheq"))
      .first();
    return page;
  },
});

export const getJointheQCatalogue = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Release any expired reservations on read to keep slots accurate
    const now = Date.now();
    const page = await ctx.db
      .query("pages")
      .withIndex("by_username", (q) => q.eq("username", "jointheq"))
      .first();

    if (!page) return [];

    let listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    if (args.category && args.category !== "All") {
      listings = listings.filter((l) => l.category === args.category);
    }

    const results = await Promise.all(
      listings.map(async (listing) => {
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
          .collect();

        // Calculate actual state
        const occupied = slots.filter((s) => s.status === "occupied").length;
        // Check temporary reservation expiry
        const reserved = slots.filter((s) => s.status === "reserved" && (s.reservationExpiresAt ?? 0) > now).length;
        const available = Math.max(0, listing.totalCapacity - occupied - reserved);

        return {
          ...listing,
          occupiedSlots: occupied,
          reservedSlots: reserved,
          availableSlots: available,
          isFull: available === 0,
        };
      })
    );

    return results;
  },
});

export const getSubscriptionDetails = query({
  args: { subscriptionId: v.id("subscriptionListings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.subscriptionId);
    if (!listing) return null;

    const page = await ctx.db.get(listing.pageId);
    const slots = await ctx.db
      .query("subscriptionSlots")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
      .collect();

    const now = Date.now();
    const occupied = slots.filter((s) => s.status === "occupied").length;
    const reserved = slots.filter((s) => s.status === "reserved" && (s.reservationExpiresAt ?? 0) > now).length;
    const available = Math.max(0, listing.totalCapacity - occupied - reserved);

    return {
      ...listing,
      page,
      occupiedSlots: occupied,
      reservedSlots: reserved,
      availableSlots: available,
      isFull: available === 0,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// 3. ATOMIC SLOT RESERVATION & JOIN WORKFLOWS
// ─────────────────────────────────────────────────────────────

const RESERVATION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes to complete payment

/**
 * reserveSlot:
 * Temporarily locks a slot during checkout so multiple users cannot race for the final spot.
 */
export const reserveSlot = mutation({
  args: {
    subscriptionId: v.id("subscriptionListings"),
    paymentMethod: v.union(v.literal("wallet"), v.literal("bachs")),
    bachsReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("You must be logged in to join a subscription.");

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || !subscription.active) {
      throw new ConvexError("This subscription is currently inactive or unavailable.");
    }

    // 1. Prevent duplicate active memberships for this subscription
    const existing = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user_subscription", (q) =>
        q.eq("userId", user._id).eq("subscriptionId", args.subscriptionId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      throw new ConvexError("You already have an active membership for this subscription group.");
    }

    // 2. Find available slot or expired reservation
    const now = Date.now();
    const slots = await ctx.db
      .query("subscriptionSlots")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscription._id))
      .collect();

    // Clean up expired slots inline
    for (const s of slots) {
      if (s.status === "reserved" && (s.reservationExpiresAt ?? 0) <= now) {
        await ctx.db.patch(s._id, {
          status: "available",
          reservedForUserId: undefined,
          reservationExpiresAt: undefined,
          updatedAt: now,
        });
        s.status = "available";
      }
    }

    const freeSlot = slots.find((s) => s.status === "available");
    if (!freeSlot) {
      throw new ConvexError("Sorry, all slots for this subscription group are currently occupied.");
    }

    const price = freeSlot.priceOverride ?? subscription.defaultSlotPrice;
    const expiresAt = now + RESERVATION_TIMEOUT_MS;

    // Atomically reserve
    await ctx.db.patch(freeSlot._id, {
      status: "reserved",
      reservedForUserId: user._id,
      reservationExpiresAt: expiresAt,
      updatedAt: now,
    });

    const reservationId = await ctx.db.insert("subscriptionReservations", {
      subscriptionId: subscription._id,
      slotId: freeSlot._id,
      userId: user._id,
      amount: price,
      currency: subscription.currency,
      status: "pending",
      paymentMethod: args.paymentMethod,
      bachsReference: args.bachsReference,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return {
      reservationId,
      slotId: freeSlot._id,
      slotNumber: freeSlot.slotNumber,
      amount: price,
      currency: subscription.currency,
      expiresAt,
    };
  },
});

/**
 * joinViaWallet:
 * Atomically validates balance, locks funds, settles membership, and creates ledger entries.
 */
export const joinViaWallet = mutation({
  args: {
    subscriptionId: v.id("subscriptionListings"),
    reservationId: v.optional(v.id("subscriptionReservations")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("Unauthenticated");

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || !subscription.active) {
      throw new ConvexError("Subscription not found or inactive");
    }

    const now = Date.now();

    // 1. Check existing active membership
    const existing = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user_subscription", (q) =>
        q.eq("userId", user._id).eq("subscriptionId", args.subscriptionId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      throw new ConvexError("You are already an active member of this subscription.");
    }

    // 2. Locate slot (either reserved for this user, or claim a free one)
    let slot = null;
    if (args.reservationId) {
      const res = await ctx.db.get(args.reservationId);
      if (res && res.userId === user._id && res.status === "pending" && res.expiresAt > now) {
        slot = await ctx.db.get(res.slotId);
      }
    }

    if (!slot || slot.status === "occupied") {
      const allSlots = await ctx.db
        .query("subscriptionSlots")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscription._id))
        .collect();

      slot = allSlots.find((s) => s.status === "available" || (s.status === "reserved" && s.reservedForUserId === user._id));
    }

    if (!slot) {
      throw new ConvexError("No available slot found for this subscription.");
    }

    const price = slot.priceOverride ?? subscription.defaultSlotPrice;

    // 3. Retrieve authoritative Lalao Wallet
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) {
      throw new ConvexError("Wallet not initialized. Please fund your wallet first or use Batch checkout.");
    }

    if (wallet.balance < price) {
      throw new ConvexError(`Insufficient wallet balance. Price is ${price.toLocaleString()} LC, but you have ${wallet.balance.toLocaleString()} LC.`);
    }

    // 4. Atomic balance deduction
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - price,
      updatedAt: now,
    });

    const txRef = `JQ-WAL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 5. Authoritative transaction ledger
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: price,
      type: "subscription_payment",
      status: "completed",
      description: `JointheQ: ${subscription.name} (Slot ${slot.slotNumber})`,
      assetType: "LALAO_CREDITS",
      currency: "LC",
      reference: txRef,
      createdAt: now,
    });

    // 6. Occupy slot
    await ctx.db.patch(slot._id, {
      status: "occupied",
      currentMemberId: user._id,
      reservedForUserId: undefined,
      reservationExpiresAt: undefined,
      updatedAt: now,
    });

    // 7. Calculate billing period (calendar month exact)
    const periodEnd = calculateBillingPeriodEnd(now, subscription.billingCycle, subscription.durationMonths);

    // 8. Create membership
    const membershipId = await ctx.db.insert("subscriptionMemberships", {
      userId: user._id,
      pageId: subscription.pageId,
      subscriptionId: subscription._id,
      slotId: slot._id,
      role: "Member",
      status: "active",
      amount: price,
      currency: subscription.currency,
      paymentMethod: "wallet",
      lastPaymentReference: txRef,
      lastPaymentStatus: "completed",
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextRenewalDate: periodEnd,
      cancelAtPeriodEnd: false,
      autoRenew: false,
      createdAt: now,
      updatedAt: now,
    });

    if (args.reservationId) {
      await ctx.db.patch(args.reservationId, { status: "completed", updatedAt: now });
    }

    // 9. Deliver notification to member via Lalao Notification system
    await createJointheQNotification(ctx, {
      recipientId: user._id,
      actorId: user._id,
      type: "subscription_joined",
      targetExcerpt: `Welcome to ${subscription.name}! Your membership is active through ${new Date(periodEnd).toLocaleDateString()}.`,
    });

    return {
      success: true,
      membershipId,
      reference: txRef,
      subscriptionName: subscription.name,
      amount: price,
      nextRenewalDate: periodEnd,
    };
  },
});

/**
 * settleBachsSubscription:
 * Internal mutation called only after authoritative Bachs checkout verification.
 */
export const settleBachsSubscription = internalMutation({
  args: {
    reference: v.string(),
    amount: v.number(),
    currency: v.string(),
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if membership is already settled for this reference (Idempotency)
    const alreadySettled = await ctx.db
      .query("subscriptionMemberships")
      .filter((q) => q.eq(q.field("lastPaymentReference"), args.reference))
      .first();

    if (alreadySettled) {
      return { success: true, alreadySettled: true, membershipId: alreadySettled._id };
    }

    // Locate reservation by reference or ID
    const reservation: Doc<"subscriptionReservations"> | null = await ctx.db
      .query("subscriptionReservations")
      .withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference))
      .first();

    if (!reservation) {
      throw new ConvexError("Subscription reservation not found for reference: " + args.reference);
    }

    const subscription: Doc<"subscriptionListings"> | null = await ctx.db.get(reservation.subscriptionId);
    if (!subscription) throw new ConvexError("Subscription listing not found");

    const slot: Doc<"subscriptionSlots"> | null = await ctx.db.get(reservation.slotId);
    if (!slot) throw new ConvexError("Subscription slot not found");

    if (reservation.status !== "pending" || reservation.bachsCheckoutId !== args.checkoutId || reservation.amount !== args.amount || reservation.currency.toUpperCase() !== args.currency.toUpperCase() || reservation.expiresAt <= now || slot.status !== "reserved" || slot.reservedForUserId !== reservation.userId) {
      throw new ConvexError("Verified Bachs payment does not match this subscription reservation.");
    }
    // Occupy slot
    await ctx.db.patch(slot._id, {
      status: "occupied",
      currentMemberId: reservation.userId,
      reservedForUserId: undefined,
      reservationExpiresAt: undefined,
      updatedAt: now,
    });

    const periodEnd = calculateBillingPeriodEnd(now, subscription.billingCycle, subscription.durationMonths);

    // Create active membership record
    const membershipId = await ctx.db.insert("subscriptionMemberships", {
      userId: reservation.userId,
      pageId: subscription.pageId,
      subscriptionId: subscription._id,
      slotId: slot._id,
      role: "Member",
      status: "active",
      amount: args.amount,
      currency: subscription.currency,
      paymentMethod: "bachs",
      lastPaymentReference: args.reference,
      lastPaymentStatus: "completed",
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextRenewalDate: periodEnd,
      cancelAtPeriodEnd: false,
      autoRenew: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(reservation._id, {
      status: "completed",
      updatedAt: now,
    });

    // Notify member through Lalao Notification system
    await createJointheQNotification(ctx, {
      recipientId: reservation.userId,
      actorId: reservation.userId,
      type: "subscription_joined",
      targetExcerpt: `Payment verified! You are now an active member of ${subscription.name}.`,
    });

    return {
      success: true,
      membershipId,
      reference: args.reference,
    };
  },
});

export const attachBachsSubscriptionCheckout = mutation({
  args: { reference: v.string(), checkoutId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("Unauthenticated");
    const reservation = await ctx.db.query("subscriptionReservations")
      .withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference)).first();
    if (!reservation || reservation.userId !== user._id || reservation.status !== "pending" || reservation.expiresAt <= Date.now()) {
      throw new ConvexError("Pending subscription checkout not found.");
    }
    if (reservation.bachsCheckoutId && reservation.bachsCheckoutId !== args.checkoutId) {
      throw new ConvexError("A checkout is already attached to this reservation.");
    }
    await ctx.db.patch(reservation._id, { bachsCheckoutId: args.checkoutId, updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * verifyAndJoinBachs:
 * Server-side Bachs checkout verification action.
 */
export const verifyAndJoinBachs = action({
  args: {
    reference: v.string(),
    checkoutId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");
    const user = await ctx.runQuery(internal.wallet.getUserByIdentity, { tokenIdentifier: identity.tokenIdentifier });
    if (!user) throw new ConvexError("User not found");
    const reservation = await ctx.runQuery(internal.subscriptions.getBachsReservationForReference, { reference: args.reference });
    if (!reservation || reservation.userId !== String(user._id)) throw new ConvexError("Payment reservation not found.");
    const key = process.env.BACHS_SECRET_KEY;
    const env = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
    const base = env === "live" || env === "production" ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
    if (!key) throw new ConvexError("Bachs checkout is not configured.");
    const expectedPrefix = base === "https://api.bachs.io" ? "sk_live_" : "sk_sandbox_";
    if (!key.startsWith(expectedPrefix)) throw new ConvexError("Bachs key does not match the configured environment.");
    const response = await fetch(`${base}/v1/checkout-sessions/${encodeURIComponent(args.checkoutId)}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
    if (!response.ok) throw new ConvexError("Could not verify the Bachs checkout.");
    const session = await response.json() as any;
    const checkoutEmail = String(session.customer?.email || session.customer_details?.email || "").trim().toLowerCase();
    if (session.checkout_id !== args.checkoutId || session.checkout_id !== reservation.checkoutId || session.reference !== args.reference || session.status !== "completed" || session.payment_status !== "succeeded" || String(session.currency).toUpperCase() !== reservation.currency.toUpperCase() || Number(session.amount) !== reservation.amount || String(session.metadata?.userId || "") !== String(user._id) || checkoutEmail !== reservation.email.toLowerCase()) {
      return { success: false, message: "Bachs payment is not confirmed or does not match the reservation." };
    }
    return await ctx.runMutation(internal.subscriptions.settleBachsSubscription, { reference: args.reference, amount: Number(session.amount), currency: String(session.currency), checkoutId: args.checkoutId });
  },
});

export const getBachsReservationForReference = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.query("subscriptionReservations").withIndex("by_bachs_reference", (q) => q.eq("bachsReference", args.reference)).first();
    if (!reservation) return null;
    const user = await ctx.db.get(reservation.userId);
    if (!user) return null;
    return { userId: String(reservation.userId), email: user.email || `${user.username || "user"}@lalao.app`, amount: reservation.amount, currency: reservation.currency, checkoutId: reservation.bachsCheckoutId, status: reservation.status, expiresAt: reservation.expiresAt };
  },
});

// ─────────────────────────────────────────────────────────────
// 4. MY SUBSCRIPTIONS & USER ACTIONS
// ─────────────────────────────────────────────────────────────

export const getMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const subscription = await ctx.db.get(m.subscriptionId);
        const slot = await ctx.db.get(m.slotId);
        const page = await ctx.db.get(m.pageId);
        return {
          ...m,
          subscription,
          slot,
          page,
        };
      })
    );

    return results;
  },
});

export const getMyMemberships = query({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.userId) {
      const normalized = ctx.db.normalizeId("users", args.userId as string);
      if (normalized) {
        user = await ctx.db.get(normalized);
      }
    }
    if (!user) return [];

    const memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const subscription = await ctx.db.get(m.subscriptionId);
        const slot = await ctx.db.get(m.slotId);
        const page = await ctx.db.get(m.pageId);
        return {
          ...m,
          subscription,
          slot,
          page,
        };
      })
    );

    return results;
  },
});

export const cancelSubscriptionRenewal = mutation({
  args: { membershipId: v.id("subscriptionMemberships") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new ConvexError("Unauthenticated");

    const mem = await ctx.db.get(args.membershipId);
    if (!mem || mem.userId !== user._id) {
      throw new ConvexError("Membership not found or unauthorized");
    }

    await ctx.db.patch(mem._id, {
      cancelAtPeriodEnd: true,
      autoRenew: false,
      updatedAt: Date.now(),
    });

    const sub = await ctx.db.get(mem.subscriptionId);

    // Notification
    await createJointheQNotification(ctx, {
      recipientId: user._id,
      actorId: user._id,
      type: "subscription_cancelled",
      targetExcerpt: `${sub?.name || "Your membership"} will end on ${new Date(mem.currentPeriodEnd || Date.now()).toLocaleDateString()}. You will keep access until then.`,
    });

    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────
// 5. JOINTHEQ TEAM MANAGEMENT DASHBOARD & CRM
// ─────────────────────────────────────────────────────────────

async function verifyPageAdmin(ctx: any, pageId: any) {
  const user = await getAuthedUser(ctx);
  if (!user) throw new ConvexError("Unauthenticated");

  const page = await ctx.db.get(pageId);
  if (!page) throw new ConvexError("Page not found");

  if (page.ownerId === user._id || user.role === "admin" || user.role === "super_admin") {
    return { user, page };
  }

  const member = await ctx.db
    .query("pageMembers")
    .withIndex("by_page_user", (q: any) => q.eq("pageId", pageId).eq("userId", user._id))
    .first();

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new ConvexError("Unauthorized: Only JointheQ team managers can perform this operation.");
  }

  return { user, page };
}

export const getJointheQAdminOverview = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    await verifyPageAdmin(ctx, args.pageId);

    const listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    const memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    const pageFollowers = await ctx.db
      .query("pageFollowers")
      .withIndex("by_page_user", (q) => q.eq("pageId", args.pageId))
      .collect();

    const activeMembers = memberships.filter((m) => m.status === "active");
    const renewalsDue = memberships.filter(
      (m) => m.status === "active" && (m.nextRenewalDate ?? 0) < Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    let totalCapacity = 0;
    let totalOccupied = 0;
    let monthlyRevenue = 0;

    for (const l of listings) {
      totalCapacity += l.totalCapacity;
    }
    for (const m of activeMembers) {
      totalOccupied += 1;
      monthlyRevenue += m.amount || 0;
    }

    return {
      totalPageFollowers: pageFollowers.length,
      totalActiveMemberships: activeMembers.length,
      totalSubscriptions: listings.length,
      totalCapacity,
      totalOccupied,
      totalAvailableSlots: Math.max(0, totalCapacity - totalOccupied),
      monthlyRevenue,
      renewalsDueCount: renewalsDue.length,
    };
  },
});

export const getJointheQMembershipsList = query({
  args: {
    pageId: v.id("pages"),
    status: v.optional(v.string()),
    subscriptionId: v.optional(v.id("subscriptionListings")),
  },
  handler: async (ctx, args) => {
    await verifyPageAdmin(ctx, args.pageId);

    let memberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    if (args.status && args.status !== "all") {
      memberships = memberships.filter((m) => m.status === args.status);
    }
    if (args.subscriptionId) {
      memberships = memberships.filter((m) => m.subscriptionId === args.subscriptionId);
    }

    const detailed = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        const sub = await ctx.db.get(m.subscriptionId);
        const slot = await ctx.db.get(m.slotId);
        return {
          ...m,
          memberUser: user ? { _id: user._id, name: user.name, username: user.username, email: user.email } : null,
          subscriptionName: sub?.name || "Unknown",
          slotNumber: slot?.slotNumber,
        };
      })
    );

    return detailed;
  },
});

export const updateSubscriptionListing = mutation({
  args: {
    listingId: v.id("subscriptionListings"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    defaultSlotPrice: v.optional(v.number()),
    active: v.optional(v.boolean()),
    memberInstructions: v.optional(v.string()),
    eligibilityRules: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    billingCycle: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("3_months"),
      v.literal("6_months"),
      v.literal("12_months")
    )),
    durationMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new ConvexError("Listing not found");

    const { user } = await verifyPageAdmin(ctx, listing.pageId);

    const { listingId, ...updates } = args;
    await ctx.db.patch(listingId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Record audit log
    await ctx.db.insert("subscriptionAuditLogs", {
      pageId: listing.pageId,
      subscriptionId: listingId,
      performedByUserId: user._id,
      action: "UPDATE_LISTING",
      details: `Updated listing ${listing.name}`,
      metadata: updates,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const createSubscriptionListing = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    platformName: v.string(),
    platformLogo: v.optional(v.string()),
    totalAccountCost: v.number(),
    defaultSlotPrice: v.number(),
    currency: v.string(),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("3_months"),
      v.literal("6_months"),
      v.literal("12_months")
    ),
    durationMonths: v.optional(v.number()),
    totalCapacity: v.number(),
    benefits: v.array(v.string()),
    memberInstructions: v.optional(v.string()),
    eligibilityRules: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await verifyPageAdmin(ctx, args.pageId);

    // Derive canonical durationMonths from billingCycle if not supplied
    const durationMonths = args.durationMonths ??
      (args.billingCycle === "3_months" || args.billingCycle === "quarterly" ? 3 :
       args.billingCycle === "6_months" ? 6 :
       args.billingCycle === "12_months" || args.billingCycle === "yearly" ? 12 : 1);

    const listingId = await ctx.db.insert("subscriptionListings", {
      pageId: args.pageId,
      name: args.name,
      description: args.description,
      category: args.category,
      platformName: args.platformName,
      platformLogo: args.platformLogo,
      totalAccountCost: args.totalAccountCost,
      defaultSlotPrice: args.defaultSlotPrice,
      currency: args.currency,
      billingCycle: args.billingCycle,
      durationMonths,
      totalCapacity: args.totalCapacity,
      allowDifferentSlotPrices: false,
      benefits: args.benefits,
      memberInstructions: args.memberInstructions,
      eligibilityRules: args.eligibilityRules,
      cancellationPolicy: args.cancellationPolicy,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create slots
    for (let i = 1; i <= args.totalCapacity; i++) {
      await ctx.db.insert("subscriptionSlots", {
        subscriptionId: listingId,
        pageId: args.pageId,
        slotNumber: i,
        status: "available",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("subscriptionAuditLogs", {
      pageId: args.pageId,
      subscriptionId: listingId,
      performedByUserId: user._id,
      action: "CREATE_LISTING",
      details: `Created new subscription listing: ${args.name}`,
      metadata: { capacity: args.totalCapacity, price: args.defaultSlotPrice },
      createdAt: Date.now(),
    });

    return listingId;
  },
});

// ─────────────────────────────────────────────────────────────
// 6. RENEWALS & CRON RECONCILIATION
// ─────────────────────────────────────────────────────────────

export const processDueRenewals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysAhead = now + 3 * 24 * 60 * 60 * 1000;

    const activeMemberships = await ctx.db
      .query("subscriptionMemberships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let reminders = 0;
    let expired = 0;
    for (const mem of activeMemberships) {
      const periodEnd = mem.currentPeriodEnd ?? mem.nextRenewalDate;
      if (!periodEnd) continue;
      if (periodEnd <= now) {
        await ctx.db.patch(mem._id, { status: "expired", autoRenew: false, updatedAt: now });
        const slot = await ctx.db.get(mem.slotId);
        if (slot?.currentMemberId === mem.userId) {
          await ctx.db.patch(slot._id, { status: "available", currentMemberId: undefined, reservedForUserId: undefined, reservationExpiresAt: undefined, updatedAt: now });
        }
        const subscription = await ctx.db.get(mem.subscriptionId);
        await createJointheQNotification(ctx, {
          recipientId: mem.userId, actorId: mem.userId, type: "subscription_payment_failed",
          targetExcerpt: `Your ${subscription?.name || "JointheQ"} membership expired. Rejoin to restore access.`,
        });
        expired += 1;
        continue;
      }
      if (periodEnd >= threeDaysAhead || mem.renewalReminderForPeriodEnd === periodEnd) continue;
      const sub = await ctx.db.get(mem.subscriptionId);
      await ctx.db.patch(mem._id, { renewalReminderForPeriodEnd: periodEnd, updatedAt: now });
      await createJointheQNotification(ctx, {
        recipientId: mem.userId,
        actorId: mem.userId,
        type: "subscription_renewal",
        targetExcerpt: `Your ${sub?.name || "JointheQ"} membership ends on ${new Date(periodEnd).toLocaleDateString()}. Renew manually by then to keep access; the current price is ₦${(mem.amount || 0).toLocaleString()}.`,
      });
      reminders += 1;
    }

    return { processedReminders: reminders, expiredMemberships: expired };
  },
});

// Helper utilities
function calculateBillingPeriodEnd(start: number, cycle: string, durationMonths?: number): number {
  const startDate = new Date(start);
  let monthsToAdd = 1;
  if (durationMonths && [3, 6, 12].includes(durationMonths)) {
    monthsToAdd = durationMonths;
  } else if (cycle === "3_months" || cycle === "quarterly") {
    monthsToAdd = 3;
  } else if (cycle === "6_months") {
    monthsToAdd = 6;
  } else if (cycle === "12_months" || cycle === "yearly") {
    monthsToAdd = 12;
  }
  const targetMonth = startDate.getMonth() + monthsToAdd;
  const targetYear = startDate.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const originalDay = startDate.getDate();
  const maxDaysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const targetDay = Math.min(originalDay, maxDaysInTargetMonth);
  const endDate = new Date(startDate);
  endDate.setFullYear(targetYear);
  endDate.setMonth(normalizedMonth);
  endDate.setDate(targetDay);
  return endDate.getTime();
}

async function createJointheQNotification(ctx: any, args: {
  recipientId: any;
  actorId: any;
  type: "subscription_joined" | "subscription_renewal" | "subscription_cancelled" | "subscription_payment_failed";
  targetExcerpt: string;
}) {
  const now = Date.now();
  await ctx.db.insert("notifications", {
    recipientId: args.recipientId,
    actorId: args.actorId,
    type: args.type,
    targetExcerpt: args.targetExcerpt,
    isRead: false,
    createdAt: now,
  });

  try {
    await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
      recipientId: args.recipientId,
      title: "JointheQ Subscription",
      body: args.targetExcerpt,
      url: "/app?tab=notifications",
    });
  } catch (e) {
    // Gracefully handle push dispatch errors
  }
}

// ─────────────────────────────────────────────────────────────
// 7. BACKWARDS COMPATIBILITY FOR EXISTING MODALS
// ─────────────────────────────────────────────────────────────

export const getPageSubscriptions = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("subscriptionListings")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const result = await Promise.all(
      listings.map(async (listing) => {
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", listing._id))
          .collect();

        const occupied = slots.filter((s) => s.status === "occupied").length;
        return {
          ...listing,
          slotsCount: slots.length,
          availableSlots: Math.max(0, slots.length - occupied),
        };
      })
    );
    return result;
  },
});

// Export alias matching CRM and previous schemas
export const getCRMData = getJointheQAdminOverview;
export const cancelMembership = cancelSubscriptionRenewal;
export const joinSlot = joinViaWallet;

