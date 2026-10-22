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
      let paymentRecord: any = null;

      // 1. Check /v1/payments endpoint by reference
      try {
        const payRes = await fetch(`${baseUrl}/v1/payments?reference=${encodeURIComponent(args.reference)}`, {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
        });
        if (payRes.ok) {
          const payData = await payRes.json() as any;
          const items = Array.isArray(payData) ? payData : (payData?.items || payData?.data || []);
          if (items.length > 0) {
            paymentRecord = items[0];
          }
        }
      } catch (e) {
        console.warn("[BACHS] /v1/payments by ref query error:", e);
      }

      // 2. If not found by query param, search recent payments for meta.reference match
      if (!paymentRecord) {
        try {
          const listRes = await fetch(`${baseUrl}/v1/payments?limit=25`, {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              Accept: "application/json",
            },
          });
          if (listRes.ok) {
            const listData = await listRes.json() as any;
            const items = Array.isArray(listData) ? listData : (listData?.items || listData?.data || []);
            paymentRecord = items.find((p: any) => 
              p.reference === args.reference || 
              p.meta?.reference === args.reference ||
              p.source?.reference === args.reference ||
              (args.sessionId && (p.source?.checkout_id === args.sessionId || p.id === args.sessionId))
            );
          }
        } catch (e) {
          console.warn("[BACHS] /v1/payments list scan error:", e);
        }
      }

      // 3. Fallback to /v1/checkout-sessions if not matched via payments
      if (!paymentRecord && args.sessionId) {
        try {
          const sessionRes = await fetch(`${baseUrl}/v1/checkout-sessions/${args.sessionId}`, {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              Accept: "application/json",
            },
          });
          if (sessionRes.ok) {
            paymentRecord = await sessionRes.json();
          }
        } catch (e) {
          console.warn("[BACHS] /v1/checkout-sessions by id error:", e);
        }
      }

      if (!paymentRecord) {
        try {
          const sessionListRes = await fetch(`${baseUrl}/v1/checkout-sessions?reference=${encodeURIComponent(args.reference)}`, {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              Accept: "application/json",
            },
          });
          if (sessionListRes.ok) {
            const sessionListData = await sessionListRes.json() as any;
            const items = Array.isArray(sessionListData) ? sessionListData : (sessionListData?.items || sessionListData?.data || []);
            if (items.length > 0) {
              paymentRecord = items[0];
            }
          }
        } catch (e) {
          console.warn("[BACHS] /v1/checkout-sessions list error:", e);
        }
      }

      if (!paymentRecord) {
        return {
          success: false,
          message: "Transaction could not be found with BACHS provider.",
        };
      }

      const status = (paymentRecord.status || paymentRecord.payment_status || "").toLowerCase();
      if (status !== "completed" && status !== "succeeded" && status !== "paid" && status !== "success") {
        return {
          success: false,
          status,
          message: `Payment status is ${status || "pending"}. Wallet can only be credited once payment is confirmed.`,
        };
      }

      // 4. Verify currency & amount
      const currency = (
        paymentRecord.currency || 
        paymentRecord.settlement_currency || 
        paymentRecord.pricing?.currency || 
        "NGN"
      ).toUpperCase();
      if (currency !== "NGN") {
        return { success: false, message: `Invalid payment currency: ${currency}. Expected NGN.` };
      }

      const rawAmount = paymentRecord.amount_paid || paymentRecord.amount || paymentRecord.pricing?.amount || "0";
      const verifiedAmount = parseFloat(rawAmount);
      if (isNaN(verifiedAmount) || verifiedAmount <= 0) {
        return { success: false, message: "Invalid amount reported by BACHS provider." };
      }

      // 5. Atomically settle wallet credits
      const settleResult = await ctx.runMutation(internal.wallet.settleWalletFunding, {
        reference: args.reference,
        verifiedAmount,
        providerTransactionId: paymentRecord.id || args.sessionId,
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
