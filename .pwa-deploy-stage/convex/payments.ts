import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthedUser } from "./social";

export type PaymentCategoryType = "airtime" | "data" | "pages" | "gifts" | "wallet" | "other";
export type PaymentStatusType = "completed" | "pending" | "failed" | "refunded" | "cancelled";

/**
 * Mask phone numbers for privacy (e.g., 08012345678 -> 080****5678)
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.length <= 6) return cleaned;
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-4);
  return `${start}****${end}`;
}

/**
 * Clean reference to receipt format
 */
export function formatReceiptNumber(ref: string): string {
  const clean = ref.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const suffix = clean.length > 8 ? clean.slice(-8) : clean.padStart(8, "0");
  return `REC-${suffix}`;
}

/**
 * Query user's complete, authenticated payment history with filtering and search
 */
export const getPaymentHistory = query({
  args: {
    type: v.optional(v.string()), // 'all' | 'airtime' | 'pages' | 'gifts' | 'wallet' | 'other'
    status: v.optional(v.string()), // 'all' | 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled'
    dateRange: v.optional(v.string()), // 'all' | 'today' | 'week' | 'month'
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) {
      return {
        transactions: [],
        totalCount: 0,
        summary: { totalSpent: 0, totalFunded: 0 },
      };
    }

    // 1. Fetch wallet transactions for authenticated user
    const walletTxList = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    // 2. Fetch market transactions for authenticated user to ensure cross-correlation
    const marketTxList = await ctx.db
      .query("marketTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    // Create lookup map for market transactions by requestId or totalAmount
    const marketByReqId = new Map<string, any>();
    for (const m of marketTxList) {
      marketByReqId.set(m.requestId, m);
    }

    const processedReferences = new Set<string>();
    const normalized: any[] = [];

    // Process wallet transactions
    for (const w of walletTxList) {
      const ref = w.reference || `TXN-${w._id.slice(-8).toUpperCase()}`;
      processedReferences.add(ref);

      // Determine category and details
      let category: PaymentCategoryType = "other";
      let title = w.description;
      let subtitle: string | undefined = undefined;
      let iconType = "credit-card";
      let provider = w.paymentProvider || "Lala";
      let recipientName: string | undefined = w.relatedUserName;
      let recipientAvatar: string | undefined = undefined;
      let recipientSubtitle: string | undefined = w.relatedUserUsername ? `@${w.relatedUserUsername}` : undefined;
      let phoneMasked: string | undefined = undefined;
      let network: string | undefined = undefined;
      let isDebit = true;

      // Check if this corresponds to a market VTU purchase
      let correlatedMarket = w.reference ? marketByReqId.get(w.reference) : undefined;
      if (!correlatedMarket && (w.type === "MARKET_PURCHASE" || w.type === "MARKET_REFUND")) {
        // Try finding by created time proximity or matching amount
        correlatedMarket = marketTxList.find(
          (m) => Math.abs(m.createdAt - w.createdAt) < 5000 && m.totalAmount === w.amount
        );
      }

      const descLower = (w.description || "").toLowerCase();

      if (w.type === "deposit") {
        category = "wallet";
        isDebit = false;
        title = "Wallet Top-up";
        subtitle = w.paymentProvider ? `via ${w.paymentProvider.toUpperCase()}` : "Funded via Paystack";
        provider = w.paymentProvider ? w.paymentProvider.toUpperCase() : "Paystack";
        iconType = "wallet";
      } else if (w.type === "MARKET_REFUND" || descLower.includes("refund")) {
        category = "other";
        isDebit = false;
        title = "Provider Refund";
        subtitle = w.description;
        iconType = "rotate-ccw";
      } else if (w.type === "MARKET_PURCHASE" || descLower.includes("airtime") || descLower.includes("data") || correlatedMarket) {
        const isAirtime = descLower.includes("airtime") || correlatedMarket?.category === "AIRTIME";
        const isData = descLower.includes("data") || correlatedMarket?.category === "DATA";

        if (isAirtime) {
          category = "airtime";
          iconType = "smartphone";
        } else if (isData) {
          category = "airtime"; // grouped under airtime/VTU
          iconType = "wifi";
        } else {
          category = "other";
          iconType = "zap";
        }

        network = correlatedMarket?.network || (descLower.includes("mtn") ? "MTN" : descLower.includes("airtel") ? "Airtel" : descLower.includes("glo") ? "Glo" : descLower.includes("9mobile") ? "9mobile" : undefined);
        const rawPhone = correlatedMarket?.recipient || correlatedMarket?.phone || w.description.match(/(?:0|\+?234)[789][01]\d{8}/)?.[0];
        phoneMasked = maskPhoneNumber(rawPhone);

        title = `${network || "Mobile"} ${isData ? "Data" : isAirtime ? "Airtime" : "VTU Service"}`;
        subtitle = phoneMasked ? `To ${phoneMasked}` : (correlatedMarket?.productName || w.description);
        provider = network || "VTU Network";
      } else if (descLower.includes("gift") || w.type === "gift_sent") {
        category = "gifts";
        title = "Gift Sent";
        subtitle = w.relatedUserName ? `To ${w.relatedUserName}` : "Plum Virtual Gift";
        recipientName = w.relatedUserName || "User";
        iconType = "gift";
        if (w.relatedUserId) {
          const recUser = await ctx.db.get(w.relatedUserId);
          if (recUser) {
            recipientAvatar = (recUser as any).avatarUrl || (recUser as any).avatar;
            recipientName = recUser.name || recipientName;
            recipientSubtitle = recUser.username ? `@${recUser.username}` : recipientSubtitle;
          }
        }
      } else if (w.type === "subscription_payment" || descLower.includes("jointheq") || descLower.includes("subscription")) {
        category = "pages";
        title = "Page Subscription";
        subtitle = w.description;
        iconType = "building";
        if (w.relatedPageId) {
          const page = await ctx.db.get(w.relatedPageId);
          if (page) {
            recipientName = page.name;
            recipientAvatar = page.avatar;
            recipientSubtitle = page.category || (page.username ? `@${page.username}` : undefined);
          }
        }
      } else if (w.type === "transfer_out" || w.type === "page_payment" || descLower.includes("partner business")) {
        category = "pages";
        title = "Payment to Page";
        subtitle = w.relatedUserName ? `To ${w.relatedUserName}` : w.description;
        recipientName = w.relatedUserName || "Partner Page";
        iconType = "building";
        if (w.relatedPageId) {
          const page = await ctx.db.get(w.relatedPageId);
          if (page) {
            recipientAvatar = page.avatar;
            recipientName = page.name || recipientName;
            recipientSubtitle = page.category;
          }
        }
      }

      // Map status
      let mappedStatus: PaymentStatusType = "completed";
      if (w.status === "failed") mappedStatus = "failed";
      else if (w.status === "pending" || w.status === "processing") mappedStatus = "pending";
      else if (w.status === "refunded" || w.status === "reversed") mappedStatus = "refunded";
      else if (w.status === "cancelled") mappedStatus = "cancelled";

      const receiptNumber = w.receiptNumber || formatReceiptNumber(ref);

      normalized.push({
        id: w._id,
        reference: ref,
        receiptNumber,
        type: w.type,
        category,
        title,
        subtitle,
        description: w.description,
        amount: Math.abs(w.amount),
        fee: w.fee || 0,
        totalAmount: Math.abs(w.amount) + (w.fee || 0),
        currency: w.currency || "LC",
        isDebit,
        status: mappedStatus,
        statusLabel: mappedStatus.charAt(0).toUpperCase() + mappedStatus.slice(1),
        paymentMethod: w.paymentProvider ? w.paymentProvider.toUpperCase() : "LaLao Credits Wallet",
        createdAt: w.createdAt,
        iconType,
        provider,
        providerReference: w.providerTransactionId || correlatedMarket?.providerOrderId,
        recipient: {
          name: recipientName,
          subtitle: recipientSubtitle,
          avatar: recipientAvatar,
          phoneMasked,
          network,
        },
        hasReceipt: mappedStatus === "completed",
        token: correlatedMarket?.token,
        units: correlatedMarket?.units,
        rawStatus: w.status,
      });
    }

    // Process any market transactions that did not correlate with a wallet transaction
    for (const m of marketTxList) {
      if (processedReferences.has(m.requestId)) continue;

      const isAirtime = m.category === "AIRTIME";
      const isData = m.category === "DATA";
      const maskedPhone = maskPhoneNumber(m.recipient || m.phone);
      const network = m.network || (m.productName?.includes("MTN") ? "MTN" : m.productName?.includes("Airtel") ? "Airtel" : "Network");

      let mappedStatus: PaymentStatusType = "completed";
      if (m.status === "FAILED") mappedStatus = "failed";
      else if (m.status === "PENDING" || m.status === "PROCESSING") mappedStatus = "pending";
      else if (m.status === "REFUNDED" || m.status === "REVERSED") mappedStatus = "refunded";

      normalized.push({
        id: m._id,
        reference: m.requestId,
        receiptNumber: formatReceiptNumber(m.requestId),
        type: "MARKET_PURCHASE",
        category: "airtime",
        title: `${network} ${isData ? "Data" : "Airtime"}`,
        subtitle: maskedPhone ? `To ${maskedPhone}` : m.productName,
        description: `${m.productName || m.category} to ${maskedPhone || m.recipient}`,
        amount: m.amount,
        fee: m.platformFee || 0,
        totalAmount: m.totalAmount,
        currency: m.currency || "LC",
        isDebit: true,
        status: mappedStatus,
        statusLabel: mappedStatus.charAt(0).toUpperCase() + mappedStatus.slice(1),
        paymentMethod: "LaLao Credits Wallet",
        createdAt: m.createdAt,
        iconType: isData ? "wifi" : "smartphone",
        provider: network,
        providerReference: m.providerOrderId,
        recipient: {
          name: network,
          subtitle: maskedPhone,
          phoneMasked: maskedPhone,
          network,
        },
        hasReceipt: mappedStatus === "completed",
        token: m.token,
        units: m.units,
        rawStatus: m.status,
      });
    }

    // Sort by createdAt descending
    normalized.sort((a, b) => b.createdAt - a.createdAt);

    // Compute summary metrics before filtering
    let totalSpent = 0;
    let totalFunded = 0;
    for (const tx of normalized) {
      if (tx.status === "completed") {
        if (tx.isDebit) {
          totalSpent += tx.totalAmount;
        } else {
          totalFunded += tx.amount;
        }
      }
    }

    // Apply Filters
    let filtered = normalized;

    // Type filter
    if (args.type && args.type !== "all") {
      filtered = filtered.filter((tx) => {
        if (args.type === "airtime") return tx.category === "airtime";
        if (args.type === "pages") return tx.category === "pages";
        if (args.type === "gifts") return tx.category === "gifts";
        if (args.type === "wallet") return tx.category === "wallet";
        if (args.type === "other") return tx.category === "other";
        return true;
      });
    }

    // Status filter
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((tx) => tx.status === args.status);
    }

    // Date range filter
    if (args.dateRange && args.dateRange !== "all") {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (args.dateRange === "today") {
        filtered = filtered.filter((tx) => now - tx.createdAt <= oneDay);
      } else if (args.dateRange === "week") {
        filtered = filtered.filter((tx) => now - tx.createdAt <= 7 * oneDay);
      } else if (args.dateRange === "month") {
        filtered = filtered.filter((tx) => now - tx.createdAt <= 30 * oneDay);
      }
    }

    // Search query filter
    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      const q = args.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((tx) => {
        return (
          tx.reference?.toLowerCase().includes(q) ||
          tx.receiptNumber?.toLowerCase().includes(q) ||
          tx.title?.toLowerCase().includes(q) ||
          tx.subtitle?.toLowerCase().includes(q) ||
          tx.description?.toLowerCase().includes(q) ||
          tx.provider?.toLowerCase().includes(q) ||
          tx.recipient?.name?.toLowerCase().includes(q) ||
          tx.recipient?.phoneMasked?.toLowerCase().includes(q) ||
          tx.recipient?.subtitle?.toLowerCase().includes(q)
        );
      });
    }

    const limit = args.limit || 50;
    const paginated = filtered.slice(0, limit);

    return {
      transactions: paginated,
      totalCount: filtered.length,
      hasMore: filtered.length > limit,
      summary: {
        totalSpent,
        totalFunded,
      },
    };
  },
});

/**
 * Fetch official verified receipt for a specific completed transaction.
 * Strictly verifies user authorization and completion state.
 */
export const getTransactionReceipt = query({
  args: {
    transactionId: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated. Please sign in to view receipts.");

    if (!args.transactionId && !args.reference) {
      throw new Error("Transaction ID or reference is required.");
    }

    // Find transaction
    let tx: any = null;

    if (args.transactionId) {
      const normalizedId = ctx.db.normalizeId("walletTransactions", args.transactionId);
      if (normalizedId) {
        tx = await ctx.db.get(normalizedId);
      }
      if (!tx) {
        const normMarketId = ctx.db.normalizeId("marketTransactions", args.transactionId);
        if (normMarketId) {
          tx = await ctx.db.get(normMarketId);
        }
      }
    }

    if (!tx && args.reference) {
      tx = await ctx.db
        .query("walletTransactions")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .first();

      if (!tx && args.reference) {
        tx = await ctx.db
          .query("marketTransactions")
          .withIndex("by_request_id", (q) => q.eq("requestId", args.reference!))
          .first();
      }
    }

    if (!tx) {
      throw new Error("Transaction not found.");
    }

    // Security Check: Verify user owns this transaction
    if (tx.userId !== user._id) {
      throw new Error("Unauthorized: You do not have permission to access this receipt.");
    }

    // Security Check: Receipts are only valid for completed transactions
    const isCompleted = tx.status === "completed" || tx.status === "COMPLETED";
    if (!isCompleted) {
      throw new Error("Receipt unavailable: Receipts are only generated for successful, completed transactions.");
    }

    const ref = tx.reference || tx.requestId || `TXN-${tx._id.slice(-8).toUpperCase()}`;
    const receiptNumber = tx.receiptNumber || formatReceiptNumber(ref);

    // Correlate extra details
    let recipientName = tx.relatedUserName || tx.customerName || tx.network || "Lala Recipient";
    let recipientSubtitle = tx.relatedUserUsername ? `@${tx.relatedUserUsername}` : undefined;
    let phone = tx.phone || tx.recipient;
    if (phone) phone = maskPhoneNumber(phone);

    return {
      receiptNumber,
      reference: ref,
      date: tx.completedAt || tx.createdAt,
      formattedDate: new Date(tx.completedAt || tx.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "SUCCESSFUL",
      statusBadge: "Paid & Verified",
      amount: Math.abs(tx.amount || tx.totalAmount),
      fee: tx.fee || tx.platformFee || 0,
      totalCharged: Math.abs(tx.amount || tx.totalAmount) + (tx.fee || tx.platformFee || 0),
      currency: tx.currency || "LC",
      paymentMethod: tx.paymentProvider ? tx.paymentProvider.toUpperCase() : "LaLao Credits Wallet",
      providerReference: tx.providerTransactionId || tx.providerOrderId,
      description: tx.description || tx.productName || "Lala Transaction",
      payer: {
        id: user._id,
        name: user.name || "Lala User",
        email: user.email ? user.email.replace(/(.{2})(.*)(?=@)/, (_gp: string, a: string, b: string) => a + "*".repeat(b.length)) : undefined,
        username: user.username ? `@${user.username}` : undefined,
      },
      recipient: {
        name: recipientName,
        subtitle: recipientSubtitle,
        phoneMasked: phone,
        network: tx.network,
      },
      token: tx.token,
      units: tx.units,
      supportEmail: "support@lalao.website",
    };
  },
});

/**
 * Seed realistic transactions for testing and first-time verification
 */
export const seedSamplePaymentHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: user._id,
        balance: 15000,
        currency: "LC",
        accountNumber: "LC-" + Math.floor(100000 + Math.random() * 900000).toString(),
        accountName: user.name || "Lala User",
        bankName: "LaLao Platform",
        updatedAt: Date.now(),
      });
      wallet = await ctx.db.get(walletId);
    }

    if (!wallet) throw new Error("Failed to initialize wallet");

    const now = Date.now();
    const oneHour = 3600 * 1000;
    const oneDay = 24 * oneHour;

    // 1. Paystack Top-up (Completed)
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 10000,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      paymentProvider: "paystack",
      providerTransactionId: "pstk_" + Math.random().toString(36).substring(2, 9),
      type: "deposit",
      status: "completed",
      description: "Wallet funded via Paystack (₦10,000 -> 10,000 LC)",
      reference: "PAY-PSTK-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: now - 3 * oneDay,
    });

    // 2. MTN Airtime (Completed)
    const mtnRef = "LAL-MKT-" + Math.floor(10000000 + Math.random() * 90000000);
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 1000,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "MARKET_PURCHASE",
      status: "completed",
      description: "MTN Airtime - 08012345678",
      reference: mtnRef,
      createdAt: now - 2 * oneDay,
    });
    await ctx.db.insert("marketTransactions", {
      userId: user._id,
      type: "MARKET_PURCHASE",
      category: "AIRTIME",
      provider: "vtu_ng",
      status: "COMPLETED",
      requestId: mtnRef,
      providerOrderId: "VTU-MTN-99812",
      amount: 1000,
      platformFee: 0,
      totalAmount: 1000,
      currency: "LC",
      recipient: "08012345678",
      phone: "08012345678",
      network: "MTN",
      productName: "MTN ₦1,000 Airtime",
      createdAt: now - 2 * oneDay,
      updatedAt: now - 2 * oneDay,
      completedAt: now - 2 * oneDay,
    });

    // 3. Airtel Data (Completed)
    const airtelRef = "LAL-MKT-" + Math.floor(10000000 + Math.random() * 90000000);
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 1500,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "MARKET_PURCHASE",
      status: "completed",
      description: "Airtel Data - 09087654321",
      reference: airtelRef,
      createdAt: now - 1 * oneDay,
    });
    await ctx.db.insert("marketTransactions", {
      userId: user._id,
      type: "MARKET_PURCHASE",
      category: "DATA",
      provider: "clubkonnect",
      status: "COMPLETED",
      requestId: airtelRef,
      providerOrderId: "CK-AIRTEL-44321",
      amount: 1500,
      platformFee: 0,
      totalAmount: 1500,
      currency: "LC",
      recipient: "09087654321",
      phone: "09087654321",
      network: "Airtel",
      productName: "Airtel 2.5GB 30-Day Plan",
      createdAt: now - 1 * oneDay,
      updatedAt: now - 1 * oneDay,
      completedAt: now - 1 * oneDay,
    });

    // 4. Payment to Page (Completed)
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 2500,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "transfer_out",
      status: "completed",
      relatedUserName: "AfroBeats Production Studio",
      relatedUserUsername: "afrobeats_hq",
      description: "Payment to Partner Business: Track Mastering Service",
      reference: "TXN-PG-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: now - 12 * oneHour,
    });

    // 5. Plum Virtual Gift (Completed)
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 500,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "transfer_out",
      status: "completed",
      relatedUserName: "Amara Okonkwo",
      relatedUserUsername: "amara_o",
      description: "Sent Plum Gift: Sparkling Champagne 🍾",
      reference: "GIFT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: now - 4 * oneHour,
    });

    // 6. Glo Airtime (Failed)
    const gloRef = "LAL-MKT-" + Math.floor(10000000 + Math.random() * 90000000);
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 500,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "MARKET_PURCHASE",
      status: "failed",
      description: "Glo Airtime - 08055554444 (Provider Timeout)",
      reference: gloRef,
      createdAt: now - 2 * oneHour,
    });

    // 7. Auto-Refund for Glo failure (Completed Refund)
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 500,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      type: "MARKET_REFUND",
      status: "completed",
      description: "Refund for AIRTIME - 08055554444",
      reference: "REF-" + gloRef,
      createdAt: now - 1 * oneHour,
    });

    // 8. Pending Bank Top-up (Pending)
    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: user._id,
      amount: 5000,
      fee: 0,
      currency: "LC",
      assetType: "LALAO_CREDITS",
      paymentProvider: "paystack",
      type: "deposit",
      status: "pending",
      description: "Wallet funded via Paystack (₦5,000 -> 5,000 LC) - Awaiting Confirmation",
      reference: "PAY-PENDING-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: now - 15 * 60 * 1000,
    });

    return { success: true, message: "Sample payment history initialized successfully." };
  },
});
