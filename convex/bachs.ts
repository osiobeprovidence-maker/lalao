import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const DEFAULT_SANDBOX_URL = "https://sandbox-api.bachs.io";
const DEFAULT_LIVE_URL = "https://api.bachs.io";

function getBachsBaseUrl(): string {
  if (process.env.BACHS_API_BASE_URL) {
    return process.env.BACHS_API_BASE_URL.replace(/\/+$/, "");
  }
  const env = (process.env.BACHS_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live" || env === "production" ? DEFAULT_LIVE_URL : DEFAULT_SANDBOX_URL;
}

/**
 * Initialize a BACHS hosted checkout session for wallet funding.
 * Called securely by the frontend via backend action.
 */
export const initializeBachsFunding = action({
  args: {
    amount: v.number(),
    reference: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // 1. Validation: Minimum funding is ₦100 (100 LC), maximum is ₦500,000 (500,000 LC)
    if (typeof args.amount !== "number" || isNaN(args.amount) || args.amount < 100) {
      throw new Error("Minimum funding amount is ₦100 (100 LC).");
    }
    if (args.amount > 500000) {
      throw new Error("Maximum funding amount is ₦500,000 (500,000 LC) per transaction.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.runQuery(internal.wallet.getUserByIdentity, {
      tokenIdentifier: identity?.tokenIdentifier,
      userId: args.userId,
    });
    if (!user) throw new Error("User profile not found. Please sign in to fund your wallet.");

    const wallet = await ctx.runMutation(internal.wallet.getOrCreateUserWallet, {
      userId: user._id,
      userName: user.name,
    });
    if (!wallet) throw new Error("Wallet could not be initialized.");

    // 2. Create pending ledger transaction record with provider = "bachs"
    await ctx.runMutation(internal.wallet.createPendingFunding, {
      amount: args.amount,
      reference: args.reference,
      userId: user._id,
      walletId: wallet._id,
      provider: "bachs",
    });

    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) {
      // Return helpful development fallback if credentials are not yet entered in Convex environment
      return {
        success: true,
        reference: args.reference,
        isDevelopmentMode: true,
        message: "BACHS_SECRET_KEY is not configured in backend environment variables. Configure this secret in Convex to initiate live checkout sessions.",
      };
    }

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || "https://www.lalao.website").replace(/\/+$/, "");
    const successUrl = `${appUrl}/app?tab=wallet&funding_success=true&ref=${encodeURIComponent(args.reference)}`;
    const cancelUrl = `${appUrl}/app?tab=wallet&funding_cancelled=true&ref=${encodeURIComponent(args.reference)}`;

    const baseUrl = getBachsBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          customer: {
            email: user.email || `${user.username || "user"}@lalao.app`,
            name: user.name || "Lalao User",
          },
          pricing: {
            currency: "NGN",
            amount: args.amount.toString(),
          },
          metadata: {
            userId: user._id,
            walletId: wallet._id,
            reference: args.reference,
            type: "wallet_funding",
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      const data = await res.json() as any;

      if (!res.ok || !data) {
        const errorMsg = data?.message || data?.error || `BACHS session initialization failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      const checkoutUrl = data.checkout_url || data.url;
      const sessionId = data.id || data.session_id;

      return {
        success: true,
        sessionId,
        checkoutUrl,
        reference: args.reference,
      };
    } catch (err: any) {
      console.error("[BACHS] Checkout session creation error:", err);
      throw new Error(err.message || "Could not connect to BACHS payment gateway.");
    }
  },
});

/**
 * Verify a BACHS payment directly from the BACHS API.
 * Idempotently settles wallet funding upon verification.
 */
export const verifyBachsFunding = action({
  args: {
    reference: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) {
      return {
        success: false,
        isDevelopmentMode: true,
        message: "BACHS_SECRET_KEY is not configured in backend environment variables.",
      };
    }

    const baseUrl = getBachsBaseUrl();

    try {
      // 1. If sessionId is provided, query the checkout session directly
      let sessionData: any = null;
      if (args.sessionId) {
        const res = await fetch(`${baseUrl}/v1/checkout-sessions/${args.sessionId}`, {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          sessionData = await res.json();
        }
      }

      // 2. Alternatively check by reference if session wasn't retrieved
      if (!sessionData) {
        const res = await fetch(`${baseUrl}/v1/checkout-sessions?reference=${encodeURIComponent(args.reference)}`, {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const list = await res.json() as any;
          sessionData = Array.isArray(list) ? list[0] : list?.data?.[0] || list;
        }
      }

      if (!sessionData) {
        return {
          success: false,
          message: "Transaction could not be found with BACHS provider.",
        };
      }

      const status = (sessionData.status || sessionData.payment_status || "").toLowerCase();
      if (status !== "completed" && status !== "succeeded" && status !== "paid" && status !== "success") {
        return {
          success: false,
          status,
          message: `Payment status is ${status}. Wallet can only be credited once payment is confirmed.`,
        };
      }

      // 3. Verify currency & amount
      const currency = (sessionData.pricing?.currency || sessionData.currency || "NGN").toUpperCase();
      if (currency !== "NGN") {
        return { success: false, message: `Invalid payment currency: ${currency}. Expected NGN.` };
      }

      const verifiedAmount = parseFloat(sessionData.pricing?.amount || sessionData.amount || "0");
      if (isNaN(verifiedAmount) || verifiedAmount <= 0) {
        return { success: false, message: "Invalid amount reported by BACHS provider." };
      }

      // 4. Atomically settle wallet credits
      const settleResult = await ctx.runMutation(internal.wallet.settleWalletFunding, {
        reference: args.reference,
        verifiedAmount,
        providerTransactionId: sessionData.id || args.sessionId,
        provider: "bachs",
      });

      return settleResult;
    } catch (err: any) {
      console.error("[BACHS] Verification error:", err);
      return {
        success: false,
        message: err.message || "Network error verifying payment with BACHS.",
      };
    }
  },
});
