import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Wallet,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { VerificationTier } from '../../types';
import { usePaystackPayment } from 'react-paystack';

interface CreatorSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: 'verified' | 'priority' | 'creator';
  onSuccess?: () => void;
}

export const CreatorSubscriptionModal: React.FC<CreatorSubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialTier = 'creator',
  onSuccess,
}) => {
  const { currentUser, triggerShareToast } = useLalao();

  const [selectedTier, setSelectedTier] = useState<'verified' | 'priority' | 'creator'>(initialTier);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tiersConfig = useQuery(api.creators.getCreatorTiers);
  const currentSub = useQuery(api.creators.getMyCreatorSubscription);
  const wallet = useQuery(api.wallet.getWallet);

  const subscribeToTier = useMutation(api.creators.subscribeToTier);
  const cancelSubscription = useMutation(api.creators.cancelSubscription);

  // Selected tier data
  const currentSelectedConfig = tiersConfig?.find((t) => t.id === selectedTier) || {
    id: selectedTier,
    name: selectedTier === 'creator' ? 'Creator Premium' : selectedTier === 'priority' ? 'Priority Verified' : 'Standard Verified',
    price: selectedTier === 'creator' ? 3500 : selectedTier === 'priority' ? 1700 : 800,
  };

  const walletBalance = wallet?.balance ?? 0;
  const hasSufficientWallet = walletBalance >= currentSelectedConfig.price;

  // Paystack configuration
  const paystackRef = `sub_${selectedTier}_${Date.now()}`;
  const paystackConfig = {
    reference: paystackRef,
    email: currentUser?.email || `${currentUser?.username || 'user'}@lalao.app`,
    amount: currentSelectedConfig.price * 100, // in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_1e3e4134a6324bd82248c28828b24f8a835e9f0f',
  };

  const initializePaystack = usePaystackPayment(paystackConfig as any);

  if (!isOpen) return null;

  const handleWalletSubscribe = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await subscribeToTier({
        tier: selectedTier,
        paymentMethod: 'wallet',
      });
      triggerShareToast(`Welcome to ${currentSelectedConfig.name}! Your badge is now active.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Subscription failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackSubscribe = () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    initializePaystack({
      onSuccess: async (response: any) => {
        try {
          await subscribeToTier({
            tier: selectedTier,
            paymentMethod: 'paystack',
            paystackReference: response.reference || paystackRef,
          });
          triggerShareToast(`Payment verified! ${currentSelectedConfig.name} is active.`);
          if (onSuccess) onSuccess();
          onClose();
        } catch (err: any) {
          setErrorMsg(err.message || 'Verification failed. Please contact support.');
        } finally {
          setIsSubmitting(false);
        }
      },
      onClose: () => {
        setIsSubmitting(false);
      },
    } as any);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel auto-renewal? You will keep your verification benefits until your current billing period ends.')) {
      return;
    }
    try {
      await cancelSubscription({});
      triggerShareToast('Auto-renewal cancelled. Benefits remain active until billing date.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-theme-surface border border-theme-divider-strong rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-theme-divider-light shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-theme-primary tracking-tight">
                Verification & Creator Tiers
              </h2>
              <p className="text-xs text-theme-tertiary">
                Official badges, discovery priority, and full creator monetization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-theme-surface-hover text-theme-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-theme-base">

          {/* Current Active Subscription Banner if user has one */}
          {currentSub?.isVerified && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <VerificationBadge tier={currentSub.tier} size="md" />
                <div>
                  <p className="text-xs font-black text-teal-700 dark:text-teal-300">
                    Active Plan: {currentSub.tier === 'creator' ? 'Creator Premium' : currentSub.tier === 'priority' ? 'Priority Verified' : 'Standard Verified'}
                  </p>
                  <p className="text-[11px] text-teal-600/80 dark:text-teal-400/80">
                    {currentSub.expiresAt ? `Renews / Expires: ${new Date(currentSub.expiresAt).toLocaleDateString()}` : 'Active'}
                  </p>
                </div>
              </div>
              {!currentSub.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="text-xs font-bold text-theme-tertiary hover:text-rose-500 underline transition-colors cursor-pointer"
                >
                  Cancel auto-renewal
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Cancelling at period end
                </span>
              )}
            </div>
          )}

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* TIER 3: STANDARD VERIFIED */}
            <div
              onClick={() => setSelectedTier('verified')}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'verified'
                  ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                  : 'border-theme-divider bg-theme-surface hover:border-theme-divider-strong'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                    Tier 3
                  </span>
                  <VerificationBadge tier="verified" size="sm" />
                </div>
                <div>
                  <h3 className="text-base font-black text-theme-primary">Verified</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-theme-primary">₦800</span>
                    <span className="text-[11px] text-theme-tertiary font-bold">/mo</span>
                  </div>
                </div>
                <p className="text-[11px] text-theme-secondary leading-relaxed">
                  Standard account verification with official teal checkmark badge.
                </p>
                <div className="space-y-2 pt-2 border-t border-theme-divider-light">
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Teal verification badge</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Identity authentication</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-tertiary">
                    <X className="w-3.5 h-3.5 text-theme-tertiary shrink-0" />
                    <span>No creator tools</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3">
                <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all ${
                  selectedTier === 'verified'
                    ? 'bg-teal-600 text-white'
                    : 'bg-theme-surface-hover text-theme-secondary'
                }`}>
                  {selectedTier === 'verified' ? 'Selected' : 'Select'}
                </div>
              </div>
            </div>

            {/* TIER 4: PRIORITY VERIFIED */}
            <div
              onClick={() => setSelectedTier('priority')}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'priority'
                  ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                  : 'border-theme-divider bg-theme-surface hover:border-theme-divider-strong'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                    Tier 4
                  </span>
                  <VerificationBadge tier="priority" size="sm" />
                </div>
                <div>
                  <h3 className="text-base font-black text-theme-primary">Priority Verified</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-theme-primary">₦1,700</span>
                    <span className="text-[11px] text-theme-tertiary font-bold">/mo</span>
                  </div>
                </div>
                <p className="text-[11px] text-theme-secondary leading-relaxed">
                  Dual-ring teal badge with priority discovery & search reach.
                </p>
                <div className="space-y-2 pt-2 border-t border-theme-divider-light">
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Dual-ring priority teal badge</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Priority discovery weighting</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Enhanced Explore ranking</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3">
                <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all ${
                  selectedTier === 'priority'
                    ? 'bg-teal-600 text-white'
                    : 'bg-theme-surface-hover text-theme-secondary'
                }`}>
                  {selectedTier === 'priority' ? 'Selected' : 'Select'}
                </div>
              </div>
            </div>

            {/* TIER 5: CREATOR PREMIUM */}
            <div
              onClick={() => setSelectedTier('creator')}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                selectedTier === 'creator'
                  ? 'border-teal-500 bg-gradient-to-b from-teal-500/10 to-teal-500/5 dark:from-teal-950/40 dark:to-teal-950/10 shadow-lg ring-2 ring-teal-500/30'
                  : 'border-theme-divider bg-theme-surface hover:border-theme-divider-strong'
              }`}
            >
              {/* Highlight Ribbon */}
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Creator Suite
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Tier 5
                  </span>
                  <VerificationBadge tier="creator" size="sm" />
                </div>
                <div>
                  <h3 className="text-base font-black text-theme-primary flex items-center gap-1.5">
                    Creator Premium
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-teal-700 dark:text-teal-300">₦3,500</span>
                    <span className="text-[11px] text-theme-tertiary font-bold">/mo</span>
                  </div>
                </div>
                <p className="text-[11px] text-theme-secondary leading-relaxed">
                  Full Creator Hub access, viewer tips & monetization, and Explore leaderboards.
                </p>
                <div className="space-y-2 pt-2 border-t border-theme-divider-light">
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-bold">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Dedicated Creator teal emblem</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-bold">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Full Creator Hub & Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-bold">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Monetization & Viewer Tips</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-bold">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Explore Rankings eligibility</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-theme-primary font-bold">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Creator progression milestones</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3">
                <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all ${
                  selectedTier === 'creator'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-theme-surface-hover text-theme-secondary'
                }`}>
                  {selectedTier === 'creator' ? 'Selected' : 'Select'}
                </div>
              </div>
            </div>

          </div>

          {/* Payment Method Selector */}
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-theme-tertiary block">
              Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Wallet */}
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'wallet'
                    ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-950/20 ring-1 ring-teal-500/30'
                    : 'border-theme-divider bg-theme-base hover:bg-theme-surface-hover'
                }`}
              >
                <Wallet className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMethod === 'wallet' ? 'text-teal-600 dark:text-teal-400' : 'text-theme-tertiary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-theme-primary">LaLao Wallet</span>
                    {paymentMethod === 'wallet' && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    Balance: <strong className="text-theme-primary">₦{walletBalance.toLocaleString()}</strong>
                  </p>
                  {!hasSufficientWallet && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">
                      Insufficient balance (Needs ₦{currentSelectedConfig.price.toLocaleString()})
                    </p>
                  )}
                </div>
              </button>

              {/* Option B: Paystack Card/Bank */}
              <button
                type="button"
                onClick={() => setPaymentMethod('paystack')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'paystack'
                    ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-950/20 ring-1 ring-teal-500/30'
                    : 'border-theme-divider bg-theme-base hover:bg-theme-surface-hover'
                }`}
              >
                <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMethod === 'paystack' ? 'text-teal-600 dark:text-teal-400' : 'text-theme-tertiary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-theme-primary">Paystack Instant</span>
                    {paymentMethod === 'paystack' && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    Debit Card, Bank Transfer, USSD
                  </p>
                </div>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-theme-divider-light flex items-center justify-between gap-4 shrink-0 bg-theme-surface">
          <div>
            <span className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider block">Total Billed</span>
            <span className="text-lg font-black text-theme-primary">
              ₦{currentSelectedConfig.price.toLocaleString()} <span className="text-xs font-normal text-theme-tertiary">/ month</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={paymentMethod === 'wallet' ? handleWalletSubscribe : handlePaystackSubscribe}
              disabled={isSubmitting || (paymentMethod === 'wallet' && !hasSufficientWallet)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all shadow-md hover:shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Subscribe to {currentSelectedConfig.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
