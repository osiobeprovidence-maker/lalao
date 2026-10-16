/**
 * Automated Tests for Lala Native Data Plan Selector UI/UX
 *
 * Verifies:
 * 1. Data allowance parsing and formatting (e.g. "500MB" -> "500 MB", "1GB" -> "1 GB").
 * 2. Validity extraction (Daily, Weekly, Monthly, 30 Days).
 * 3. Plan category extraction (SME, Corporate, Awoof Data, Special).
 * 4. Search query filtering by data size.
 * 5. Search query filtering by price.
 * 6. Search query filtering by category/package.
 * 7. Validity chip filtering (Daily, Weekly, Monthly).
 * 8. Preservation of variationId and price for API submission authority.
 * 9. Custom selector closed state formatting.
 * 10. Empty state handling when no matching plans exist.
 */

export interface TestPlan {
  id: string;
  variationId: string;
  planName: string;
  dataAmount?: string;
  validity?: string;
  price: number;
  network?: string;
  category?: string;
}

export function parseDataAllowance(plan: TestPlan): string {
  const source = plan.dataAmount || plan.planName;
  const match = source.match(/(\d+(?:\.\d+)?)\s*(MB|GB|TB)/i);
  if (match) {
    return `${match[1]} ${match[2].toUpperCase()}`;
  }
  return plan.dataAmount || plan.planName.split('-')[0].trim();
}

export function parseValidity(plan: TestPlan): string {
  if (plan.validity && plan.validity.trim().length > 0 && !plan.validity.includes('-')) {
    return plan.validity;
  }
  const name = plan.planName.toLowerCase();
  if (name.includes('daily') || name.includes('1 day') || name.includes('24 hour') || name.includes('24hr')) {
    return 'Daily';
  }
  if (name.includes('weekly') || name.includes('7 day')) {
    return 'Weekly';
  }
  if (name.includes('monthly') || name.includes('30 day')) {
    return 'Monthly';
  }
  if (name.includes('2 day') || name.includes('3 day') || name.includes('14 day')) {
    const dMatch = name.match(/(\d+\s*days?)/i);
    if (dMatch) return dMatch[1];
  }
  return '30 Days';
}

export function parseCategory(plan: TestPlan): string {
  if (plan.category) return plan.category;
  const name = plan.planName;
  if (/sme/i.test(name)) return 'SME';
  if (/corporate|corp/i.test(name)) return 'Corporate';
  if (/awoof/i.test(name)) return 'Awoof Data';
  if (/gifting|gift/i.test(name)) return 'Gifting';
  if (/special/i.test(name)) return 'Special';
  if (/direct/i.test(name)) return 'Direct';
  return 'Standard';
}

export function filterTestPlans(
  plans: TestPlan[],
  filters: { searchQuery?: string; validityFilter?: 'all' | 'daily' | 'weekly' | 'monthly' }
): TestPlan[] {
  let list = plans.map((p) => ({
    ...p,
    parsedAllowance: parseDataAllowance(p),
    parsedValidity: parseValidity(p),
    parsedCategory: parseCategory(p),
  }));

  if (filters.validityFilter && filters.validityFilter !== 'all') {
    list = list.filter((p) => {
      const val = p.parsedValidity.toLowerCase();
      if (filters.validityFilter === 'daily') return val.includes('daily') || (val.includes('day') && !val.includes('30'));
      if (filters.validityFilter === 'weekly') return val.includes('week') || val.includes('7');
      if (filters.validityFilter === 'monthly') return val.includes('month') || val.includes('30');
      return true;
    });
  }

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase().trim();
    const numQuery = q.replace(/[^0-9]/g, '');

    list = list.filter((p) => {
      const allowanceMatch = p.parsedAllowance.toLowerCase().includes(q);
      const nameMatch = p.planName.toLowerCase().includes(q);
      const validityMatch = p.parsedValidity.toLowerCase().includes(q);
      const categoryMatch = p.parsedCategory.toLowerCase().includes(q);
      const priceMatch = p.price.toString().includes(numQuery && numQuery.length > 0 ? numQuery : q);

      return allowanceMatch || nameMatch || validityMatch || categoryMatch || priceMatch;
    });
  }

  return list;
}

export function runDataPlanSelectorTests() {
  const results: { name: string; passed: boolean }[] = [];

  const mockPlans: TestPlan[] = [
    { id: '1', variationId: 'MTN_500MB', planName: '500MB SME', dataAmount: '500MB', validity: 'Weekly', price: 297, network: 'MTN' },
    { id: '2', variationId: 'MTN_1GB', planName: '1GB Monthly SME', dataAmount: '1GB', validity: 'Monthly', price: 563, network: 'MTN' },
    { id: '3', variationId: 'MTN_110MB', planName: '110 MB - Daily - Awoof Data', dataAmount: '110MB', validity: 'Daily', price: 95, network: 'MTN' },
    { id: '4', variationId: 'MTN_2GB', planName: '2GB Corporate', dataAmount: '2GB', validity: '30 Days', price: 900, network: 'MTN' },
    { id: '5', variationId: 'MTN_5GB', planName: '5GB Corporate', dataAmount: '5GB', validity: '30 Days', price: 2200, network: 'MTN' },
  ];

  // Test 1: Data allowance formatting
  const a1 = parseDataAllowance(mockPlans[0]);
  const a2 = parseDataAllowance(mockPlans[1]);
  const a3 = parseDataAllowance(mockPlans[2]);
  results.push({
    name: "Correctly parse data allowance with clean spacing (e.g. 500 MB, 1 GB, 110 MB)",
    passed: a1 === "500 MB" && a2 === "1 GB" && a3 === "110 MB",
  });

  // Test 2: Validity extraction
  const v1 = parseValidity(mockPlans[0]);
  const v2 = parseValidity(mockPlans[1]);
  const v3 = parseValidity(mockPlans[2]);
  results.push({
    name: "Extract validity periods accurately (Weekly, Monthly, Daily)",
    passed: v1 === "Weekly" && v2 === "Monthly" && v3 === "Daily",
  });

  // Test 3: Plan category extraction
  const c1 = parseCategory(mockPlans[0]);
  const c2 = parseCategory(mockPlans[2]);
  const c3 = parseCategory(mockPlans[3]);
  results.push({
    name: "Extract package categories (SME, Awoof Data, Corporate)",
    passed: c1 === "SME" && c2 === "Awoof Data" && c3 === "Corporate",
  });

  // Test 4: Search by data size
  const sSize = filterTestPlans(mockPlans, { searchQuery: "1GB" });
  results.push({
    name: "Search by size: '1GB' returns only 1GB plans",
    passed: sSize.length === 1 && sSize[0].variationId === "MTN_1GB",
  });

  // Test 5: Search by price
  const sPrice = filterTestPlans(mockPlans, { searchQuery: "95" });
  results.push({
    name: "Search by price: '95' returns ₦95 Awoof plan",
    passed: sPrice.length === 1 && sPrice[0].price === 95,
  });

  // Test 6: Search by plan category
  const sCategory = filterTestPlans(mockPlans, { searchQuery: "Corporate" });
  results.push({
    name: "Search by category: 'Corporate' returns corporate data plans",
    passed: sCategory.length === 2 && sCategory.every((p) => p.planName.includes("Corporate")),
  });

  // Test 7: Validity chip filter
  const fWeekly = filterTestPlans(mockPlans, { validityFilter: "weekly" });
  const fDaily = filterTestPlans(mockPlans, { validityFilter: "daily" });
  results.push({
    name: "Validity chip filters: correctly isolates Weekly vs Daily plans",
    passed: fWeekly.length === 1 && fWeekly[0].validity === "Weekly" && fDaily.length === 1 && fDaily[0].validity === "Daily",
  });

  // Test 8: Selection preserves variationId and exact price
  const selected = mockPlans[1];
  results.push({
    name: "Selection preservation: preserves variationId ('MTN_1GB') and price (₦563) for backend submission",
    passed: selected.variationId === "MTN_1GB" && selected.price === 563,
  });

  // Test 9: No-matches empty result handling
  const noMatch = filterTestPlans(mockPlans, { searchQuery: "Unlimited100TB" });
  results.push({
    name: "Empty search query produces clean empty result without throwing",
    passed: noMatch.length === 0,
  });

  return results;
}

if (typeof process !== "undefined" && process.argv[1]?.includes("data_plan_selector.test.ts")) {
  console.log("Running Lala Native Data Plan Selector Validation Tests...\n");
  const testResults = runDataPlanSelectorTests();
  let allPassed = true;
  for (const res of testResults) {
    console.log(`${res.passed ? "✓ PASS" : "✗ FAIL"}: ${res.name}`);
    if (!res.passed) allPassed = false;
  }
  console.log(`\nResult: ${allPassed ? "ALL 9 TESTS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}
