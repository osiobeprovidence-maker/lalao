import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getUserByIdentity = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.tokenIdentifier))
      .first();
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

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return null;

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return wallet;
  },
});

export const initializeWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

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
    // Only allow for internal mock/dev testing if we keep it.
    // In production, we shouldn't use this for Paystack anymore.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

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
  },
  handler: async (ctx, args) => {
    const txId = await ctx.db.insert("walletTransactions", {
      walletId: args.walletId,
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      status: "pending",
      paymentProvider: "paystack",
      reference: args.reference,
      description: `Wallet funded via Paystack`,
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(internal.wallet.getUserByIdentity, { tokenIdentifier: identity.tokenIdentifier });
    if (!user) throw new Error("User not found");

    const wallet = await ctx.runQuery(internal.wallet.getWalletByUserId, { userId: user._id });
    if (!wallet) throw new Error("Wallet not found");

    await ctx.runMutation(internal.wallet.createPendingFunding, {
      amount: args.amount,
      reference: args.reference,
      userId: user._id,
      walletId: wallet._id,
    });

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured");
    
    // The amount to send to paystack is in kobo
    const amountKobo = Math.round(args.amount * 100);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/payments/paystack/callback`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email || 'user@lalao.app',
        amount: amountKobo,
        reference: args.reference,
        currency: "NGN",
        callback_url: callbackUrl,
        metadata: {
          userId: user._id,
          type: "wallet_funding",
          fundingReference: args.reference
        }
      })
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(`Paystack initialization failed: ${data.message}`);
    }

    return { 
      success: true, 
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference
    };
  }
});

export const settleWalletFunding = internalMutation({
  args: {
    reference: v.string(),
    paystackAmount: v.number(), // The amount confirmed by paystack API in regular currency (not kobo)
    paystackTransactionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // 1. Find the pending transaction
    // Note: 'reference' isn't indexed, so we do a full filter for now, or just index it later.
    // It's safer to index it, but we can just query all pending deposits from this user or just filter all.
    const pendingTx = await ctx.db
      .query("walletTransactions")
      .filter(q => q.eq(q.field("reference"), args.reference))
      .first();

    if (!pendingTx) throw new Error("Funding transaction not found");

    if (pendingTx.status === "completed") {
      // Idempotency: already settled
      return { success: true, alreadySettled: true, amount: pendingTx.amount };
    }

    if (pendingTx.status !== "pending") {
      throw new Error(`Transaction is in status: ${pendingTx.status}`);
    }

    if (pendingTx.amount !== args.paystackAmount) {
      throw new Error(`Amount mismatch. Expected ${pendingTx.amount}, got ${args.paystackAmount}`);
    }

    const wallet = await ctx.db.get(pendingTx.walletId);
    if (!wallet) throw new Error("Wallet not found");

    // 2. Credit ledger (update the transaction to completed)
    await ctx.db.patch(pendingTx._id, {
      status: "completed",
      providerTransactionId: args.paystackTransactionId
    });

    // 3. Update available balance
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + pendingTx.amount,
      updatedAt: Date.now()
    });

    return { success: true, newBalance: wallet.balance + pendingTx.amount };
  }
});

export const verifyPaystackFunding = action({
  args: {
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify with Paystack API
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured");

    const res = await fetch(`https://api.paystack.co/transaction/verify/${args.reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();
    
    if (data.status !== true || data.data.status !== "success") {
      // Could handle failed, abandoned, reversed here by calling an internalMutation to update status
      return { success: false, status: data.data?.status || "failed" };
    }

    // Verify currency
    if (data.data.currency !== "NGN") {
      return { success: false, message: "Invalid currency" };
    }

    const paystackAmountNGN = data.data.amount / 100;

    // Call idempotent settlement mutation
    const result = await ctx.runMutation(internal.wallet.settleWalletFunding, {
      reference: args.reference,
      paystackAmount: paystackAmountNGN,
      paystackTransactionId: data.data.id?.toString()
    });

    return result;
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
      type: "transfer_in",
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
