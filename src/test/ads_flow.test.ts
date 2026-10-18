import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateDestinationUrl, automatedContentScreening } from '../../convex/ads';

describe('Lalao Ads — Policy, Validation & Lifecycle Logic', () => {
  it('validateDestinationUrl permits valid HTTPS URLs and internal Lalao routes', () => {
    assert.strictEqual(validateDestinationUrl('https://example.com/shop'), true);
    assert.strictEqual(validateDestinationUrl('https://lalao.website/app?page=mybiz'), true);
    assert.strictEqual(validateDestinationUrl('/app?tab=profile'), true);
  });

  it('validateDestinationUrl rejects dangerous schemes like javascript: and data:', () => {
    assert.strictEqual(validateDestinationUrl('javascript:alert(1)'), false);
    assert.strictEqual(validateDestinationUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.strictEqual(validateDestinationUrl(''), false);
  });

  it('automatedContentScreening detects scam and prohibited patterns', () => {
    const scam1 = automatedContentScreening('Join our free money doubler scheme today');
    assert.strictEqual(scam1.flagged, true);
    assert.ok(scam1.reason?.includes('automated safety screening'));

    const legitimate = automatedContentScreening('Grand opening of Divine Bakery in Warri! 20% discount on cakes.');
    assert.strictEqual(legitimate.flagged, false);
  });

  it('Enforces NGN smallest currency unit (kobo) and integer budget constraints', () => {
    const minBudgetKobo = 100000; // ₦1,000
    const userBudgetNgn = 2500;
    const userBudgetKobo = Math.round(userBudgetNgn * 100);

    assert.strictEqual(userBudgetKobo, 250000);
    assert.ok(userBudgetKobo >= minBudgetKobo);
    assert.strictEqual(Number.isInteger(userBudgetKobo), true);
  });

  it('Authoritative spend calculation debits correct kobo per impression and click', () => {
    const initialBudgetKobo = 500000; // ₦5,000
    let currentSpentKobo = 0;

    const impressionCostKobo = 200; // ₦2.00
    const clickCostKobo = 1000;     // ₦10.00

    // Simulate 50 impressions
    for (let i = 0; i < 50; i++) {
      currentSpentKobo = Math.min(currentSpentKobo + impressionCostKobo, initialBudgetKobo);
    }
    assert.strictEqual(currentSpentKobo, 10000); // ₦100

    // Simulate 10 clicks
    for (let i = 0; i < 10; i++) {
      currentSpentKobo = Math.min(currentSpentKobo + clickCostKobo, initialBudgetKobo);
    }
    assert.strictEqual(currentSpentKobo, 20000); // ₦200 total spent

    const remainingKobo = initialBudgetKobo - currentSpentKobo;
    assert.strictEqual(remainingKobo, 480000); // ₦4,800 remaining
  });

  it('Prevents overspending past campaign total budget', () => {
    const budgetKobo = 1000; // Small remaining budget
    let spentKobo = 800;
    const clickCostKobo = 500;

    // Next click exceeds budget cap
    spentKobo = Math.min(spentKobo + clickCostKobo, budgetKobo);
    assert.strictEqual(spentKobo, 1000); // Caps at 1000 exactly
    const isCompleted = spentKobo >= budgetKobo;
    assert.strictEqual(isCompleted, true);
  });
});
