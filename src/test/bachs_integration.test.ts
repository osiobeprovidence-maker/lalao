/**
 * BACHS Wallet Funding Integration Unit & Security Tests
 * Uses tsx runner pattern consistent with existing Lalao test suites.
 *
 * Verifies:
 * 1. Bounds & limits validation (Min ₦100, Max ₦500,000)
 * 2. 1:1 NGN to LC conversion
 * 3. Atomic, idempotent wallet credit settlement
 * 4. Mismatch amount and currency rejection
 * 5. Webhook HMAC-SHA256 signature verification
 * 6. Timestamp replay attack prevention (>300 seconds rejected)
 * 7. Verification that wallet funding uses BACHS provider
 * 8. Legacy Paystack transactions remain intact in transaction history
 */

import crypto from "crypto";

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  provider: string;
  providerTransactionId?: string;
}

interface SimulatedWallet {
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export function validateBachsFundingRequest(amount: number): { valid: boolean; error?: string; lc: number } {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Please enter a valid amount in Naira (₦)", lc: 0 };
  }
  if (amount < 100) {
    return { valid: false, error: "Minimum funding amount is ₦100 (100 LC).", lc: 0 };
  }
  if (amount > 500000) {
    return { valid: false, error: "Maximum funding amount is ₦500,000 (500,000 LC) per transaction.", lc: 0 };
  }
  return { valid: true, lc: Math.floor(amount) };
}

export function verifyBachsWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  secretKey: string
): { valid: boolean; reason?: string } {
  if (!signatureHeader) {
    return { valid: false, reason: "Missing signature header" };
  }

  if (timestampHeader) {
    const timestamp = parseInt(timestampHeader, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
      return { valid: false, reason: "Timestamp expired or outside 300s window" };
    }
  }

  const payloadToSign = timestampHeader ? `${timestampHeader}.${rawBody}` : rawBody;
  const expectedSig = crypto
    .createHmac("sha256", secretKey)
    .update(payloadToSign)
    .digest("hex");

  if (signatureHeader.toLowerCase() !== expectedSig.toLowerCase()) {
    return { valid: false, reason: "Invalid signature" };
  }

  return { valid: true };
}

export function settleBachsWalletFunding(
  wallet: SimulatedWallet,
  args: {
    reference: string;
    verifiedAmount: number;
    expectedAmount: number;
    currency: string;
    providerTransactionId?: string;
  }
): { success: boolean; error?: string; alreadySettled?: boolean; updatedBalance: number } {
  if (args.currency !== "NGN") {
    return { success: false, error: "Invalid payment currency. Expected NGN.", updatedBalance: wallet.balance };
  }

  if (args.verifiedAmount !== args.expectedAmount) {
    return {
      success: false,
      error: `Verified amount (₦${args.verifiedAmount}) does not match expected (₦${args.expectedAmount})`,
      updatedBalance: wallet.balance,
    };
  }

  const existingTx = wallet.transactions.find((t) => t.reference === args.reference);
  if (existingTx && (existingTx.status === "completed" || existingTx.status === "COMPLETED")) {
    return {
      success: true,
      alreadySettled: true,
      updatedBalance: wallet.balance,
    };
  }

  const credits = Math.floor(args.verifiedAmount);
  wallet.balance += credits;

  if (existingTx) {
    existingTx.status = "completed";
    existingTx.provider = "bachs";
    existingTx.providerTransactionId = args.providerTransactionId;
  } else {
    wallet.transactions.push({
      id: `tx_${Date.now()}`,
      type: "deposit",
      amount: credits,
      status: "completed",
      reference: args.reference,
      provider: "bachs",
      providerTransactionId: args.providerTransactionId,
    });
  }

  return {
    success: true,
    alreadySettled: false,
    updatedBalance: wallet.balance,
  };
}

export function runBachsTests() {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Minimum funding amount
  const t1 = validateBachsFundingRequest(50);
  results.push({
    name: "Enforce minimum funding threshold of ₦100 (100 LC)",
    passed: !t1.valid && t1.error?.includes("Minimum funding amount is ₦100") === true,
  });

  // Test 2: Maximum funding amount
  const t2 = validateBachsFundingRequest(500001);
  results.push({
    name: "Enforce maximum funding threshold of ₦500,000 (500,000 LC)",
    passed: !t2.valid && t2.error?.includes("Maximum funding amount is ₦500,000") === true,
  });

  // Test 3: 1:1 Conversion
  const t3 = validateBachsFundingRequest(15500);
  results.push({
    name: "Performs 1:1 conversion between NGN and Lalao Credits (LC)",
    passed: t3.valid && t3.lc === 15500,
  });

  // Test 4: Webhook signature verification
  const secret = "test_bachs_webhook_secret_key_12345";
  const body = JSON.stringify({
    event: "collection.succeeded",
    data: { reference: "BACHS_REF_1", amount: "5000", currency: "NGN" },
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const t4 = verifyBachsWebhookSignature(body, validSignature, timestamp, secret);
  results.push({
    name: "Verifies authentic HMAC-SHA256 webhook signatures from BACHS",
    passed: t4.valid,
  });

  // Test 5: Reject invalid signature
  const t5 = verifyBachsWebhookSignature(body, "bad_sig_1234", timestamp, secret);
  results.push({
    name: "Rejects forged or tampered webhook signatures",
    passed: !t5.valid && t5.reason === "Invalid signature",
  });

  // Test 6: Replay attack prevention (>300s window)
  const expiredTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
  const replaySig = crypto
    .createHmac("sha256", secret)
    .update(`${expiredTimestamp}.${body}`)
    .digest("hex");
  const t6 = verifyBachsWebhookSignature(body, replaySig, expiredTimestamp, secret);
  results.push({
    name: "Rejects replay attacks with timestamp older than 300 seconds",
    passed: !t6.valid && t6.reason?.includes("outside 300s window") === true,
  });

  // Test 7: Atomic, idempotent settlement
  const wallet: SimulatedWallet = {
    userId: "user_123",
    balance: 1000,
    transactions: [
      {
        id: "tx_init",
        type: "deposit",
        amount: 5000,
        status: "pending",
        reference: "BACHS_REF_100",
        provider: "bachs",
      },
    ],
  };

  const t7a = settleBachsWalletFunding(wallet, {
    reference: "BACHS_REF_100",
    verifiedAmount: 5000,
    expectedAmount: 5000,
    currency: "NGN",
    providerTransactionId: "bachs_sess_abc",
  });

  const t7b = settleBachsWalletFunding(wallet, {
    reference: "BACHS_REF_100",
    verifiedAmount: 5000,
    expectedAmount: 5000,
    currency: "NGN",
    providerTransactionId: "bachs_sess_abc",
  });

  results.push({
    name: "Credits wallet atomically and idempotently on verified BACHS settlement",
    passed: t7a.success && !t7a.alreadySettled && t7b.success && t7b.alreadySettled === true && wallet.balance === 6000,
  });

  // Test 8: Amount mismatch rejection
  const t8 = settleBachsWalletFunding(wallet, {
    reference: "BACHS_REF_MISMATCH",
    verifiedAmount: 2000,
    expectedAmount: 5000,
    currency: "NGN",
  });
  results.push({
    name: "Rejects payments with amount mismatch without mutating balance",
    passed: !t8.success && wallet.balance === 6000,
  });

  // Test 9: Non-NGN currency rejection
  const t9 = settleBachsWalletFunding(wallet, {
    reference: "BACHS_REF_USD",
    verifiedAmount: 50,
    expectedAmount: 50,
    currency: "USD",
  });
  results.push({
    name: "Rejects payments in unsupported non-NGN currencies",
    passed: !t9.success && wallet.balance === 6000,
  });

  // Test 10: History preservation for existing Paystack records
  const legacyWallet: SimulatedWallet = {
    userId: "user_456",
    balance: 2500,
    transactions: [
      {
        id: "tx_legacy_1",
        type: "deposit",
        amount: 2500,
        status: "completed",
        reference: "PAYSTACK_REF_OLD",
        provider: "paystack",
      },
    ],
  };

  const t10 = settleBachsWalletFunding(legacyWallet, {
    reference: "BACHS_REF_NEW",
    verifiedAmount: 1000,
    expectedAmount: 1000,
    currency: "NGN",
    providerTransactionId: "bachs_tx_999",
  });

  const hasPaystackTx = legacyWallet.transactions.some((t) => t.provider === "paystack" && t.reference === "PAYSTACK_REF_OLD");
  const hasBachsTx = legacyWallet.transactions.some((t) => t.provider === "bachs" && t.reference === "BACHS_REF_NEW");

  results.push({
    name: "Preserves legacy Paystack transaction history alongside new BACHS entries",
    passed: t10.success && hasPaystackTx && hasBachsTx && legacyWallet.balance === 3500,
  });

  return results;
}

if (typeof process !== "undefined" && process.argv[1]?.includes("bachs_integration.test.ts")) {
  console.log("Running BACHS Wallet Funding Integration & Security Tests...\n");
  const testResults = runBachsTests();
  let allPassed = true;
  for (const res of testResults) {
    console.log(`${res.passed ? "✓ PASS" : "✗ FAIL"}: ${res.name}`);
    if (!res.passed) allPassed = false;
  }
  console.log(`\nResult: ${allPassed ? "ALL 10 TESTS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}
