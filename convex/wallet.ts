import { getUserByAuthIdentity, getUserByTokenIdentifier } from "./lib/authIdentity";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

export const getUserByIdentity = internalQuery({
  args: { 
    tokenIdentifier: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      const norm = ctx.db.normalizeId("users", args.userId);
      if (norm) {
        const byId = await ctx.db.get(norm);
        if (byId) return byId;
      }
    }
    if (args.tokenIdentifier) {
      const byToken = await getUserByTokenIdentifier(ctx, args.tokenIdentifier!);
      if (byToken) return byToken;
    }
    return null;
  }
});

export const getOrCreateUserWallet = internalMutation({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: args.userId,
        balance: 0,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: args.userName || "Lalao User",
        bankName: "LaLao Platform",
        updatedAt: Date.now(),
      });
      wallet = await ctx.db.get(walletId);
    }
    return wallet;
  }
});

export const getWalletByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  }
});

// Create or get user's wallet
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return null;

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) return null;

    return {
      ...wallet,
      hasPin: Boolean(wallet.walletPin && wallet.walletPin.length === 4),
      walletPin: undefined, // Never expose raw or hashed PIN to client
    };
  },
});

export const setWalletPin = mutation({
  args: {
    pin: v.string(),
    oldPin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    if (!/^\d{4}$/.test(args.pin)) {
      throw new Error("PIN must be exactly 4 numeric digits.");
    }

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) throw new Error("User not found");

    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: user._id,
        balance: 0,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: user.name || "Lalao User",
        bankName: "LaLao Platform",
        walletPin: args.pin,
        updatedAt: Date.now(),
      });
      return { success: true, message: "Wallet PIN created successfully." };
    }

    // If wallet already has a PIN, verify the old PIN before changing
    if (wallet.walletPin && wallet.walletPin.length === 4) {
      if (!args.oldPin || args.oldPin !== wallet.walletPin) {
        throw new Error("Incorrect current PIN.");
      }
    }

    await ctx.db.patch(wallet._id, {
      walletPin: args.pin,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Wallet PIN updated successfully." };
  },
});

export const storePinResetOtp = internalMutation({
  args: {
    userId: v.id("users"),
    otp: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: args.userId,
        balance: 0,
        currency: "LC",
        pinResetOtp: args.otp,
        pinResetExpiresAt: args.expiresAt,
        updatedAt: Date.now(),
      });
      return walletId;
    }

    await ctx.db.patch(wallet._id, {
      pinResetOtp: args.otp,
      pinResetExpiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });

    return wallet._id;
  },
});

export const requestPinResetOtp = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user: any = await ctx.runQuery(internal.wallet.getUserByIdentity, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User profile not found.");

    const email = user.email || identity.email;
    if (!email) {
      throw new Error("No verified email address associated with your account.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await ctx.runMutation(internal.wallet.storePinResetOtp, {
      userId: user._id,
      otp,
      expiresAt,
    });

    // Send via Resend
    const res: any = await ctx.runAction(api.emails.sendOtpEmail, {
      to: email,
      otp,
      purpose: "reset your transaction security PIN",
    });

    return {
      success: true,
      email: email.replace(/(.{2})(.*)(?=@)/, (_gp: string, a: string, b: string) => a + "*".repeat(b.length)),
      mock: res?.mock,
    };
  },
});

export const resetWalletPinWithOtp = mutation({
  args: {
    otp: v.string(),
    newPin: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    if (!/^\d{4}$/.test(args.newPin)) {
      throw new Error("PIN must be exactly 4 numeric digits.");
    }

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) throw new Error("Wallet not found");

    if (!wallet.pinResetOtp || !wallet.pinResetExpiresAt || Date.now() > wallet.pinResetExpiresAt) {
      throw new Error("Verification code has expired. Please request a new code.");
    }

    if (wallet.pinResetOtp.trim() !== args.otp.trim()) {
      throw new Error("Invalid verification code. Please check your email and try again.");
    }

    await ctx.db.patch(wallet._id, {
      walletPin: args.newPin,
      pinResetOtp: undefined,
      pinResetExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Your transaction PIN has been successfully reset!" };
  },
});

export const initializeWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) throw new Error("User not found");

    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: user._id,
        balance: 0,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: user.name || "Lalao User",
        bankName: "LaLao Platform",
        updatedAt: Date.now(),
      });
      wallet = await ctx.db.get(walletId);
    }
    return wallet;
  },
});

// Top up wallet (legacy mock)
export const topUp = mutation({
  args: {
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserByAuthIdentity(ctx, identity);

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) throw new Error("Wallet not found. Please initialize wallet first.");

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: args.amount,
      type: "deposit",
      status: "completed",
      description: `Wallet Top-Up via ${args.method}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance: wallet.balance + args.amount };
  },
});

export const createPendingFunding = internalMutation({
  args: {
    amount: v.number(),
    reference: v.string(),
    userId: v.id("users"),
    walletId: v.id("userWallets"),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if reference already exists (prevent duplicate pending records)
    const existing = await ctx.db
      .query("walletTransactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (existing) {
      return existing._id;
    }

    const providerName = args.provider || "bachs";
    const providerLabel = providerName === "bachs" ? "Batch" : "external payment provider";

    const txId = await ctx.db.insert("walletTransactions", {
      walletId: args.walletId,
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      status: "pending",
      paymentProvider: providerName,
      reference: args.reference,
      description: `Wallet funded via ${providerLabel} (₦${args.amount.toLocaleString()} -> ${args.amount.toLocaleString()} LC)`,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      createdAt: Date.now(),
    });
    return txId;
  }
});

export const initializeFunding = action({
  args: {
    amount: v.number(),
    reference: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Forward to BACHS funding flow
    return await ctx.runAction(api.bachs.initializeBachsFunding, {
      amount: args.amount,
      reference: args.reference,
      userId: args.userId,
    });
  }
});

export const settleWalletFunding = internalMutation({
  args: {
    reference: v.string(),
    verifiedAmount: v.number(), // Server-verified amount in NGN
    providerTransactionId: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Find the pending transaction using the indexed 'by_reference'
    const pendingTx = await ctx.db
      .query("walletTransactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();

    if (!pendingTx) throw new Error(`Funding transaction with reference ${args.reference} not found.`);

    if (pendingTx.status === "completed") {
      // Idempotency: already settled once, do not double-credit wallet
      return { success: true, alreadySettled: true, amount: pendingTx.amount };
    }

    if (pendingTx.status !== "pending") {
      throw new Error(`Transaction is already in status: ${pendingTx.status}`);
    }

    const settledAmount = args.verifiedAmount;
    if (!Number.isFinite(settledAmount)) {
      throw new Error("Payment verification amount is missing or invalid.");
    }

    if (pendingTx.amount !== settledAmount) {
      throw new Error(`Amount mismatch. Expected ${pendingTx.amount} NGN, but provider verified ${settledAmount} NGN.`);
    }

    const wallet = await ctx.db.get(pendingTx.walletId);
    if (!wallet) throw new Error("Wallet not found.");

    const finalTxId = args.providerTransactionId;
    const finalProvider = args.provider || pendingTx.paymentProvider || "bachs";

    // 2. Mark transaction as completed with provider transaction ID
    await ctx.db.patch(pendingTx._id, {
      status: "completed",
      providerTransactionId: finalTxId,
      paymentProvider: finalProvider,
    });

    // 3. Atomically update user's wallet balance
    const updatedBalance = wallet.balance + pendingTx.amount;
    await ctx.db.patch(wallet._id, {
      balance: updatedBalance,
      updatedAt: Date.now()
    });

    // A wallet top-up may be the configured referral qualification event.
    try {
      await ctx.runMutation(internal.rewards.qualifyReferralAfterEvent, {
        referredUserId: pendingTx.userId,
        trigger: "wallet_topup",
      });
    } catch (err) {
      console.error("Failed to qualify referral for wallet top-up", args.reference, err);
    }

    return { success: true, newBalance: updatedBalance };
  }
});

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return null;

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return transactions;
  },
});

export const transferCredits = mutation({
  args: {
    amount: v.number(),
    recipientPageId: v.id("pages"),
    pin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!sender) throw new Error("User not found");

    const recipientPage = await ctx.db.get(args.recipientPageId);
    if (!recipientPage) throw new Error("Recipient business not found");

    if (recipientPage.type !== "business") {
      throw new Error("LaLao Credits cannot be transferred to personal accounts.");
    }
    
    // In a real app we might verify business.acceptsLaLaoCredits here.

    if (sender._id === recipientPage.ownerId) throw new Error("Cannot transfer to your own business");

    const senderWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", sender._id))
      .first();

    if (!senderWallet || senderWallet.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    // Validate PIN if wallet has a configured PIN
    if (senderWallet.walletPin) {
      if (!args.pin || args.pin !== senderWallet.walletPin) {
        throw new Error("Incorrect wallet security PIN.");
      }
    }

    const recipientOwner = await ctx.db.get(recipientPage.ownerId);
    
    let recipientWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", recipientPage.ownerId))
      .first();

    if (!recipientWallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: recipientPage.ownerId,
        balance: 0,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: recipientOwner?.name || "Business Owner",
        bankName: "LaLao Platform",
        updatedAt: Date.now(),
      });
      recipientWallet = await ctx.db.get(walletId);
    }

    if (!recipientWallet) {
      throw new Error("Recipient wallet could not be found or initialized.");
    }
    
    await ctx.db.patch(senderWallet._id, {
      balance: senderWallet.balance - args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(recipientWallet._id, {
      balance: recipientWallet.balance + args.amount,
      updatedAt: Date.now(),
    });

    const txId = `TXN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const senderTx = await ctx.db.insert("walletTransactions", {
      walletId: senderWallet._id,
      userId: sender._id,
      relatedUserId: recipientOwner?._id, // Owner of business
      relatedUserName: recipientPage.name, // Business name
      relatedUserUsername: recipientPage.username,
      amount: args.amount,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "transfer_out",
      status: "completed",
      description: `Payment to Partner Business`,
      reference: txId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      walletId: recipientWallet._id,
      userId: recipientPage.ownerId,
      relatedUserId: sender._id,
      relatedUserName: sender.name || "Unknown",
      relatedUserUsername: sender.username || "unknown",
      amount: args.amount,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "deposit",
      status: "completed",
      description: `Payment from ${sender.name || sender.username}`,
      reference: txId,
      createdAt: Date.now(),
    });

    const finalTx = await ctx.db.get(senderTx);
    return { success: true, newBalance: senderWallet.balance - args.amount, transaction: finalTx };
  },
});

export const transferCrypto = mutation({
  args: {
    amount: v.number(),
    recipientId: v.id("users"), // Crypto can be P2P
    cryptoSymbol: v.string(), // e.g. "USDC", "ETH"
    blockchainNetwork: v.string(), // e.g. "Polygon"
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!sender) throw new Error("User not found");
    
    const recipient = await ctx.db.get(args.recipientId);
    if (!recipient) throw new Error("Recipient not found");

    const senderWallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", sender._id))
      .first();
      
    if(!senderWallet) throw new Error("Wallet not initialized");

    // In a real app we don't modify local balance for external crypto, we just log the transaction.
    const senderTx = await ctx.db.insert("walletTransactions", {
      walletId: senderWallet._id,
      userId: sender._id,
      relatedUserId: recipient._id,
      relatedUserName: recipient.name || "Unknown",
      relatedUserUsername: recipient.username || "unknown",
      amount: args.amount,
      fee: 0,
      currency: args.cryptoSymbol,
      assetType: "CRYPTO",
      blockchainNetwork: args.blockchainNetwork,
      transactionHash: args.txHash,
      type: "transfer_out",
      status: "completed",
      description: `Payment to @${recipient.username}`,
      reference: args.txHash,
      createdAt: Date.now(),
    });

    const finalTx = await ctx.db.get(senderTx);
    return { success: true, transaction: finalTx };
  }
});
