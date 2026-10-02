import React, { useState } from 'react';
import { X, Crown, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';

export const SubscriptionCheckoutModal: React.FC = () => {
  const { 
    isSubscriptionCheckoutOpen, 
    setIsSubscriptionCheckoutOpen, 
    selectedSubscriptionPlan,
    triggerShareToast
  } = useLalao();

  const { user } = useAuth();

  const joinSlot = useMutation(api.subscriptions.joinSlot);
  // Get wallet balance for the user
  const wallet = useQuery(api.wallet.getWallet);
  const userBalance = wallet?.balance ?? 0;

  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSubscriptionCheckoutOpen || !selectedSubscriptionPlan || !user) return null;

  const plan = selectedSubscriptionPlan;
  const price = plan.defaultSlotPrice || 0;
  
  const handleSubscribe = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Attempt to join a slot atomically via Convex
      await joinSlot({ subscriptionId: plan._id as any, role: 'Member' });
      
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error subscribing to slot.');
      triggerShareToast('Failed to join slot. Please check your balance or try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsSubscriptionCheckoutOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setIsProcessing(false);
      setError(null);
    }, 300);
  };

  const hasEnoughFunds = userBalance >= price;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-theme-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-theme-surface-hover text-theme-tertiary hover:bg-theme-surface-active transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-theme-primary">Subscription Active!</h2>
            <p className="text-sm text-theme-tertiary">
              You have successfully claimed a slot for {plan.name}. Your wallet has been charged ₦{price.toLocaleString()}.
            </p>
            <button
              onClick={handleClose}
              className="w-full mt-4 py-3 bg-[#5E43F3] text-white rounded-xl font-bold hover:bg-[#4E34E0] transition-colors"
            >
              Start Enjoying
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="bg-[#5E43F3]/5 p-6 border-b border-[#5E43F3]/10">
              <div className="flex items-center gap-2 mb-3">
                {plan.platformLogo ? (
                   <img src={plan.platformLogo} alt="Logo" className="w-5 h-5 rounded" />
                ) : (
                   <Crown className="w-5 h-5 text-[#5E43F3]" />
                )}
                <span className="text-xs font-black uppercase tracking-wider text-[#5E43F3]">
                  Subscription Slot
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-theme-primary mb-1">{plan.name}</h2>
              <p className="text-sm text-theme-secondary">{plan.description}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wide mb-1">Price Per Cycle</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-theme-primary">
                      ₦{price.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-theme-tertiary bg-theme-surface-hover px-2 py-1 rounded-md uppercase">
                    / {plan.billingCycle}
                  </span>
                </div>
              </div>

              {/* Wallet Balance Check */}
              <div className={`p-4 rounded-xl border mb-6 flex justify-between items-center ${hasEnoughFunds ? 'bg-theme-base border-theme-divider' : 'bg-red-50 border-red-200'}`}>
                <div>
                  <p className="text-xs font-bold text-theme-tertiary mb-1">Your Wallet Balance</p>
                  <p className={`text-sm font-black ${hasEnoughFunds ? 'text-theme-primary' : 'text-red-600'}`}>₦{userBalance.toLocaleString()}</p>
                </div>
                {!hasEnoughFunds && (
                  <button className="text-xs font-bold bg-theme-inverse text-theme-text-inverse px-3 py-1.5 rounded-lg">
                    Top Up
                  </button>
                )}
              </div>

              <div className="bg-theme-base rounded-xl p-4 border border-theme-divider-light mb-6">
                <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-3">What's Included</h4>
                <div className="space-y-2.5">
                  {plan.benefits?.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-theme-secondary">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={isProcessing || !hasEnoughFunds}
                className="w-full py-3.5 bg-[#5E43F3] text-white rounded-xl font-black shadow-lg shadow-[#5E43F3]/20 hover:bg-[#4E34E0] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : !hasEnoughFunds ? (
                  <>Insufficient Funds</>
                ) : (
                  <>Pay ₦{price.toLocaleString()} & Join</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
