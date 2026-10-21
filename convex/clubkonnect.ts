import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdmin } from "./admin";

/**
 * Supported ClubKonnect service categories and their defaults
 */
export const DEFAULT_SERVICE_SETTINGS = {
  airtime: {
    enabled: true,
    label: "Airtime Top-up",
    fee: 0,
    markupPercent: 0,
    minAmount: 50,
    maxAmount: 50000,
    supportedProviders: ["MTN", "Airtel", "Glo", "9mobile"],
  },
  data: {
    enabled: true,
    label: "Mobile Data Bundles",
    fee: 0,
    markupPercent: 0,
    minAmount: 100,
    maxAmount: 100000,
    supportedProviders: ["MTN", "Airtel", "Glo", "9mobile"],
  },
  electricity: {
    enabled: true,
    label: "Electricity Bills",
    fee: 100,
    markupPercent: 0,
    minAmount: 500,
    maxAmount: 200000,
    supportedProviders: [
      { id: "01", name: "Eko Electric (EKEDC)", code: "EKO_ELECTRIC" },
      { id: "02", name: "Ikeja Electric (IKEDC)", code: "IKEJA_ELECTRIC" },
      { id: "03", name: "Abuja Electric (AEDC)", code: "ABUJA_ELECTRIC" },
      { id: "04", name: "Kano Electric (KEDCO)", code: "KANO_ELECTRIC" },
      { id: "05", name: "Port Harcourt Electric (PHED)", code: "PORTHARCOURT_ELECTRIC" },
      { id: "06", name: "Jos Electric (JED)", code: "JOS_ELECTRIC" },
      { id: "07", name: "Kaduna Electric (KAEDCO)", code: "KADUNA_ELECTRIC" },
      { id: "08", name: "Enugu Electric (EEDC)", code: "ENUGU_ELECTRIC" },
      { id: "09", name: "Benin Electric (BEDC)", code: "BENIN_ELECTRIC" },
    ],
  },
  cable: {
    enabled: true,
    label: "Cable TV Subscriptions",
    fee: 100,
    markupPercent: 0,
    minAmount: 1000,
    maxAmount: 100000,
    supportedProviders: [
      { id: "dstv", name: "DStv", code: "DStv" },
      { id: "gotv", name: "GOtv", code: "GOtv" },
      { id: "startimes", name: "StarTimes", code: "StarTimes" },
    ],
  },
  betting: {
    enabled: true,
    label: "Betting Wallet Funding",
    fee: 50,
    markupPercent: 0,
    minAmount: 100,
    maxAmount: 100000,
    supportedProviders: [
      { id: "prd-sporty-bet", name: "SportyBet", code: "prd-sporty-bet" },
      { id: "product-bet-king", name: "BetKing", code: "product-bet-king" },
      { id: "product-1x-bet", name: "1xBet", code: "product-1x-bet" },
      { id: "product-nairabet", name: "NairaBet", code: "product-nairabet" },
      { id: "product-bang-bet", name: "BangBet", code: "product-bang-bet" },
      { id: "product-bet-way", name: "BetWay", code: "product-bet-way" },
      { id: "product-merry-bet", name: "MerryBet", code: "product-merry-bet" },
      { id: "product-naija-bet", name: "NaijaBet", code: "product-naija-bet" },
      { id: "product-bet-land", name: "BetLand", code: "product-bet-land" },
    ],
  },
  smile: {
    enabled: true,
    label: "Smile Internet",
    fee: 0,
    markupPercent: 0,
    minAmount: 500,
    maxAmount: 100000,
    supportedProviders: [
      { id: "smile-direct", name: "Smile Direct", code: "smile-direct" },
    ],
  },
  spectranet: {
    enabled: true,
    label: "Spectranet 4G LTE",
    fee: 0,
    markupPercent: 0,
    minAmount: 1000,
    maxAmount: 100000,
    supportedProviders: [
      { id: "spectranet", name: "Spectranet", code: "spectranet" },
    ],
  },
  waec: {
    enabled: true,
    label: "WAEC Examination",
    fee: 0,
    markupPercent: 0,
    minAmount: 3500,
    maxAmount: 50000,
    supportedProviders: [
      { id: "waec", name: "West African Examinations Council", code: "waec" },
    ],
  },
  jamb: {
    enabled: true,
    label: "JAMB e-PIN",
    fee: 0,
    markupPercent: 0,
    minAmount: 4700,
    maxAmount: 50000,
    supportedProviders: [
      { id: "jamb", name: "Joint Admissions and Matriculation Board", code: "jamb" },
    ],
  },
};

/**
 * Public Query: Get active service availability and fee configs for customers
 */
export const getCustomerServiceSettings = query({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "bill_payment_services"))
      .first();

    if (!record) {
      return DEFAULT_SERVICE_SETTINGS;
    }

    try {
      const parsed = JSON.parse(record.value);
      return {
        ...DEFAULT_SERVICE_SETTINGS,
        ...parsed,
      };
    } catch {
      return DEFAULT_SERVICE_SETTINGS;
    }
  },
});

/**
 * Admin Query: Get full bill payment settings, connection state, and pricing
 */
export const adminGetBillPaymentSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "bill_payment_services"))
      .first();

    const connectionRecord = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "clubkonnect_connection_status"))
      .first();

    let services = DEFAULT_SERVICE_SETTINGS;
    if (record) {
      try {
        services = { ...DEFAULT_SERVICE_SETTINGS, ...JSON.parse(record.value) };
      } catch (e) {}
    }

    let connectionInfo: any = {
      isConfigured: Boolean(process.env.CLUBKONNECT_USER_ID && process.env.CLUBKONNECT_API_KEY),
      hasUserId: Boolean(process.env.CLUBKONNECT_USER_ID),
      hasApiKey: Boolean(process.env.CLUBKONNECT_API_KEY),
      lastTested: connectionRecord ? connectionRecord.updatedAt : null,
      lastStatus: connectionRecord ? JSON.parse(connectionRecord.value) : null,
    };

    return {
      services,
      connectionInfo,
      updatedAt: record?.updatedAt || null,
    };
  },
});

/**
 * Admin Mutation: Update service toggles, fees, and markup
 */
export const adminUpdateBillPaymentSettings = mutation({
  args: {
    services: v.any(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "bill_payment_services"))
      .first();

    const now = Date.now();
    const serialized = JSON.stringify(args.services);

    if (record) {
      await ctx.db.patch(record._id, {
        value: serialized,
        updatedAt: now,
        updatedBy: admin._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "bill_payment_services",
        value: serialized,
        updatedAt: now,
        updatedBy: admin._id,
      });
    }

    await ctx.db.insert("auditLog", {
      actorId: admin._id,
      action: "updated_bill_payment_settings",
      target: "bill_payment_services",
      before: record?.value,
      after: serialized,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Admin Action: Test real live ClubKonnect connection and retrieve provider wallet balance
 */
export const adminTestClubKonnectConnection = action({
  args: {},
  handler: async (ctx) => {
    const userId = process.env.CLUBKONNECT_USER_ID;
    const apiKey = process.env.CLUBKONNECT_API_KEY;

    if (!userId || !apiKey) {
      return {
        status: "CONFIGURATION_MISSING",
        message: "CLUBKONNECT_USER_ID or CLUBKONNECT_API_KEY is not set in backend environment variables.",
        balance: null,
        timestamp: Date.now(),
      };
    }

    try {
      const url = `https://www.nellobytesystems.com/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      let statusResult = "CONNECTED";
      let balanceStr = null;
      let errorMsg = null;

      if (data && data.balance !== undefined) {
        statusResult = "CONNECTED";
        balanceStr = data.balance;
      } else if (data && data.status) {
        if (data.status === "INVALID_CREDENTIALS" || data.status === "USER_NOT_FOUND") {
          statusResult = "AUTHENTICATION_FAILED";
          errorMsg = "Provider rejected credentials: " + data.status;
        } else if (data.status === "IP_NOT_ALLOWED" || data.status === "UNAUTHORIZED_IP") {
          statusResult = "IP_NOT_WHITELISTED";
          errorMsg = "Server IP address is not whitelisted on ClubKonnect dashboard.";
        } else {
          statusResult = "PROVIDER_ERROR";
          errorMsg = data.status;
        }
      } else {
        statusResult = "UNEXPECTED_RESPONSE";
        errorMsg = "Unable to parse provider balance response.";
      }

      // Record test status
      await ctx.runMutation((internal as any).clubkonnect.recordConnectionStatus, {
        status: statusResult,
        balance: balanceStr,
        error: errorMsg,
      });

      return {
        status: statusResult,
        balance: balanceStr,
        error: errorMsg,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      await ctx.runMutation((internal as any).clubkonnect.recordConnectionStatus, {
        status: "NETWORK_ERROR",
        balance: null,
        error: err.message || "Failed to reach ClubKonnect server",
      });

      return {
        status: "NETWORK_ERROR",
        balance: null,
        error: err.message,
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Internal mutation to record connection test status
 */
export const recordConnectionStatus = internalMutation({
  args: {
    status: v.string(),
    balance: v.optional(v.union(v.string(), v.null())),
    error: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "clubkonnect_connection_status"))
      .first();

    const now = Date.now();
    const val = JSON.stringify(args);

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: val,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "clubkonnect_connection_status",
        value: val,
        updatedAt: now,
      });
    }
  },
});
