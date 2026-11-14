import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserByAuthIdentity } from "./lib/authIdentity";
import { requireAdmin } from "./admin";

const DEFAULT_GIFTS = [
  ["teddy_bear", "Teddy Bear", "Everyday", "🧸", 50, false],
  ["rose", "Rose", "Everyday", "🌹", 25, false],
  ["heart", "Heart", "Everyday", "💜", 30, false],
  ["bouquet", "Flower Bouquet", "Everyday", "💐", 100, false],
  ["chocolate", "Chocolate", "Everyday", "🍫", 75, false],
  ["diamond", "Diamond", "Premium", "💎", 500, true],
  ["crown", "Crown", "Premium", "👑", 750, true],
  ["trophy", "Trophy", "Premium", "🏆", 1000, true],
  ["rocket", "Rocket", "Premium", "🚀", 1500, true],
  ["golden_star", "Golden Star", "Premium", "⭐", 250, true],
] as const;

const DEFAULT_POLICY = { recipientPercent: 80, settlementHours: 24 };

async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const user = await getUserByAuthIdentity(ctx, identity);
  if (!user) throw new Error("User not found");
  return user;
}

async function isRoomMember(ctx: any, room: any, userId: any) {
  if (room.creatorId === userId || room.memberIds?.some((memberId: any) => memberId === userId)) return true;
  return Boolean(await ctx.db.query("groupMembers").withIndex("by_group_user", (q: any) => q.eq("groupId", room._id).eq("userId", userId)).first());
}

async function loadGiftPolicy(ctx: any) {
  const record = await ctx.db.query("platformSettings").withIndex("by_key", (q: any) => q.eq("key", "gift_revenue_policy")).first();
  if (!record) return DEFAULT_POLICY;
  try {
    const parsed = JSON.parse(record.value);
    const recipientPercent = Number(parsed.recipientPercent);
    const settlementHours = Number(parsed.settlementHours);
    if (recipientPercent >= 0 && recipientPercent <= 100 && settlementHours >= 0 && settlementHours <= 720) {
      return { recipientPercent, settlementHours };
    }
  } catch {}
  return DEFAULT_POLICY;
}

export const ensureGiftCatalogue = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthedUser(ctx);
    const now = Date.now();
    let created = 0;
    for (const [code, name, category, imageUrl, priceCredits, isPremium] of DEFAULT_GIFTS) {
      const existing = await ctx.db.query("virtualGifts").withIndex("by_code", (q: any) => q.eq("code", code)).first();
      if (!existing) {
        await ctx.db.insert("virtualGifts", { code, name, category, imageUrl, animation: isPremium ? "celebration" : "float", priceCredits, isPremium, isActive: true, createdAt: now, updatedAt: now });
        created++;
      }
    }
    return { created };
  },
});

export const getActiveGifts = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("virtualGifts").withIndex("by_active", (q: any) => q.eq("isActive", true)).collect(),
});

export const getRoomGiftEvents = query({
  args: { roomId: v.id("groupChats") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room?.isChatroom || !(await isRoomMember(ctx, room, user._id))) return [];
    const events = await ctx.db.query("roomGiftEvents").withIndex("by_room_created", (q: any) => q.eq("roomId", args.roomId)).order("desc").take(12);
    return await Promise.all(events.reverse().map(async (event: any) => ({ ...event, sender: await ctx.db.get(event.senderId), recipient: await ctx.db.get(event.recipientId) })));
  },
});

export const getRoomGiftLeaderboard = query({
  args: { roomId: v.id("groupChats") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room?.isChatroom || !(await isRoomMember(ctx, room, user._id))) return [];
    const transactions = await ctx.db.query("giftTransactions").withIndex("by_room_created", (q: any) => q.eq("roomId", args.roomId)).order("desc").take(250);
    const totals = new Map<string, { userId: any; total: number; count: number }>();
    for (const transaction of transactions) {
      if (transaction.status !== "completed") continue;
      const current = totals.get(String(transaction.recipientId)) || { userId: transaction.recipientId, total: 0, count: 0 };
      current.total += transaction.giftPriceCredits;
      current.count++;
      totals.set(String(transaction.recipientId), current);
    }
    return await Promise.all([...totals.values()].sort((a, b) => b.total - a.total).slice(0, 5).map(async (entry) => ({ ...entry, user: await ctx.db.get(entry.userId) })));
  },
});

export const sendGift = mutation({
  args: { roomId: v.id("groupChats"), recipientId: v.id("users"), giftId: v.id("virtualGifts"), requestId: v.string(), pin: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const sender = await getAuthedUser(ctx);
    if (args.requestId.trim().length < 12 || args.requestId.length > 160) throw new Error("Invalid gift request.");
    const existing = await ctx.db.query("giftTransactions").withIndex("by_request", (q: any) => q.eq("requestId", args.requestId)).first();
    if (existing) return { success: true, duplicate: true, transactionId: existing._id };
    if (sender._id === args.recipientId) throw new Error("You cannot send a gift to yourself.");

    const room = await ctx.db.get(args.roomId);
    const recipient = await ctx.db.get(args.recipientId);
    const gift = await ctx.db.get(args.giftId);
    if (!room?.isChatroom || room.chatroomStatus === "inactive") throw new Error("This room is unavailable for gifts.");
    if (!recipient || !(await isRoomMember(ctx, room, sender._id)) || !(await isRoomMember(ctx, room, recipient._id))) throw new Error("Gifts can only be sent to room participants.");
    if (!gift?.isActive || gift.priceCredits <= 0) throw new Error("This gift is no longer available.");

    const now = Date.now();
    const recent = await ctx.db.query("giftTransactions").withIndex("by_sender", (q: any) => q.eq("senderId", sender._id)).order("desc").take(20);
    if (recent.filter((transaction: any) => transaction.createdAt > now - 60_000).length >= 10) throw new Error("Please wait a moment before sending more gifts.");

    const senderWallet = await ctx.db.query("userWallets").withIndex("by_user", (q: any) => q.eq("userId", sender._id)).first();
    if (!senderWallet || senderWallet.balance < gift.priceCredits) throw new Error("Insufficient LaLao Wallet balance. Fund your wallet to send this gift.");
    if (senderWallet.walletPin && senderWallet.walletPin !== args.pin) throw new Error("Enter your wallet PIN to send this gift.");

    const policy = await loadGiftPolicy(ctx);
    const recipientEarningsCredits = Math.floor(gift.priceCredits * policy.recipientPercent / 100);
    const platformCommissionCredits = gift.priceCredits - recipientEarningsCredits;
    const senderBalance = senderWallet.balance - gift.priceCredits;
    await ctx.db.patch(senderWallet._id, { balance: senderBalance, updatedAt: now });
    const senderWalletTransactionId = await ctx.db.insert("walletTransactions", {
      walletId: senderWallet._id, userId: sender._id, relatedUserId: recipient._id, relatedUserName: recipient.name || recipient.username || "Room member", relatedUserUsername: recipient.username,
      amount: gift.priceCredits, fee: 0, currency: "LC", assetType: "LALAO_CREDITS", paymentProvider: "internal", type: "gift_sent", status: "completed",
      description: `Sent ${gift.name} to ${recipient.name || recipient.username || "a room member"}`, reference: `GIFT_${args.requestId}`, metadata: { roomId: args.roomId, giftId: gift._id }, createdAt: now,
    });
    const transactionId = await ctx.db.insert("giftTransactions", {
      requestId: args.requestId, senderId: sender._id, recipientId: recipient._id, roomId: args.roomId, giftId: gift._id, giftName: gift.name, giftPriceCredits: gift.priceCredits,
      recipientEarningsCredits, platformCommissionCredits, status: "completed", senderWalletTransactionId, createdAt: now, settledAt: now,
    });
    await ctx.db.insert("giftEarnings", { giftTransactionId: transactionId, recipientId: recipient._id, amountCredits: recipientEarningsCredits, status: "pending", availableAt: now + policy.settlementHours * 3_600_000, createdAt: now });
    await ctx.db.insert("roomGiftEvents", { giftTransactionId: transactionId, roomId: args.roomId, senderId: sender._id, recipientId: recipient._id, giftName: gift.name, imageUrl: gift.imageUrl, animation: gift.animation, isPremium: gift.isPremium, createdAt: now });
    await ctx.db.insert("notifications", { recipientId: recipient._id, actorId: sender._id, type: "gift_received", targetExcerpt: `${sender.name || sender.username || "Someone"} sent you a ${gift.name} in ${room.name}.`, isRead: false, createdAt: now });
    return { success: true, transactionId, newBalance: senderBalance, recipientEarningsCredits };
  },
});

export const releaseEligibleGiftEarnings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const earnings = await ctx.db.query("giftEarnings").withIndex("by_status_available", (q: any) => q.eq("status", "pending").lte("availableAt", now)).collect();
    for (const earning of earnings) await ctx.db.patch(earning._id, { status: "available" });
    return { released: earnings.length };
  },
});

export const claimGiftEarnings = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    const earnings = await ctx.db.query("giftEarnings").withIndex("by_recipient_status", (q: any) => q.eq("recipientId", user._id).eq("status", "available")).collect();
    const amount = earnings.reduce((total: number, earning: any) => total + earning.amountCredits, 0);
    if (amount <= 0) return { claimed: 0, newBalance: null };
    let wallet = await ctx.db.query("userWallets").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
    const now = Date.now();
    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", { userId: user._id, balance: 0, currency: "LC", accountName: user.name || "LaLao User", bankName: "LaLao Platform", updatedAt: now });
      wallet = await ctx.db.get(walletId);
    }
    if (!wallet) throw new Error("Could not initialize wallet.");
    const newBalance = wallet.balance + amount;
    await ctx.db.patch(wallet._id, { balance: newBalance, updatedAt: now });
    for (const earning of earnings) {
      const walletTransactionId = await ctx.db.insert("walletTransactions", { walletId: wallet._id, userId: user._id, amount: earning.amountCredits, fee: 0, currency: "LC", assetType: "LALAO_CREDITS", paymentProvider: "internal", type: "gift_earnings", status: "completed", description: "Claimed settled room gift earnings", reference: `GIFT_EARNING_${earning._id}`, metadata: { giftTransactionId: earning.giftTransactionId }, createdAt: now });
      await ctx.db.patch(earning._id, { status: "claimed", claimedAt: now, walletTransactionId });
    }
    return { claimed: amount, newBalance };
  },
});

export const getMyGiftDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    const [sent, received, pending, available, claimed] = await Promise.all([
      ctx.db.query("giftTransactions").withIndex("by_sender", (q: any) => q.eq("senderId", user._id)).order("desc").take(50),
      ctx.db.query("giftTransactions").withIndex("by_recipient", (q: any) => q.eq("recipientId", user._id)).order("desc").take(50),
      ctx.db.query("giftEarnings").withIndex("by_recipient_status", (q: any) => q.eq("recipientId", user._id).eq("status", "pending")).collect(),
      ctx.db.query("giftEarnings").withIndex("by_recipient_status", (q: any) => q.eq("recipientId", user._id).eq("status", "available")).collect(),
      ctx.db.query("giftEarnings").withIndex("by_recipient_status", (q: any) => q.eq("recipientId", user._id).eq("status", "claimed")).collect(),
    ]);
    return { sent, received, pendingEarnings: pending.reduce((sum: number, entry: any) => sum + entry.amountCredits, 0), availableEarnings: available.reduce((sum: number, entry: any) => sum + entry.amountCredits, 0), claimedEarnings: claimed.reduce((sum: number, entry: any) => sum + entry.amountCredits, 0) };
  },
});

export const getGiftPolicy = query({ args: {}, handler: async (ctx) => await loadGiftPolicy(ctx) });

export const adminUpsertGift = mutation({
  args: { giftId: v.optional(v.id("virtualGifts")), code: v.string(), name: v.string(), category: v.string(), imageUrl: v.optional(v.string()), animation: v.string(), priceCredits: v.number(), isPremium: v.boolean(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!args.code.trim() || !args.name.trim() || args.priceCredits <= 0 || !Number.isSafeInteger(args.priceCredits)) throw new Error("Enter a valid gift and whole-credit price.");
    const now = Date.now();
    const giftValues = { code: args.code.trim().toLowerCase(), name: args.name.trim(), category: args.category.trim(), imageUrl: args.imageUrl, animation: args.animation, priceCredits: args.priceCredits, isPremium: args.isPremium, isActive: args.isActive };
    if (args.giftId) {
      const existing = await ctx.db.get(args.giftId);
      if (!existing) throw new Error("Gift not found.");
      await ctx.db.patch(args.giftId, { ...giftValues, updatedAt: now });
      await ctx.db.insert("auditLog", { actorId: admin._id, action: "updated_virtual_gift", target: String(args.giftId), before: JSON.stringify(existing), after: JSON.stringify(args), createdAt: now });
      return args.giftId;
    }
    const duplicate = await ctx.db.query("virtualGifts").withIndex("by_code", (q: any) => q.eq("code", giftValues.code)).first();
    if (duplicate) throw new Error("A gift with that code already exists.");
    const giftId = await ctx.db.insert("virtualGifts", { ...giftValues, createdBy: admin._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("auditLog", { actorId: admin._id, action: "created_virtual_gift", target: String(giftId), after: JSON.stringify(args), createdAt: now });
    return giftId;
  },
});

export const adminUpdateGiftPolicy = mutation({
  args: { recipientPercent: v.number(), settlementHours: v.number() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.recipientPercent < 0 || args.recipientPercent > 100 || args.settlementHours < 0 || args.settlementHours > 720) throw new Error("Invalid gift revenue policy.");
    const now = Date.now();
    const value = JSON.stringify(args);
    const record = await ctx.db.query("platformSettings").withIndex("by_key", (q: any) => q.eq("key", "gift_revenue_policy")).first();
    if (record) await ctx.db.patch(record._id, { value, updatedAt: now, updatedBy: admin._id });
    else await ctx.db.insert("platformSettings", { key: "gift_revenue_policy", value, updatedAt: now, updatedBy: admin._id });
    await ctx.db.insert("auditLog", { actorId: admin._id, action: "updated_gift_revenue_policy", target: "platformSettings:gift_revenue_policy", before: record?.value, after: value, createdAt: now });
  },
});
