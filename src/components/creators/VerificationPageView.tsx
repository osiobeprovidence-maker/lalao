import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  AlertCircle,
  Clock,
  Briefcase,
  BadgeCheck,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { VerificationTier } from '../../types';

export const VerificationPageView: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    triggerShareToast,
    openCreatorHub,
    isCreatorPremiumActive,
    subscription,
    cancelUserSubscription,
    creatorSubscriptionInitialTier,
  } = useLalao();

  const [selectedTier, setSelectedTier] = useState<VerificationTier>(
    creatorSubscriptionInitialTier || 'creator'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tiersConfig = useQuery(api.creators.getCreatorTiers);
  const beginTierPurchase = useMutation(api.creators.beginBachsTierPurchase);
  const initializeBachsPayment = useAction(api.bachs.initializeBachsPayment);
  const attachCheckout = useMutation(api.creators.attachBachsTierCheckout);

  // Selected tier configuration
  const currentSelectedConfig = tiersConfig?.find((t) => t.id === selectedTier) || {
    id: selectedTier,
    name:
      selectedTier === 'creator' || selectedTier === 'creator_premium'
        ? 'Creator Premium'
        : selectedTier === 'priority'
        ? 'Priority Verified'
        : 'Standard Verified',
    price:
      selectedTier === 'creator' || selectedTier === 'creator_premium'
        ? 3500
        : selectedTier === 'priority'
        ? 1700
        : 800,
  };

  const handleBachsSubscribe = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const tier = selectedTier === 'creator_premium' ? 'creator' : selectedTier;
      const purchase = await beginTierPurchase({ tier: tier as 'verified' | 'priority' | 'creator' });
      const checkout = await initializeBachsPayment({ amount: purchase.amount, currency: purchase.currency, reference: purchase.reference, purpose: 'creator_subscription' });
      await attachCheckout({ reference: purchase.reference, checkoutId: checkout.sessionId, checkoutUrl: checkout.checkoutUrl });
      window.location.assign(checkout.checkoutUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start Batch checkout.');
      setIsSubmitting(false);
    }
  };

  const handleCancelSub = async () => {
    if (
      !window.confirm(
        'Are you sure you want to cancel your verification subscription? Benefits and access will be removed.'
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await cancelUserSubscription();
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to cancel subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubscribedActive = subscription.status === 'active';

  // Resolved active tier details
  const activeTierName =
    subscription.tier === 'creator' || subscription.tier === 'creator_premium'
      ? 'Creator Premium'
      : subscription.tier === 'priority'
      ? 'Priority Verified'
      : 'Standard Verified';

  const activeMonthlyPrice =
    subscription.price ||
    (subscription.tier === 'creator' || subscription.tier === 'creator_premium'
      ? 3500
      : subscription.tier === 'priority'
      ? 1700
      : 800);

  const activeStartDateFormatted = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active';

  const activeBillingDateFormatted = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Next cycle';

  return (
    <div className="w-full flex flex-col min-h-full bg-theme-base animate-in fade-in duration-200">
      {/* ── STICKY TOP APP HEADER ── */}
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-[640px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-active/50 transition-colors cursor-pointer"
              aria-label="Back to profile"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-theme-primary font-sans">
                {isSubscribedActive ? 'Verification' : 'Verification & Creator Plans'}
              </h1>
              <p className="text-[11px] text-theme-tertiary">
                {isSubscribedActive
                  ? 'Manage your active subscription and official badge'
                  : 'Official seals, algorithmic priority, and Creator Hub tools'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="flex-1 w-full max-w-[640px] mx-auto px-4 py-6 space-y-6 pb-28">
        {/* =========================================================================
            STATE A: ACTIVE SUBSCRIBER VIEW (SHOW ACTIVE SUBSCRIPTION & CANCELLATION)
           ========================================================================= */}
        {isSubscribedActive ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Active Subscription Summary Card */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-theme-primary">
                        {currentUser?.name}
                      </span>
                      <VerificationBadge tier={subscription.tier} size="xs" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-[#5E43F3]">
                        {activeTierName}
                      </span>
                      <span className="text-xs text-theme-tertiary">·</span>
                      <span className="text-xs font-semibold text-theme-secondary">
                        ₦{activeMonthlyPrice.toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] border border-[#5E43F3]/20 shrink-0">
                  Active
                </span>
              </div>

              {/* Monthly Subscription Details List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-theme-divider-light text-xs">
                <div className="p-3 rounded-xl bg-theme-base border border-theme-divider-light space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#5E43F3]" />
                    Started On
                  </span>
                  <p className="font-bold text-theme-primary">{activeStartDateFormatted}</p>
                </div>

                <div className="p-3 rounded-xl bg-theme-base border border-theme-divider-light space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#5E43F3]" />
                    Next Billing / Renewal
                  </span>
                  <p className="font-bold text-theme-primary">{activeBillingDateFormatted}</p>
                </div>
              </div>

              {/* Creator Premium Specific Feature Callout */}
              {isCreatorPremiumActive && (
                <div className="p-4 rounded-2xl bg-[#5E43F3]/[0.08] border border-[#5E43F3]/20 space-y-3">
                  <div className="flex items-center gap-2 text-[#5E43F3]">
                    <h4 className="text-xs font-black">Creator Premium Access Unlocked</h4>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    You have full access to Creator Hub, monetization tools, audience analytics, and Explore rankings. The Creator section is available in your sidebar navigation.
                  </p>
                  <button
                    type="button"
                    onClick={openCreatorHub}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Open Creator Hub</span>
                  </button>
                </div>
              )}

              {/* Benefits Checklist */}
              <div className="space-y-2 pt-1 border-t border-theme-divider-light">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">
                  Active Subscription Benefits
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-theme-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Official Lalao verification seal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Authenticated identity status</span>
                  </div>
                  {subscription.tier !== 'verified' && (
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                      <span>Priority algorithmic discovery</span>
                    </div>
                  )}
                  {isCreatorPremiumActive && (
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                      <span>Creator Studio & monetization tools</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation Action */}
              <div className="pt-3 border-t border-theme-divider-light flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-xs font-bold text-theme-primary">Manage Subscription</h4>
                  <p className="text-[11px] text-theme-tertiary">
                    30-day access period. Renew manually with Batch before expiry.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelSub}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
                  ) : null}
                  <span>Cancel Subscription</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              STATE B: UNSUBSCRIBED VIEW (SHOW TIERS & CARD CHECKOUT)
             ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Intro Banner */}
            <div className="rounded-2xl border border-theme-divider-light bg-theme-surface p-4.5 space-y-1.5">
              <div className="flex items-center gap-2 text-[#5E43F3]">
                <BadgeCheck className="w-5 h-5 stroke-[2]" />
                <h2 className="text-sm font-bold text-theme-primary">
                  Choose your verification plan
                </h2>
              </div>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Account verification on LaLao establishes authenticated credibility, unlocks priority discovery across Explore and Search, and provides access to the Creator Hub with milestone progression and tipping tools.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                  Available Plans
                </h3>
                <span className="text-[11px] text-theme-tertiary">Billed monthly · Cancel anytime</span>
              </div>

              {/* ── TIER 3: STANDARD VERIFIED (₦800) ── */}
              <div
                onClick={() => setSelectedTier('verified')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  selectedTier === 'verified'
                    ? 'border-[#5E43F3] bg-[#5E43F3]/[0.05] ring-1 ring-[#5E43F3]/30 shadow-xs'
                    : 'border-theme-divider bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <VerificationBadge tier="verified" size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-theme-primary">
                          Standard Verified
                        </span>
                        <VerificationBadge tier="verified" size="xs" />
                      </div>
                      <span className="text-xs font-black text-[#5E43F3]">
                        ₦800 <span className="text-[11px] font-normal text-theme-tertiary">/ month</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedTier === 'verified'
                        ? 'border-[#5E43F3] bg-[#5E43F3] text-white'
                        : 'border-theme-divider-strong bg-transparent'
                    }`}
                  >
                    {selectedTier === 'verified' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-theme-secondary leading-relaxed">
                  Standard account verification for individuals and community members seeking authenticated presence on LaLao.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-theme-divider-light text-xs text-theme-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Official Lalao blue verification badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Authenticated identity seal</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="w-3.5 h-3.5 text-center text-[10px] shrink-0 text-theme-tertiary">—</span>
                    <span className="text-theme-tertiary">No priority discovery boost</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="w-3.5 h-3.5 text-center text-[10px] shrink-0 text-theme-tertiary">—</span>
                    <span className="text-theme-tertiary">No creator tools or hub access</span>
                  </div>
                </div>
              </div>

              {/* ── TIER 4: PRIORITY VERIFIED (₦1,700) ── */}
              <div
                onClick={() => setSelectedTier('priority')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                  selectedTier === 'priority'
                    ? 'border-[#5E43F3] bg-[#5E43F3]/[0.05] ring-1 ring-[#5E43F3]/30 shadow-xs'
                    : 'border-theme-divider bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <VerificationBadge tier="priority" size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-theme-primary">
                          Priority Verified
                        </span>
                        <VerificationBadge tier="priority" size="xs" />
                      </div>
                      <span className="text-xs font-black text-[#5E43F3]">
                        ₦1,700 <span className="text-[11px] font-normal text-theme-tertiary">/ month</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedTier === 'priority'
                        ? 'border-[#5E43F3] bg-[#5E43F3] text-white'
                        : 'border-theme-divider-strong bg-transparent'
                    }`}
                  >
                    {selectedTier === 'priority' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-theme-secondary leading-relaxed">
                  Official verification plus algorithmic discovery weighting for active members, public figures, and organizers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-theme-divider-light text-xs text-theme-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Dual-ring blue crest badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Priority algorithmic discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Enhanced Explore & search ranking</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="w-3.5 h-3.5 text-center text-[10px] shrink-0 text-theme-tertiary">—</span>
                    <span className="text-theme-tertiary">No Creator Hub tools</span>
                  </div>
                </div>
              </div>

              {/* ── TIER 5: CREATOR PREMIUM (₦3,500) ── */}
              <div
                onClick={() => setSelectedTier('creator')}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                  selectedTier === 'creator' || selectedTier === 'creator_premium'
                    ? 'border-[#5E43F3] bg-gradient-to-br from-[#5E43F3]/[0.08] via-indigo-500/[0.04] to-transparent shadow-xs ring-1 ring-[#5E43F3]/30'
                    : 'border-theme-divider bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <VerificationBadge tier="creator" size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-theme-primary">
                          Creator Premium
                        </span>
                        <VerificationBadge tier="creator" size="xs" />
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3]">
                          Full Hub
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#5E43F3]">
                        ₦3,500 <span className="text-[11px] font-normal text-theme-tertiary">/ month</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedTier === 'creator' || selectedTier === 'creator_premium'
                        ? 'border-[#5E43F3] bg-[#5E43F3] text-white'
                        : 'border-theme-divider-strong bg-transparent'
                    }`}
                  >
                    {(selectedTier === 'creator' || selectedTier === 'creator_premium') && (
                      <Check className="w-3 h-3 stroke-[3]" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-theme-secondary leading-relaxed">
                  Creator Hub, monetization, analytics, and Explore rankings for all creator categories, including approved Manga & Webtoon publishers. Manga Creator profiles require a separate portfolio review.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-theme-divider-light text-xs text-theme-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Dedicated Creator octa-shield badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Full Creator Hub & Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Monetization tools & viewer tips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Eligibility for Explore Creator Rankings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Level progression & milestones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Creator tools for approved Manga & Webtoon publishers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Priority algorithmic discovery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PAYMENT METHOD SELECTOR (CARD ONLY — NO WALLET) ── */}
            <div className="space-y-3 pt-2">
              <div className="border-b border-theme-divider-light pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                  Payment Method
                </h3>
                <p className="text-[11px] text-theme-tertiary mt-0.5">
                  Monthly plan · renew manually before expiry
                </p>
              </div>

              {/* Batch hosted checkout */}
              <div className="p-3.5 rounded-xl border border-[#5E43F3] bg-[#5E43F3]/[0.04] flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-primary">BATCH CHECKOUT</div>
                    <div className="text-[11px] text-theme-tertiary">Secure hosted checkout by Batch</div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border border-[#5E43F3] bg-[#5E43F3] flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* ── ACTION BUTTON ── */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBachsSubscribe}
                className="w-full py-3.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4 stroke-[2.2]" />
                    <span>
                      Subscribe to {currentSelectedConfig.name} · ₦{currentSelectedConfig.price.toLocaleString()}/mo
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-theme-tertiary text-center mt-3 leading-relaxed">
                This plan lasts 30 days. Renew before expiry to keep your badge and benefits active.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
