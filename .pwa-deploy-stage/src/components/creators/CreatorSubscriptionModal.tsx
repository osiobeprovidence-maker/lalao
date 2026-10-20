import React, { useState } from 'react';
import {
  X,
  Check,
  CreditCard,
  AlertCircle,
  Clock,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { useQuery } from 'convex/react';
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
  const { currentUser, triggerShareToast, subscribeUserToTier } = useLalao();

  const [selectedTier, setSelectedTier] = useState<'verified' | 'priority' | 'creator'>(initialTier);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tiersConfig = useQuery(api.creators.getCreatorTiers);

  if (!isOpen) return null;

  const currentSelectedConfig = tiersConfig?.find((t) => t.id === selectedTier) || {
    id: selectedTier,
    name:
      selectedTier === 'creator'
        ? 'Creator Premium'
        : selectedTier === 'priority'
        ? 'Priority Verified'
        : 'Standard Verified',
    price: selectedTier === 'creator' ? 3500 : selectedTier === 'priority' ? 1700 : 800,
  };

  const paystackRef = `sub_${selectedTier}_${Date.now()}`;
  const paystackConfig = {
    reference: paystackRef,
    email: currentUser?.email || `${currentUser?.username || 'user'}@lalao.app`,
    amount: currentSelectedConfig.price * 100,
    publicKey:
      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
      'pk_test_1e3e4134a6324bd82248c28828b24f8a835e9f0f',
  };

  const initializePaystack = usePaystackPayment(paystackConfig as any);

  const handleCardSubscribe = () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      initializePaystack({
        onSuccess: async (response: any) => {
          try {
            await subscribeUserToTier(selectedTier, response.reference || paystackRef);
            if (onSuccess) onSuccess();
            onClose();
          } catch (err: any) {
            setErrorMsg(err.message || 'Payment received but failed to update status.');
          } finally {
            setIsSubmitting(false);
          }
        },
        onClose: () => {
          setIsSubmitting(false);
        },
      });
    } catch {
      subscribeUserToTier(selectedTier, paystackRef)
        .then(() => {
          if (onSuccess) onSuccess();
          onClose();
        })
        .catch((e: any) => setErrorMsg(e.message || 'Subscription failed'))
        .finally(() => setIsSubmitting(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-theme-surface border border-theme-divider-strong rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme-divider-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5E43F3]/10 border border-[#5E43F3]/20 flex items-center justify-center text-[#5E43F3]">
              <BadgeCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-theme-primary">Verification Subscription</h2>
              <p className="text-[11px] text-theme-tertiary">Billed monthly · Card only · Cancel anytime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-theme-surface-hover text-theme-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-theme-base flex-1">
          {/* Tiers List */}
          <div className="space-y-3">
            {[
              { id: 'verified', name: 'Standard Verified', price: 800, desc: 'Official blue verification seal for account authenticity.' },
              { id: 'priority', name: 'Priority Verified', price: 1700, desc: 'Dual-ring crest seal with priority algorithmic discovery boost.' },
              { id: 'creator', name: 'Creator Premium', price: 3500, desc: 'Complete creator ecosystem, Creator Hub, monetization tools & analytics.' },
            ].map((t) => {
              const isSelected = selectedTier === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTier(t.id as any)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#5E43F3] bg-[#5E43F3]/[0.05] ring-1 ring-[#5E43F3]/30'
                      : 'border-theme-divider bg-theme-surface hover:bg-theme-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <VerificationBadge tier={t.id as any} size="md" />
                      <div>
                        <div className="text-xs font-black text-theme-primary">{t.name}</div>
                        <span className="text-xs font-bold text-[#5E43F3]">
                          ₦{t.price.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#5E43F3] bg-[#5E43F3] text-white' : 'border-theme-divider'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-1.5 leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Payment Method - Card Only */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">
              Payment Method
            </span>
            <div className="p-3 rounded-xl border border-[#5E43F3] bg-[#5E43F3]/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#5E43F3]" />
                <div>
                  <div className="text-xs font-bold text-theme-primary">DEBIT / CARD</div>
                  <div className="text-[10px] text-theme-tertiary">Instant via Paystack</div>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-[#5E43F3] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-theme-divider-light bg-theme-surface">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCardSubscribe}
            className="w-full py-3 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
};
