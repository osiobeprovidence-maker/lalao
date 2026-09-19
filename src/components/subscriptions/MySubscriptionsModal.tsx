import React from 'react';
import { X, Crown, Check, AlertCircle, Clock, Ban } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const MySubscriptionsModal: React.FC = () => {
  const { 
    isMySubscriptionsOpen, 
    setIsMySubscriptionsOpen,
    triggerShareToast
  } = useLalao();

  const mySubscriptions = useQuery(api.subscriptions.getMyMemberships) || [];
  const cancelSubscription = useMutation(api.subscriptions.cancelMembership);

  if (!isMySubscriptionsOpen) return null;

  const handleCancel = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? You will retain access until the end of the billing period.')) return;
    try {
      await cancelSubscription({ membershipId: subId as any });
      triggerShareToast('Subscription will cancel at the end of the period.');
    } catch (err: any) {
      triggerShareToast(err.message || 'Error cancelling subscription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={() => setIsMySubscriptionsOpen(false)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h2 className="text-base font-black text-neutral-900">
              My Subscriptions
            </h2>
            <p className="text-xs text-neutral-500 font-medium">Manage your premium plans</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50">
          {mySubscriptions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-neutral-200">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-base font-black text-neutral-900 mb-1">No active subscriptions</h3>
              <p className="text-sm text-neutral-500">Subscribe to your favorite Pages to unlock premium benefits.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubscriptions.map((sub: any) => (
                <div key={sub._id} className="bg-white rounded-2xl border border-neutral-200 p-4 transition-all relative overflow-hidden">
                  
                  {sub.cancelAtPeriodEnd && (
                    <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-bl-lg flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      CANCELLING
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                      {sub.page?.avatar ? (
                        <img src={sub.page.avatar} alt={sub.page.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#5E43F3]/10 flex items-center justify-center">
                          <span className="text-lg font-black text-[#5E43F3]">{sub.page?.name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-neutral-900">{sub.plan?.name}</h3>
                      <p className="text-xs text-neutral-500 font-bold">@ {sub.page?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">Status</p>
                      <div className="flex items-center gap-1">
                        {sub.status === 'pending' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">Pending</span>
                          </>
                        ) : sub.status === 'active' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-bold text-red-600">{sub.status}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">Slot Price</p>
                      <span className="text-xs font-bold text-neutral-900">
                        {sub.plan?.currency === 'NGN' ? '₦' : sub.plan?.currency}{(sub.plan?.defaultSlotPrice ?? 0).toLocaleString()} / {sub.plan?.billingCycle}
                      </span>
                    </div>
                  </div>
                  
                  {sub.currentPeriodEnd && (
                    <div className="mb-4">
                      <p className="text-xs text-neutral-500">
                        {sub.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'} <span className="font-bold text-neutral-900">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!sub.cancelAtPeriodEnd && sub.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleCancel(sub._id)}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
