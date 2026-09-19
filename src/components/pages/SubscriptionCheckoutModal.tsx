import React, { useState } from 'react';
import { X, Crown, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

export const SubscriptionCheckoutModal: React.FC = () => {
  const { 
    isSubscriptionCheckoutOpen, 
    setIsSubscriptionCheckoutOpen, 
    selectedSubscriptionPlan,
    subscribeToPlan,
    triggerShareToast
  } = useLalao();

  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSubscriptionCheckoutOpen || !selectedSubscriptionPlan) return null;

  const plan = selectedSubscriptionPlan;

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      
      // We will pretend to open a payment gateway, then create a pending subscription
      setTimeout(async () => {
        try {
          await subscribeToPlan(plan._id);
          setSuccess(true);
        } catch (err: any) {
          triggerShareToast(err.message || 'Error subscribing');
        } finally {
          setIsProcessing(false);
        }
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsSubscriptionCheckoutOpen(false);
    // Reset state after transition
    setTimeout(() => {
      setSuccess(false);
      setIsProcessing(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-neutral-900">Subscription Pending</h2>
            <p className="text-sm text-neutral-500">
              Your subscription has been recorded. Once your payment is confirmed, your benefits will be activated.
            </p>
            <button
              onClick={handleClose}
              className="w-full mt-4 py-3 bg-[#5E43F3] text-white rounded-xl font-bold hover:bg-[#4E34E0] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="bg-[#5E43F3]/5 p-6 border-b border-[#5E43F3]/10">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-[#5E43F3]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#5E43F3]">
                  Subscription Checkout
                </span>
              </div>
              <h2 className="text-2xl font-black text-neutral-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-neutral-600">{plan.description}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Total Due Today</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-neutral-900">
                      {plan.currency === 'NGN' ? '₦' : plan.currency}{(plan.price).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md uppercase">
                    / {plan.billingInterval}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mb-6">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">What's Included</h4>
                <div className="space-y-2.5">
                  {plan.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-blue-800 text-xs mb-6">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <p>
                  You will be redirected to complete your payment securely. Your subscription starts immediately upon successful payment.
                </p>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#5E43F3] text-white rounded-xl font-black shadow-lg shadow-[#5E43F3]/20 hover:bg-[#4E34E0] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Subscribe Now</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
