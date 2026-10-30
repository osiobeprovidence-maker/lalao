import React, { useState } from 'react';
import { X, Crown, Check, AlertCircle, Loader2, CreditCard, Wallet, ShieldCheck, Clock, Calendar } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface SubscriptionCheckoutModalProps {
  /**
   * Render the checkout inline (inside the wallet modal) instead of as a
   * standalone overlay. The same component and payment logic are reused.
   */
  inline?: boolean;
  /** Called instead of closing the standalone modal (e.g. wallet back nav). */
  onClose?: () => void;
  /** In inline mode, keep the user inside the wallet and open funding. */
  onTopUp?: () => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({ inline = false, onClose, onTopUp }) => {
  const { 
    isSubscriptionCheckoutOpen, 
    setIsSubscriptionCheckoutOpen, 
    selectedSubscriptionPlan,
    setIsWalletModalOpen,
    triggerShareToast
  } = useLalao();

  const reserveSlot = useMutation(api.subscriptions.reserveSlot);
  const joinViaWallet = useMutation(api.subscriptions.joinViaWallet);
  const attachBachsCheckout = useMutation(api.subscriptions.attachBachsSubscriptionCheckout);
  const initializeBachsPayment = useAction(api.bachs.initializeBachsPayment);

  // Authoritative Lalao wallet balance
  const wallet = useQuery(api.wallet.getWallet);
  const userBalance = wallet?.balance ?? 0;

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bachs'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const plan = selectedSubscriptionPlan;
  const price = plan?.defaultSlotPrice || 0;
  const hasEnoughWalletFunds = userBalance >= price;

  if ((!inline && !isSubscriptionCheckoutOpen) || !plan) return null;

  const handleWalletCheckout = async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // 1. Reserve slot
      const reservation = await reserveSlot({
        subscriptionId: plan._id as any,
        paymentMethod: 'wallet',
      });

      // 2. Settle with Lalao Wallet balance
      const res = await joinViaWallet({
        subscriptionId: plan._id as any,
        reservationId: reservation.reservationId,
      });

      setSuccessData(res);
      setSuccess(true);
      triggerShareToast(`Joined ${plan.name} successfully!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error subscribing to group.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBachsCheckout = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const reference = `LALAO_SUB_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      const reservation = await reserveSlot({
        subscriptionId: plan._id as any,
        paymentMethod: 'bachs',
        bachsReference: reference,
      });
      const checkout = await initializeBachsPayment({ amount: reservation.amount, currency: reservation.currency, reference, purpose: 'subscription_membership' });
      await attachBachsCheckout({ reference, checkoutId: checkout.sessionId });
      window.location.assign(checkout.checkoutUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize payment.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!inline) setIsSubscriptionCheckoutOpen(false);
    onClose?.();
    setTimeout(() => {
      setSuccess(false);
      setIsProcessing(false);
      setError(null);
      setSuccessData(null);
      setPaymentMethod('wallet');
    }, 300);
  };

  // â”€â”€ Duration helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const durationMonths = plan?.durationMonths ??
    (plan?.billingCycle === '3_months' || plan?.billingCycle === 'quarterly' ? 3 :
     plan?.billingCycle === '6_months' ? 6 :
     plan?.billingCycle === '12_months' || plan?.billingCycle === 'yearly' ? 12 : 1);

  const durationStr =
    durationMonths === 1  ? '1 month' :
    durationMonths === 3  ? '3 months' :
    durationMonths === 6  ? '6 months' :
    durationMonths === 12 ? '12 months (1 year)' :
    `${durationMonths} months`;

  const priceLabelShort =
    durationMonths === 1  ? 'Monthly' :
    durationMonths === 3  ? '3-Month' :
    durationMonths === 6  ? '6-Month' :
    durationMonths === 12 ? '12-Month' :
    `${durationMonths}-Month`;

  const content = (
      <div 
        className={inline
          ? "w-full flex flex-col"
          : "bg-theme-surface rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-theme-divider-light flex flex-col max-h-[92vh]"}
        onClick={(e) => e.stopPropagation()}
      >
        {!inline && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-theme-surface-hover text-theme-tertiary hover:bg-theme-surface-active transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {success ? (
          <div className="p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-black text-theme-primary">Membership Active!</h2>
            <p className="text-sm text-theme-secondary max-w-md mx-auto">
              You've officially joined <strong className="text-theme-primary">{plan.name}</strong>.
            </p>

            <div className="bg-theme-base p-4 rounded-2xl border border-theme-divider-light text-left space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-theme-tertiary font-bold uppercase tracking-wider">Amount Paid</span>
                <span className="font-black text-theme-primary">â‚¦{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-theme-tertiary font-bold uppercase tracking-wider">Payment Method</span>
                <span className="font-bold text-theme-primary capitalize">{paymentMethod}</span>
              </div>
              {successData?.reference && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-theme-tertiary font-bold uppercase tracking-wider">Reference</span>
                  <span className="font-mono font-bold text-theme-secondary text-[11px]">{successData.reference}</span>
                </div>
              )}
              {successData?.nextRenewalDate && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-theme-tertiary font-bold uppercase tracking-wider">Next Renewal</span>
                  <span className="font-bold text-[#5E43F3]">{new Date(successData.nextRenewalDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {plan.memberInstructions && (
              <div className="bg-[#5E43F3]/5 p-4 rounded-2xl border border-[#5E43F3]/20 text-left">
                <div className="text-xs font-bold text-[#5E43F3] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Access Instructions
                </div>
                <p className="text-xs text-theme-secondary leading-relaxed">{plan.memberInstructions}</p>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full mt-4 py-3.5 bg-[#5E43F3] text-white rounded-xl font-bold hover:bg-[#4E34E0] transition-colors shadow-lg shadow-[#5E43F3]/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="bg-[#5E43F3]/5 p-6 border-b border-[#5E43F3]/10 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                {plan.platformLogo ? (
                   <img src={plan.platformLogo} alt="Logo" className="w-5 h-5 rounded-md object-contain" />
                ) : (
                   <Crown className="w-5 h-5 text-[#5E43F3]" />
                )}
                <span className="text-xs font-black uppercase tracking-wider text-[#5E43F3]">
                  JointheQ Subscription Group
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-theme-primary mb-1">{plan.name}</h2>
              <p className="text-xs sm:text-sm text-theme-secondary line-clamp-2">{plan.description}</p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Pricing Box */}
              <div className="flex justify-between items-end bg-theme-base p-4 rounded-2xl border border-theme-divider-light">
                <div>
                  <p className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">{priceLabelShort} Slot Price</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-theme-primary">
                      â‚¦{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-theme-tertiary font-bold">/ {durationStr}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Group
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-theme-tertiary uppercase tracking-wider block mb-2 px-1">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: Lalao Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-2 ring-[#5E43F3]/20'
                        : 'border-theme-divider-light bg-theme-base hover:bg-theme-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-theme-primary">LaLao Wallet</span>
                      </div>
                      {paymentMethod === 'wallet' && (
                        <div className="w-4 h-4 rounded-full bg-[#5E43F3] text-white flex items-center justify-center text-[10px]">âœ“</div>
                      )}
                    </div>
                    <div className="text-[11px] text-theme-secondary">
                      Bal: <strong className={hasEnoughWalletFunds ? 'text-theme-primary' : 'text-red-500'}>â‚¦{userBalance.toLocaleString()}</strong>
                    </div>
                  </button>

                  {/* Option 2: Bachs hosted checkout */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bachs')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 cursor-pointer ${
                      paymentMethod === 'bachs'
                        ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-2 ring-[#5E43F3]/20'
                        : 'border-theme-divider-light bg-theme-base hover:bg-theme-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-theme-primary">Batch</span>
                      </div>
                      {paymentMethod === 'bachs' && (
                        <div className="w-4 h-4 rounded-full bg-[#5E43F3] text-white flex items-center justify-center text-[10px]">âœ“</div>
                      )}
                    </div>
                    <div className="text-[11px] text-theme-secondary">
                      Secure hosted checkout
                    </div>
                  </button>
                </div>

                {/* Top Up hint if wallet selected but insufficient */}
                {paymentMethod === 'wallet' && !hasEnoughWalletFunds && (
                  <div className="mt-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-xs">
                    <span className="text-orange-700 font-medium">Insufficient wallet balance for â‚¦{price.toLocaleString()}.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (inline) {
                          onTopUp?.();
                          return;
                        }
                        handleClose();
                        setIsWalletModalOpen(true);
                      }}
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors"
                    >
                      Top Up Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Benefits */}
              {plan.benefits && plan.benefits.length > 0 && (
                <div className="bg-theme-base rounded-2xl p-4 border border-theme-divider-light">
                  <h4 className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-2.5">
                    What's Included
                  </h4>
                  <div className="space-y-2">
                    {plan.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-theme-secondary">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies info */}
              <div className="space-y-1.5 text-[11px] text-theme-tertiary px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-theme-tertiary" />
                  <span>Slots are reserved for 15 minutes during checkout.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-theme-tertiary" />
                  <span>
                    {priceLabelShort} subscription ({durationStr}). Cancel anytime from My Subscriptions before renewal.
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-theme-base border-t border-theme-divider-light shrink-0">
              <button
                type="button"
                onClick={paymentMethod === 'wallet' ? handleWalletCheckout : handleBachsCheckout}
                disabled={isProcessing || (paymentMethod === 'wallet' && !hasEnoughWalletFunds)}
                className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'wallet'
                    ? 'bg-[#5E43F3] hover:bg-[#4E34E0] shadow-[#5E43F3]/25'
                    : 'bg-[#5E43F3] hover:bg-[#4E34E0] shadow-[#5E43F3]/25'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>
                    Pay â‚¦{price.toLocaleString()} ({durationStr}) via {paymentMethod === 'wallet' ? 'Wallet' : 'Batch'} & Join
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (inline) return content;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {content}
    </div>
  );
};
