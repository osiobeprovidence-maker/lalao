import { internalMutation, internalQuery, action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { DEFAULT_SERVICE_SETTINGS } from "./clubkonnect";

const CLUBKONNECT_USER_ID = process.env.CLUBKONNECT_USER_ID;
const CLUBKONNECT_API_KEY = process.env.CLUBKONNECT_API_KEY;
const MOCK_PROVIDER = process.env.MARKET_PROVIDER === "mock" || (!CLUBKONNECT_USER_ID && !process.env.VTU_USERNAME);

// Clubkonnect Network Codes: 01=MTN, 02=Glo, 03=9mobile, 04=Airtel
export function getClubkonnectNetworkCode(net?: string): string {
  const n = (net || '').toUpperCase();
  if (n.includes('MTN')) return '01';
  if (n.includes('GLO')) return '02';
  if (n.includes('9MOBILE') || n.includes('ETISALAT')) return '03';
  if (n.includes('AIRTEL')) return '04';
  return '01';
}

// ClubKonnect Disco Codes
export function getClubkonnectDiscoCode(disco?: string): string {
  const d = (disco || '').toUpperCase();
  if (d.includes('KADUNA') || d.includes('KAEDCO') || d === '07') return '07';
  if (d.includes('ABUJA') || d.includes('AEDC') || d === '03') return '03';
  if (d.includes('EKO') || d.includes('EKEDC') || d === '01') return '01';
  if (d.includes('IKEJA') || d.includes('IKEDC') || d === '02') return '02';
  if (d.includes('KANO') || d.includes('KEDCO') || d === '04') return '04';
  if (d.includes('PORT') || d.includes('PHED') || d === '05') return '05';
  if (d.includes('JOS') || d.includes('JED') || d === '06') return '06';
  if (d.includes('ENUGU') || d.includes('EEDC') || d === '08') return '08';
  if (d.includes('BENIN') || d.includes('BEDC') || d === '09') return '09';
  return '01';
}

// ClubKonnect Cable TV Codes
export function getClubkonnectCableCode(cable?: string): string {
  const c = (cable || '').toLowerCase();
  if (c.includes('dstv')) return 'dstv';
  if (c.includes('gotv')) return 'gotv';
  if (c.includes('startimes')) return 'startimes';
  return 'dstv';
}

/**
 * Fetch Data Bundles from Live ClubKonnect Feed
 */
export const getVariations = action({
  args: { type: v.string(), network: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const net = (args.network || "MTN").toUpperCase();

    // Default curated fallback data plans for Nigerian telcos
    const PLANS_BY_NETWORK: Record<string, any[]> = {
      MTN: [
        { id: 'mtn_500mb', network: 'MTN', planName: '500MB SME', dataAmount: '500MB', validity: '30 Days', price: 250, variationId: 'MTN_500MB' },
        { id: 'mtn_1gb', network: 'MTN', planName: '1GB SME', dataAmount: '1GB', validity: '30 Days', price: 450, variationId: 'MTN_1GB' },
        { id: 'mtn_2gb', network: 'MTN', planName: '2GB SME', dataAmount: '2GB', validity: '30 Days', price: 900, variationId: 'MTN_2GB' },
        { id: 'mtn_3gb', network: 'MTN', planName: '3GB SME', dataAmount: '3GB', validity: '30 Days', price: 1350, variationId: 'MTN_3GB' },
        { id: 'mtn_5gb', network: 'MTN', planName: '5GB SME', dataAmount: '5GB', validity: '30 Days', price: 2200, variationId: 'MTN_5GB' },
        { id: 'mtn_10gb', network: 'MTN', planName: '10GB Corporate', dataAmount: '10GB', validity: '30 Days', price: 4300, variationId: 'MTN_10GB' },
      ],
      AIRTEL: [
        { id: 'airtel_500mb', network: 'Airtel', planName: '500MB Corporate', dataAmount: '500MB', validity: '30 Days', price: 300, variationId: 'AIRTEL_500MB' },
        { id: 'airtel_1gb', network: 'Airtel', planName: '1GB Corporate', dataAmount: '1GB', validity: '30 Days', price: 500, variationId: 'AIRTEL_1GB' },
        { id: 'airtel_2gb', network: 'Airtel', planName: '2GB Corporate', dataAmount: '2GB', validity: '30 Days', price: 1000, variationId: 'AIRTEL_2GB' },
        { id: 'airtel_5gb', network: 'Airtel', planName: '5GB Corporate', dataAmount: '5GB', validity: '30 Days', price: 2400, variationId: 'AIRTEL_5GB' },
        { id: 'airtel_10gb', network: 'Airtel', planName: '10GB Corporate', dataAmount: '10GB', validity: '30 Days', price: 4600, variationId: 'AIRTEL_10GB' },
      ],
      GLO: [
        { id: 'glo_1gb', network: 'Glo', planName: '1GB Special', dataAmount: '1GB', validity: '30 Days', price: 400, variationId: 'GLO_1GB' },
        { id: 'glo_2gb', network: 'Glo', planName: '2.5GB Special', dataAmount: '2.5GB', validity: '30 Days', price: 800, variationId: 'GLO_2GB' },
        { id: 'glo_5gb', network: 'Glo', planName: '5.8GB Special', dataAmount: '5.8GB', validity: '30 Days', price: 1800, variationId: 'GLO_5GB' },
        { id: 'glo_10gb', network: 'Glo', planName: '10GB Monthly', dataAmount: '10GB', validity: '30 Days', price: 3500, variationId: 'GLO_10GB' },
      ],
      '9MOBILE': [
        { id: '9mobile_500mb', network: '9mobile', planName: '500MB SME', dataAmount: '500MB', validity: '30 Days', price: 350, variationId: '9MOBILE_500MB' },
        { id: '9mobile_1gb', network: '9mobile', planName: '1GB SME', dataAmount: '1GB', validity: '30 Days', price: 650, variationId: '9MOBILE_1GB' },
        { id: '9mobile_2gb', network: '9mobile', planName: '2GB SME', dataAmount: '2GB', validity: '30 Days', price: 1300, variationId: '9MOBILE_2GB' },
        { id: '9mobile_5gb', network: '9mobile', planName: '5GB SME', dataAmount: '5GB', validity: '30 Days', price: 3000, variationId: '9MOBILE_5GB' },
      ]
    };

    // Always attempt live fetch from official ClubKonnect APIDatabundlePlansV2
    try {
      const url = CLUBKONNECT_USER_ID 
        ? `https://www.nellobytesystems.com/APIDatabundlePlansV2.asp?UserID=${encodeURIComponent(CLUBKONNECT_USER_ID)}`
        : `https://www.nellobytesystems.com/APIDatabundlePlansV2.asp`;
      
      const ckPlansRes = await fetch(url);
      const ckData = await ckPlansRes.json();
      const networkKeyMap: Record<string, string> = {
        MTN: "MTN",
        GLO: "Glo",
        AIRTEL: "Airtel",
        "9MOBILE": "m_9mobile"
      };
      const netKey = networkKeyMap[net] || "MTN";
      const netObj = ckData?.MOBILE_NETWORK?.[netKey]?.[0];
      if (netObj && Array.isArray(netObj.PRODUCT)) {
        return netObj.PRODUCT.map((p: any) => ({
          id: `ck_${p.PRODUCT_ID}_${p.PRODUCT_CODE}`,
          network: net,
          planName: p.PRODUCT_NAME,
          dataAmount: p.PRODUCT_NAME.split('-')[0]?.trim() || p.PRODUCT_NAME,
          validity: p.PRODUCT_NAME.includes('days') || p.PRODUCT_NAME.includes('day') || p.PRODUCT_NAME.includes('Monthly') ? p.PRODUCT_NAME : '30 Days',
          price: Math.ceil(parseFloat(p.PRODUCT_AMOUNT) || 0),
          variationId: p.PRODUCT_ID || p.PRODUCT_CODE,
        }));
      }
    } catch (err) {
      console.warn("Live ClubKonnect plan fetch fallback:", err);
    }

    return PLANS_BY_NETWORK[net] || PLANS_BY_NETWORK.MTN;
  }
});

/**
 * Fetch Cable TV packages from live ClubKonnect feed
 */
export const getCablePackages = action({
  args: { provider: v.string() }, // 'dstv', 'gotv', 'startimes'
  handler: async (ctx, args) => {
    const cableCode = getClubkonnectCableCode(args.provider);
    try {
      const url = `https://www.nellobytesystems.com/APICableTVPackagesV2.asp`;
      const res = await fetch(url);
      const data = await res.json();
      
      const keyMap: Record<string, string> = {
        dstv: "DStv",
        gotv: "GOtv",
        startimes: "StarTimes"
      };
      const targetKey = keyMap[cableCode] || "DStv";
      const providerList = data?.TV_ID?.[targetKey]?.[0]?.PRODUCT;
      if (Array.isArray(providerList)) {
        return providerList.map((p: any) => ({
          packageId: p.PACKAGE_ID,
          packageName: p.PACKAGE_NAME,
          price: Math.ceil(parseFloat(p.PACKAGE_AMOUNT) || 0),
        }));
      }
    } catch (e) {
      console.warn("Error fetching cable packages:", e);
    }

    // Default fallback packages
    if (cableCode === 'gotv') {
      return [
        { packageId: 'gotv-jinja', packageName: 'GOtv Jinja', price: 3300 },
        { packageId: 'gotv-jolli', packageName: 'GOtv Jolli', price: 4850 },
        { packageId: 'gotv-max', packageName: 'GOtv Max', price: 7200 },
        { packageId: 'gotv-supa', packageName: 'GOtv Supa', price: 9600 },
      ];
    }
    if (cableCode === 'startimes') {
      return [
        { packageId: 'nova-monthly', packageName: 'Nova Monthly', price: 1700 },
        { packageId: 'basic-monthly', packageName: 'Basic Monthly', price: 3300 },
        { packageId: 'smart-monthly', packageName: 'Smart Monthly', price: 4700 },
        { packageId: 'classic-monthly', packageName: 'Classic Monthly', price: 5500 },
      ];
    }
    return [
      { packageId: 'dstv-padi', packageName: 'DStv Padi', price: 4400 },
      { packageId: 'dstv-yanga', packageName: 'DStv Yanga', price: 6000 },
      { packageId: 'dstv-confam', packageName: 'DStv Confam', price: 11000 },
      { packageId: 'dstv-compact', packageName: 'DStv Compact', price: 19000 },
    ];
  }
});

/**
 * Verify Electricity Meter Number via ClubKonnect
 */
export const verifyElectricityMeter = action({
  args: {
    discoCode: v.string(), // e.g. "01" (EKEDC)
    meterNumber: v.string(),
    meterType: v.string(), // "Prepaid" or "Postpaid"
  },
  handler: async (ctx, args) => {
    const userId = process.env.CLUBKONNECT_USER_ID;
    const apiKey = process.env.CLUBKONNECT_API_KEY;

    if (!userId || !apiKey) {
      // In development or when credentials are not yet set, return simulated response for testing
      return {
        verified: true,
        customerName: `Customer #${args.meterNumber.slice(-4)} (Test Mode)`,
        address: "Warri, Delta State",
        meterNumber: args.meterNumber,
        meterType: args.meterType,
        discoCode: args.discoCode,
      };
    }

    try {
      const discoId = getClubkonnectDiscoCode(args.discoCode);
      const url = `https://www.nellobytesystems.com/APIVerifyElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoId}&MeterNo=${encodeURIComponent(args.meterNumber)}&MeterType=${encodeURIComponent(args.meterType)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && (data.customer_name || data.name || data.status === "ORDER_RECEIVED")) {
        return {
          verified: true,
          customerName: data.customer_name || data.name || "Verified Customer",
          address: data.address || "",
          meterNumber: args.meterNumber,
          meterType: args.meterType,
          discoCode: discoId,
        };
      } else {
        throw new Error(data?.status || data?.msg || "Could not verify meter number with distribution company.");
      }
    } catch (e: any) {
      throw new Error(e.message || "Failed to verify meter with provider.");
    }
  }
});

/**
 * Verify Cable TV Smartcard / IUC Number via ClubKonnect
 */
export const verifyCableSmartcard = action({
  args: {
    cableProvider: v.string(), // 'dstv', 'gotv', 'startimes'
    smartcardNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = process.env.CLUBKONNECT_USER_ID;
    const apiKey = process.env.CLUBKONNECT_API_KEY;

    if (!userId || !apiKey) {
      return {
        verified: true,
        customerName: `Subscriber #${args.smartcardNumber.slice(-4)} (Test Mode)`,
        smartcardNumber: args.smartcardNumber,
        cableProvider: args.cableProvider,
      };
    }

    try {
      const cableId = getClubkonnectCableCode(args.cableProvider);
      const url = `https://www.nellobytesystems.com/APIVerifyCableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableId}&SmartCardNo=${encodeURIComponent(args.smartcardNumber)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && (data.customer_name || data.name || data.status === "ORDER_RECEIVED")) {
        return {
          verified: true,
          customerName: data.customer_name || data.name || "Verified Subscriber",
          smartcardNumber: args.smartcardNumber,
          cableProvider: cableId,
        };
      } else {
        throw new Error(data?.status || data?.msg || "Invalid smartcard / IUC number for selected provider.");
      }
    } catch (e: any) {
      throw new Error(e.message || "Failed to verify smartcard with provider.");
    }
  }
});

/**
 * Requery ClubKonnect transaction status
 */
export const requeryTransactionStatus = action({
  args: {
    orderId: v.string(),
    marketTxId: v.id("marketTransactions"),
  },
  handler: async (ctx, args) => {
    const userId = process.env.CLUBKONNECT_USER_ID;
    const apiKey = process.env.CLUBKONNECT_API_KEY;

    if (!userId || !apiKey) {
      throw new Error("CLUBKONNECT credentials not configured");
    }

    const url = `https://www.nellobytesystems.com/APIQueryV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&OrderID=${encodeURIComponent(args.orderId)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    const statusCode = data?.statuscode?.toString();
    const statusText = (data?.status || '').toUpperCase();
    const isCompleted = statusCode === '200' || statusText.includes('ORDER_COMPLETED') || statusText === 'COMPLETED';
    const isFailed = statusCode === '300' || statusText.includes('CANCELLED') || statusText.includes('FAILED');

    const tx: any = await ctx.runQuery(internal.market.getMarketTxById, { id: args.marketTxId });
    if (tx && tx.metadata?.walletTxId) {
      if (isCompleted) {
        await ctx.runMutation(internal.market.updatePurchaseStatus, {
          userId: tx.userId,
          marketTxId: tx._id,
          walletTxId: tx.metadata.walletTxId,
          status: "COMPLETED",
          providerOrderId: args.orderId,
          token: data?.token || tx.token,
          units: data?.units || tx.units,
        });
      } else if (isFailed) {
        await ctx.runMutation(internal.market.updatePurchaseStatus, {
          userId: tx.userId,
          marketTxId: tx._id,
          walletTxId: tx.metadata.walletTxId,
          status: "FAILED",
          errorMessage: data?.msg || "Provider confirmed failed transaction",
        });
      }
    }

    return {
      status: isCompleted ? "COMPLETED" : isFailed ? "FAILED" : "PROCESSING",
      raw: data,
    };
  }
});

// internal query to resolve user
export const getUserByToken = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();
  }
});

export const getMarketTxById = internalQuery({
  args: { id: v.id("marketTransactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

// internal mutation to reserve balance and create pending transaction
export const initiatePurchase = internalMutation({
  args: {
    userId: v.id("users"),
    serviceCategory: v.string(), // 'airtime', 'data', 'electricity', 'cable'
    provider: v.string(), 
    customerIdentifier: v.string(), 
    product: v.optional(v.string()), 
    variationId: v.optional(v.string()),
    amount: v.number(),
    fee: v.number(),
    pin: v.string(),
    requestId: v.string(),
    network: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check idempotency
    const existing = await ctx.db
      .query("marketTransactions")
      .withIndex("by_request_id", q => q.eq("requestId", args.requestId))
      .first();
    if (existing) throw new Error("Duplicate request");

    // 2. Validate PIN format
    if (!/^\d{4}$/.test(args.pin)) {
      throw new Error("Invalid PIN format. PIN must be 4 digits.");
    }

    // 3. Get wallet
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
    
    if (!wallet) throw new Error("Wallet not found");

    // Verify PIN against saved wallet PIN if configured
    if (wallet.walletPin && wallet.walletPin.length === 4) {
      if (args.pin !== wallet.walletPin) {
        throw new Error("Incorrect wallet security PIN.");
      }
    }

    const totalAmount = args.amount + args.fee;
    if (wallet.balance < totalAmount) {
      throw new Error("Insufficient wallet balance.");
    }

    // 4. Reserve balance
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - totalAmount,
      updatedAt: Date.now()
    });

    // 5. Create Ledger Transaction
    const laLaoReference = `LAL-MKT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    const walletTxId = await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: args.userId,
      amount: totalAmount,
      fee: args.fee,
      type: "MARKET_PURCHASE",
      status: "pending",
      description: `${args.provider} ${args.serviceCategory} - ${args.customerIdentifier}`,
      assetType: "LALAO_CREDITS",
      currency: "LC",
      reference: laLaoReference,
      createdAt: Date.now(),
    });

    // 6. Create Market Transaction
    const marketTxId = await ctx.db.insert("marketTransactions", {
      userId: args.userId,
      type: "MARKET_PURCHASE",
      category: args.serviceCategory.toUpperCase(),
      provider: "clubkonnect",
      status: "PENDING",
      requestId: args.requestId,
      amount: args.amount,
      platformFee: args.fee,
      totalAmount: totalAmount,
      currency: "LC",
      recipient: args.customerIdentifier,
      network: args.network,
      variationId: args.variationId,
      productName: args.product,
      phone: args.serviceCategory === 'airtime' || args.serviceCategory === 'data' ? args.customerIdentifier : undefined,
      metadata: { walletTxId },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return { marketTxId, walletTxId, laLaoReference };
  }
});

// internal mutation to update transaction status
export const updatePurchaseStatus = internalMutation({
  args: {
    userId: v.id("users"),
    marketTxId: v.id("marketTransactions"),
    walletTxId: v.id("walletTransactions"),
    status: v.string(), // 'COMPLETED', 'FAILED', 'REFUNDED'
    providerOrderId: v.optional(v.string()),
    providerAmount: v.optional(v.number()),
    providerDiscount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    token: v.optional(v.string()),
    units: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const marketTx = await ctx.db.get(args.marketTxId);
    const walletTx = await ctx.db.get(args.walletTxId);
    
    if (!marketTx || !walletTx) throw new Error("Transaction not found");

    if (marketTx.status !== "PENDING" && marketTx.status !== "PROCESSING") {
      // Already finalized
      return;
    }

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
      
    if (!wallet) throw new Error("Wallet not found");

    if (args.status === "FAILED" || args.status === "REFUNDED") {
      // Create a refund ledger entry
      await ctx.db.insert("walletTransactions", {
        walletId: wallet._id,
        userId: args.userId,
        amount: marketTx.totalAmount,
        type: "MARKET_REFUND",
        status: "completed",
        description: `Refund for ${marketTx.category} - ${marketTx.recipient}`,
        assetType: "LALAO_CREDITS",
        currency: "LC",
        reference: `REF-${walletTx.reference}`,
        createdAt: Date.now(),
      });

      // Restore balance
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + marketTx.totalAmount,
        updatedAt: Date.now()
      });

      await ctx.db.patch(args.walletTxId, {
        status: args.status === "FAILED" ? "failed" : "refunded"
      });
      
      await ctx.db.patch(args.marketTxId, {
        status: args.status,
        providerOrderId: args.providerOrderId,
        errorMessage: args.errorMessage,
        updatedAt: Date.now(),
        refundedAt: Date.now()
      });

    } else if (args.status === "COMPLETED") {
      await ctx.db.patch(args.walletTxId, {
        status: "completed"
      });
      
      await ctx.db.patch(args.marketTxId, {
        status: "COMPLETED",
        providerOrderId: args.providerOrderId,
        providerAmount: args.providerAmount,
        providerDiscount: args.providerDiscount,
        token: args.token,
        units: args.units,
        updatedAt: Date.now(),
        completedAt: Date.now()
      });
    } else {
      // PROCESSING
      await ctx.db.patch(args.marketTxId, {
        status: "PROCESSING",
        providerOrderId: args.providerOrderId,
        updatedAt: Date.now()
      });
    }
  }
});

/**
 * Execute Purchase Action: Airtime, Data, Electricity, and Cable TV via ClubKonnect
 */
export const purchaseService = action({
  args: {
    serviceCategory: v.string(), // 'airtime', 'data', 'electricity', 'cable'
    provider: v.string(), 
    customerIdentifier: v.string(), 
    product: v.optional(v.string()), 
    variationId: v.optional(v.string()),
    amount: v.number(),
    fee: v.number(),
    pin: v.string(),
    network: v.optional(v.string()),
    meterType: v.optional(v.string()), // For electricity: Prepaid / Postpaid
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(internal.market.getUserByToken, { tokenIdentifier: identity.tokenIdentifier });
    if (!user) throw new Error("User not found");

    // Server-side service enablement check
    const serviceSettings: any = await ctx.runQuery(internal.market.getServiceSettingsInternal);
    const catConfig = serviceSettings[args.serviceCategory];
    if (catConfig && catConfig.enabled === false) {
      throw new Error(`The ${args.serviceCategory} service is currently disabled by administrator.`);
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Initiate purchase internally (deducts balance, creates pending tx)
    const { marketTxId, walletTxId } = await ctx.runMutation(internal.market.initiatePurchase, {
      userId: user._id,
      serviceCategory: args.serviceCategory,
      provider: args.provider,
      customerIdentifier: args.customerIdentifier,
      product: args.product,
      variationId: args.variationId,
      amount: args.amount,
      fee: args.fee,
      pin: args.pin,
      requestId,
      network: args.network,
    });

    try {
      // Test mode / Mock fallback
      if (MOCK_PROVIDER) {
        if (args.customerIdentifier.endsWith('999')) {
          await ctx.runMutation(internal.market.updatePurchaseStatus, {
            userId: user._id, marketTxId, walletTxId, status: "FAILED", errorMessage: "Provider rejected transaction."
          });
          return { success: false, status: 'FAILED', message: 'Provider rejected transaction.' };
        }
        
        await ctx.runMutation(internal.market.updatePurchaseStatus, {
          userId: user._id, marketTxId, walletTxId, status: "COMPLETED", providerOrderId: `mock_${Date.now()}`,
          token: args.serviceCategory === 'electricity' ? '1234-5678-9012-3456-7890' : undefined,
          units: args.serviceCategory === 'electricity' ? '28.5 kWh' : undefined,
        });
        return { 
          success: true, 
          status: 'COMPLETED', 
          message: 'Transaction successful',
          token: args.serviceCategory === 'electricity' ? '1234-5678-9012-3456-7890' : undefined
        };
      }

      // Live ClubKonnect Purchase Request
      if (CLUBKONNECT_USER_ID && CLUBKONNECT_API_KEY) {
        let apiUrl = '';

        if (args.serviceCategory === 'airtime') {
          const netCode = getClubkonnectNetworkCode(args.network || args.provider);
          apiUrl = `https://www.nellobytesystems.com/APIAirtimeV1.asp?UserID=${encodeURIComponent(CLUBKONNECT_USER_ID)}&APIKey=${encodeURIComponent(CLUBKONNECT_API_KEY)}&MobileNetwork=${netCode}&Amount=${args.amount}&MobileNumber=${encodeURIComponent(args.customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (args.serviceCategory === 'data') {
          const netCode = getClubkonnectNetworkCode(args.network || args.provider);
          const planCode = args.variationId || '1000';
          apiUrl = `https://www.nellobytesystems.com/APIDatabundleV1.asp?UserID=${encodeURIComponent(CLUBKONNECT_USER_ID)}&APIKey=${encodeURIComponent(CLUBKONNECT_API_KEY)}&MobileNetwork=${netCode}&DataPlan=${encodeURIComponent(planCode)}&MobileNumber=${encodeURIComponent(args.customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (args.serviceCategory === 'electricity') {
          const discoCode = getClubkonnectDiscoCode(args.provider);
          const meterType = args.meterType || "Prepaid";
          apiUrl = `https://www.nellobytesystems.com/APIElectricityV1.asp?UserID=${encodeURIComponent(CLUBKONNECT_USER_ID)}&APIKey=${encodeURIComponent(CLUBKONNECT_API_KEY)}&ElectricCompany=${discoCode}&MeterType=${encodeURIComponent(meterType)}&MeterNo=${encodeURIComponent(args.customerIdentifier)}&Amount=${args.amount}&RequestID=${encodeURIComponent(requestId)}`;
        } else if (args.serviceCategory === 'cable') {
          const cableCode = getClubkonnectCableCode(args.provider);
          const packageId = args.variationId || 'dstv-padi';
          apiUrl = `https://www.nellobytesystems.com/APICableTVV1.asp?UserID=${encodeURIComponent(CLUBKONNECT_USER_ID)}&APIKey=${encodeURIComponent(CLUBKONNECT_API_KEY)}&CableTV=${cableCode}&Package=${encodeURIComponent(packageId)}&SmartCardNo=${encodeURIComponent(args.customerIdentifier)}&RequestID=${encodeURIComponent(requestId)}`;
        } else {
          throw new Error(`Unsupported service category: ${args.serviceCategory}`);
        }

        console.log(`[Clubkonnect] Executing ${args.serviceCategory} request:`, { requestId, customer: args.customerIdentifier, amount: args.amount });

        const ckRaw = await fetch(apiUrl);
        const ckResponse = await ckRaw.json().catch(() => null);

        console.log(`[Clubkonnect] Provider Response:`, ckResponse);

        // Status code 100 = ORDER_RECEIVED, 200 = ORDER_COMPLETED
        const statusCode = ckResponse?.statuscode?.toString();
        const statusText = (ckResponse?.status || '').toUpperCase();
        const isSuccess = statusCode === '100' || statusCode === '200' || statusText.includes('ORDER_RECEIVED') || statusText.includes('ORDER_COMPLETED');

        if (isSuccess) {
          const token = ckResponse?.metertoken || ckResponse?.token;
          const units = ckResponse?.units;
          await ctx.runMutation(internal.market.updatePurchaseStatus, {
            userId: user._id, marketTxId, walletTxId, status: "COMPLETED",
            providerOrderId: ckResponse?.orderid?.toString() || `ck_${Date.now()}`,
            providerAmount: ckResponse?.amountcharged ? parseFloat(ckResponse.amountcharged) : args.amount,
            providerDiscount: ckResponse?.discount ? parseFloat(ckResponse.discount) : 0,
            token,
            units,
          });
          return { 
            success: true, 
            status: 'COMPLETED', 
            message: 'Transaction successful',
            token,
            units,
            orderId: ckResponse?.orderid?.toString()
          };
        } else {
          const errMsg = ckResponse?.msg || ckResponse?.remark || ckResponse?.status || 'Provider transaction failed';
          await ctx.runMutation(internal.market.updatePurchaseStatus, {
            userId: user._id, marketTxId, walletTxId, status: "FAILED", errorMessage: errMsg
          });
          return { success: false, status: 'FAILED', message: errMsg };
        }
      }

      throw new Error("ClubKonnect provider is not configured. Set CLUBKONNECT_USER_ID and CLUBKONNECT_API_KEY in backend secrets.");

    } catch (e: any) {
      await ctx.runMutation(internal.market.updatePurchaseStatus, {
        userId: user._id, marketTxId, walletTxId, status: "PROCESSING", errorMessage: e.message
      });
      return { success: false, status: 'PROCESSING', message: "Transaction is taking longer than expected. We will notify you once completed." };
    }
  }
});

export const getServiceSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "bill_payment_services"))
      .first();

    if (!record) return DEFAULT_SERVICE_SETTINGS;
    try {
      return { ...DEFAULT_SERVICE_SETTINGS, ...JSON.parse(record.value) };
    } catch {
      return DEFAULT_SERVICE_SETTINGS;
    }
  }
});
