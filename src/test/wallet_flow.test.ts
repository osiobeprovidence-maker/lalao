/**
 * Wallet Funding and VTU Purchase Flow Validation Tests
 * Verifies business logic, limits, phone validation, idempotency, and conversion formulas.
 */

// 1. Currency Conversion & Funding Limits
export function validateFundingAmount(amountNaira: number): { valid: boolean; error?: string; lc: number } {
  if (isNaN(amountNaira) || amountNaira <= 0) {
    return { valid: false, error: "Please enter a valid amount in Naira (₦)", lc: 0 };
  }
  if (amountNaira < 100) {
    return { valid: false, error: "Minimum funding amount is ₦100", lc: 0 };
  }
  if (amountNaira > 500000) {
    return { valid: false, error: "Maximum funding amount per transaction is ₦500,000", lc: 0 };
  }
  // 1 Naira (₦1) = 1 LaLao Credit (1 LC)
  const lc = Math.floor(amountNaira);
  return { valid: true, lc };
}

// 2. Nigerian Phone Number Validation
export function validateNigerianPhone(phone: string): { valid: boolean; formatted: string } {
  const cleaned = phone.replace(/[\s-]/g, "");
  // Accept 070, 080, 081, 090, 091 (11 digits) or +234 equivalent (13-14 chars)
  const regex = /^(?:\+?234|0)([789][01]\d{8})$/;
  const match = cleaned.match(regex);
  if (!match) {
    return { valid: false, formatted: phone };
  }
  return { valid: true, formatted: "0" + match[1] };
}

// 3. VTU Purchase Balance & Deductions Simulation
export interface SimulatedWallet {
  balance: number;
  transactions: Array<{ id: string; type: string; amount: number; status: string; reference: string }>;
}

export function simulateVTUPurchase(
  wallet: SimulatedWallet,
  costLC: number,
  requestId: string,
  serviceType: "airtime" | "data"
): { success: boolean; error?: string; updatedBalance: number } {
  // Check for duplicate request ID
  const existing = wallet.transactions.find((t) => t.reference === requestId);
  if (existing) {
    return { success: false, error: "Duplicate request ID detected", updatedBalance: wallet.balance };
  }

  if (wallet.balance < costLC) {
    return { success: false, error: "Insufficient wallet balance", updatedBalance: wallet.balance };
  }

  // Atomically deduct
  wallet.balance -= costLC;
  wallet.transactions.push({
    id: `tx_${Date.now()}`,
    type: `vtu_${serviceType}`,
    amount: costLC,
    status: "COMPLETED",
    reference: requestId,
  });

  return { success: true, updatedBalance: wallet.balance };
}

// 4. Refund on Provider Failure
export function simulateVTURefund(
  wallet: SimulatedWallet,
  originalRequestId: string,
  refundReason: string
): { success: boolean; error?: string; updatedBalance: number } {
  const originalTx = wallet.transactions.find((t) => t.reference === originalRequestId);
  if (!originalTx) {
    return { success: false, error: "Original transaction not found", updatedBalance: wallet.balance };
  }
  if (originalTx.status === "REFUNDED") {
    return { success: false, error: "Transaction already refunded", updatedBalance: wallet.balance };
  }

  originalTx.status = "REFUNDED";
  wallet.balance += originalTx.amount;
  wallet.transactions.push({
    id: `ref_${Date.now()}`,
    type: "vtu_refund",
    amount: originalTx.amount,
    status: "COMPLETED",
    reference: `refund_${originalRequestId}`,
  });

  return { success: true, updatedBalance: wallet.balance };
}

// 5. Idempotent provider credit settlement
export function simulateProviderSettlement(
  wallet: SimulatedWallet,
  reference: string,
  paidAmountNaira: number,
  expectedAmountNaira: number
): { success: boolean; error?: string; updatedBalance: number } {
  if (paidAmountNaira !== expectedAmountNaira) {
    return { success: false, error: "Amount mismatch detected", updatedBalance: wallet.balance };
  }

  const existingTx = wallet.transactions.find((t) => t.reference === reference);
  if (existingTx && existingTx.status === "COMPLETED") {
    // Idempotent: do not credit twice
    return { success: true, error: "Already settled (idempotent)", updatedBalance: wallet.balance };
  }

  const credits = Math.floor(paidAmountNaira);
  wallet.balance += credits;

  if (existingTx) {
    existingTx.status = "COMPLETED";
  } else {
    wallet.transactions.push({
      id: `tx_${Date.now()}`,
      type: "deposit",
      amount: credits,
      status: "COMPLETED",
      reference,
    });
  }

  return { success: true, updatedBalance: wallet.balance };
}

// Test Suite Runner
export function runAllTests() {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Minimum funding amount
  const t1 = validateFundingAmount(50);
  results.push({
    name: "Reject funding below ₦100",
    passed: !t1.valid && t1.error?.includes("Minimum") === true,
  });

  // Test 2: Maximum funding amount
  const t2 = validateFundingAmount(600000);
  results.push({
    name: "Reject funding above ₦500,000",
    passed: !t2.valid && t2.error?.includes("Maximum") === true,
  });

  // Test 3: Valid funding amount conversion
  const t3 = validateFundingAmount(2500);
  results.push({
    name: "1:1 Conversion: ₦2,500 = 2,500 LC",
    passed: t3.valid && t3.lc === 2500,
  });

  // Test 4: Nigerian phone validation
  const t4a = validateNigerianPhone("08012345678");
  const t4b = validateNigerianPhone("+2348123456789");
  const t4c = validateNigerianPhone("01234567");
  results.push({
    name: "Validate Nigerian Phone numbers",
    passed: t4a.valid && t4a.formatted === "08012345678" && t4b.valid && !t4c.valid,
  });

  // Test 5: Insufficient balance VTU purchase
  const mockWallet: SimulatedWallet = { balance: 500, transactions: [] };
  const t5 = simulateVTUPurchase(mockWallet, 1000, "req_1", "airtime");
  results.push({
    name: "Reject VTU purchase on insufficient balance",
    passed: !t5.success && mockWallet.balance === 500,
  });

  // Test 6: Successful VTU purchase deduction
  const t6 = simulateVTUPurchase(mockWallet, 300, "req_2", "airtime");
  results.push({
    name: "Atomically deduct balance on valid purchase",
    passed: t6.success && mockWallet.balance === 200,
  });

  // Test 7: Prevent duplicate purchase request ID
  const t7 = simulateVTUPurchase(mockWallet, 100, "req_2", "airtime");
  results.push({
    name: "Reject duplicate VTU requestId",
    passed: !t7.success && mockWallet.balance === 200,
  });

  // Test 8: Safe refund on provider failure
  const t8 = simulateVTURefund(mockWallet, "req_2", "Provider gateway error");
  results.push({
    name: "Refund balance and record ledger entry on provider failure",
    passed: t8.success && mockWallet.balance === 500,
  });

  // Test 9: Prevent duplicate refund
  const t9 = simulateVTURefund(mockWallet, "req_2", "Second refund attempt");
  results.push({
    name: "Prevent duplicate refunds",
    passed: !t9.success && mockWallet.balance === 500,
  });

  // Test 10: Idempotent provider settlement
  const fundingWallet: SimulatedWallet = { balance: 1000, transactions: [] };
  const t10a = simulateProviderSettlement(fundingWallet, "PAY_REF_123", 5000, 5000);
  const t10b = simulateProviderSettlement(fundingWallet, "PAY_REF_123", 5000, 5000);
  results.push({
    name: "Provider settlement is strictly idempotent",
    passed: t10a.success && t10b.success && fundingWallet.balance === 6000,
  });

  // Test 11: Mismatched payment amount rejection
  const t11 = simulateProviderSettlement(fundingWallet, "PAY_REF_999", 2000, 5000);
  results.push({
    name: "Reject provider settlement when paid amount does not match expected",
    passed: !t11.success && fundingWallet.balance === 6000,
  });

  return results;
}

if (typeof process !== "undefined" && process.argv[1]?.includes("wallet_flow.test.ts")) {
  console.log("Running Wallet & VTU Automated Tests...\n");
  const testResults = runAllTests();
  let allPassed = true;
  for (const res of testResults) {
    console.log(`${res.passed ? "✓ PASS" : "✗ FAIL"}: ${res.name}`);
    if (!res.passed) allPassed = false;
  }
  console.log(`\nResult: ${allPassed ? "ALL 11 TESTS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}
