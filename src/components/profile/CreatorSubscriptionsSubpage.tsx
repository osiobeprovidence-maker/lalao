import React from 'react';
import { ArrowLeft, BadgeCheck, Briefcase, Sparkles, Check } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';

interface CreatorSubscriptionsSubpageProps {
  onBack: () => void;
  onCloseSettings: () => void;
}

export const CreatorSubscriptionsSubpage: React.FC<CreatorSubscriptionsSubpageProps> = ({
  onBack,
  onCloseSettings,
}) => {
  const { subscription, isCreatorPremiumActive, openCreatorSubscription, openCreatorHub } = useLalao();

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-creator-subscriptions"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">
              Verification & Subscriptions
            </h1>
            <p className="text-[11px] text-theme-tertiary">Official badges & Creator Hub</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Current Plan Overview Card */}
        <div className="rounded-2xl border border-[#5E43F3]/25 bg-gradient-to-br from-[#5E43F3]/[0.06] via-theme-surface to-theme-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-theme-secondary">Current Status:</span>
                  <span className="text-xs font-extrabold capitalize text-[#5E43F3]">
                    {subscription.status === 'active'
                      ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                        ? 'Creator Premium'
                        : subscription.tier === 'priority'
                        ? 'Priority Verified'
                        : 'Standard Verified'
                      : 'Unverified'}
                  </span>
                  <VerificationBadge tier={subscription.tier} size="xs" />
                </div>
                <p className="text-[11px] text-theme-tertiary mt-1 leading-snug">
                  {subscription.status === 'active'
                    ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                      ? 'Full Creator Hub monetization, local analytics, badge, & rankings active'
                      : subscription.tier === 'priority'
                      ? 'Priority Discovery Weighting & Verified Seal active'
                      : 'Official Verified Seal active on profile'
                    : 'Standard account without verification benefits'}
                </p>
              </div>
            </div>
          </div>

          <div className={`grid gap-2.5 pt-2 ${isCreatorPremiumActive ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <button
              id="btn-manage-subscription-plan"
              type="button"
              onClick={() => {
                onCloseSettings();
                openCreatorSubscription();
              }}
              className="w-full rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] text-white py-3 px-4 text-xs font-bold shadow-md shadow-[#5E43F3]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{subscription.status === 'active' ? 'Manage Subscription / View Plan' : 'Get Verified (from ₦800)'}</span>
            </button>

            {isCreatorPremiumActive && (
              <button
                id="btn-open-creator-hub"
                type="button"
                onClick={() => {
                  onCloseSettings();
                  openCreatorHub();
                }}
                className="w-full rounded-xl border border-[#5E43F3]/30 bg-[#5E43F3]/5 hover:bg-[#5E43F3]/10 active:scale-[0.99] text-[#5E43F3] py-3 px-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                <span>Open Creator Hub</span>
              </button>
            )}
          </div>
        </div>

        {/* Benefits breakdown */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Verification & Creator Benefits
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface">
            {[
              {
                title: 'Official Verified Badge',
                desc: 'Golden or purple checkmark displaying your credibility across Delta State.',
              },
              {
                title: 'Priority Discovery & Explore',
                desc: 'Rank higher in local feeds, member searches, and trending cycles.',
              },
              {
                title: 'Creator Monetization & Tips',
                desc: 'Direct member tipping, paid cycles, and subscriber-only posts.',
              },
              {
                title: 'Audience & Reach Analytics',
                desc: 'Real-time performance metrics for your posts, polls, and rallies.',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="p-3.5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-theme-primary block">
                    {benefit.title}
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5 leading-snug">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
