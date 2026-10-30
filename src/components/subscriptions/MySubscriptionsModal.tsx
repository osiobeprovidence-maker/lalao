import React, { useState } from 'react';
import { X, Crown, Check, AlertCircle, Clock, Ban, RefreshCw, CreditCard, Wallet, Calendar, ShieldCheck } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type SubFilter = 'all' | 'active' | 'renewals' | 'cancelled';

interface MySubscriptionsModalProps {
  /** Render inline inside the wallet modal instead of as a standalone overlay. */
  inline?: boolean;
  onClose?: () => void;
}

export const MySubscriptionsModal: React.FC<MySubscriptionsModalProps> = ({ inline = false, onClose }) => {
  const {
    isMySubscriptionsOpen,
    setIsMySubscriptionsOpen,
    setIsWalletModalOpen,
    triggerShareToast
  } = useLalao();

  const mySubscriptions = useQuery(api.subscriptions.getMySubscriptions) || [];
  const cancelRenewal = useMutation(api.subscriptions.cancelSubscriptionRenewal);

  const [activeFilter, setActiveFilter] = useState<SubFilter>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!inline && !isMySubscriptionsOpen) return null;

  const handleCancelRenewal = async (memId: string, subName: string) => {
    if (!confirm(`Are you sure you want to cancel future renewals for ${subName}? You will keep your active slot until the end of your paid billing period.`)) {
      return;
    }

    try {
      setCancellingId(memId);
      await cancelRenewal({ membershipId: memId as any });
      triggerShareToast('Future renewals cancelled successfully.');
    } catch (err: any) {
      console.error(err);
      triggerShareToast(err.message || 'Error cancelling renewal.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = mySubscriptions.filter((sub: any) => {
    if (activeFilter === 'active') return sub.status === 'active' && !sub.cancelAtPeriodEnd;
    if (activeFilter === 'renewals') {
      const isDue = (sub.nextRenewalDate || 0) < Date.now() + 7 * 24 * 60 * 60 * 1000;
      return sub.status === 'active' && isDue;
    }
    if (activeFilter === 'cancelled') return sub.cancelAtPeriodEnd || sub.status === 'cancelled';
    return true;
  });

  const content = (
      <div
        className={
          inline
            ? "w-full flex flex-col overflow-hidden"
            : "bg-theme-surface rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-theme-divider-light"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (standalone only — the wallet supplies its own header inline) */}
        {!inline && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-theme-divider-light shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMySubscriptionsOpen(false)}
                className="p-2 -ml-2 rounded-full hover:bg-theme-surface-hover text-theme-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-theme-primary flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#5E43F3]" />
                  My Subscriptions
                </h2>
                <p className="text-xs text-theme-tertiary font-medium">
                  Manage your JointheQ & Page subscription groups
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMySubscriptionsOpen(false);
                setIsWalletModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-xs font-bold text-theme-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#5E43F3]" />
              <span>Wallet History</span>
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className={`flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-theme-divider-light bg-theme-base/60 overflow-x-auto shrink-0 ${inline ? 'pt-0' : ''}`}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'renewals', label: 'Renewals Due' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#5E43F3] text-white shadow-sm'
                  : 'bg-theme-surface hover:bg-theme-surface-hover text-theme-secondary border border-theme-divider-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={inline
          ? "p-4 sm:p-5 bg-theme-base space-y-4"
          : "flex-1 overflow-y-auto p-4 sm:p-5 bg-theme-base space-y-4"}>
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 bg-theme-surface rounded-2xl border border-theme-divider-light">
              <div className="w-14 h-14 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-theme-primary mb-1">
                {activeFilter === 'all' ? 'No Subscriptions Joined' : 'No Subscriptions in this view'}
              </h3>
              <p className="text-xs text-theme-tertiary max-w-sm mx-auto mb-4">
                Join high-tier shared subscription groups like Spotify, Netflix, YouTube Family, and more through JointheQ.
              </p>
            </div>
          ) : (
            filtered.map((sub: any) => {
              const plan = sub.subscription || sub.plan;
              const isPastDue = sub.status === 'past_due' || sub.status === 'expired';
              const isCancelling = sub.cancelAtPeriodEnd;

              return (
                <div
                  key={sub._id}
                  className="bg-theme-surface rounded-2xl border border-theme-divider-light p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden"
                >
                  {isCancelling && (
                    <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-bl-xl flex items-center gap-1 uppercase tracking-wider">
                      <Ban className="w-3 h-3" />
                      Auto-Renewal Cancelled
                    </div>
                  )}

                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-theme-surface-hover overflow-hidden shrink-0 border border-theme-divider-light flex items-center justify-center">
                      {plan?.platformLogo ? (
                        <img src={plan.platformLogo} alt="Logo" className="w-7 h-7 object-contain" />
                      ) : sub.page?.avatar ? (
                        <img src={sub.page.avatar} alt={sub.page.name} className="w-full h-full object-cover" />
                      ) : (
                        <Crown className="w-6 h-6 text-[#5E43F3]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="text-base font-black text-theme-primary truncate">
                        {plan?.name || 'Subscription Group'}
                      </h3>
                      <p className="text-xs text-theme-tertiary font-bold flex items-center gap-1.5 mt-0.5">
                        <span>@{sub.page?.username || 'jointheq'}</span>
                        <span>•</span>
                        <span>Slot {sub.slot?.slotNumber || 1}</span>
                      </p>
                    </div>
                  </div>

                  {/* Badges / Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 p-3 bg-theme-base rounded-xl border border-theme-divider-light text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary mb-0.5">Status</p>
                      <div className="flex items-center gap-1.5">
                        {sub.status === 'active' && !isCancelling ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-bold text-emerald-600">Active</span>
                          </>
                        ) : isCancelling ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-bold text-orange-600">Active until cycle end</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="font-bold text-red-600 capitalize">{sub.status}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary mb-0.5">Price</p>
                      <span className="font-black text-theme-primary">
                        ₦{(sub.amount || plan?.defaultSlotPrice || 0).toLocaleString()}
                        <span className="text-[10px] text-theme-tertiary font-normal"> / mo</span>
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary mb-0.5">Payment Method</p>
                      <span className="font-bold text-theme-secondary flex items-center gap-1 capitalize">
                        {sub.paymentMethod === 'paystack' ? (
                          <><CreditCard className="w-3.5 h-3.5 text-[#0BA4DB]" /> Paystack</>
                        ) : (
                          <><Wallet className="w-3.5 h-3.5 text-[#5E43F3]" /> Wallet</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="flex items-center justify-between text-xs text-theme-secondary mb-4 px-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-theme-tertiary" />
                      <span>
                        Joined: <strong className="text-theme-primary">{new Date(sub.startedAt || sub.createdAt).toLocaleDateString()}</strong>
                      </span>
                    </div>
                    {sub.nextRenewalDate && (
                      <div className="text-right">
                        <span>
                          {isCancelling ? 'Expires: ' : 'Renews: '}
                          <strong className={isCancelling ? 'text-red-600' : 'text-[#5E43F3]'}>
                            {new Date(sub.nextRenewalDate).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-theme-divider-light">
                    {!isCancelling && sub.status === 'active' && (
                      <button
                        type="button"
                        disabled={cancellingId === sub._id}
                        onClick={() => handleCancelRenewal(sub._id, plan?.name || 'Subscription')}
                        className="py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer flex-1"
                      >
                        {cancellingId === sub._id ? 'Cancelling...' : 'Cancel Future Renewal'}
                      </button>
                    )}

                    {isPastDue && (
                      <button
                        type="button"
                        onClick={() => triggerShareToast('Please rejoin the subscription to reactivate your slot.')}
                        className="py-2.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Membership</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
  );

  if (inline) return content;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsMySubscriptionsOpen(false);
      }}
    >
      {content}
    </div>
  );
};
