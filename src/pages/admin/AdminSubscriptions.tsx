import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CreditCard, Users } from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
  const subscriptions = useQuery(api.admin.getSubscriptionsOverview);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-theme-primary">Subscriptions</h1>
        <p className="text-sm text-theme-tertiary mt-1">Platform-wide subscription listings and capacity</p>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {subscriptions === undefined ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            No subscriptions found
          </div>
        ) : (
          subscriptions.map((s: any) => (
            <div key={s._id} className="bg-theme-surface border border-theme-divider rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-theme-primary line-clamp-1">{s.name}</p>
                  <p className="text-xs text-theme-tertiary">{s.category}</p>
                </div>
                <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">
                  {s.currency} {s.defaultSlotPrice.toLocaleString()}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-3 text-[11px] text-theme-secondary">
                <div className="flex items-center gap-1.5">
                  {s.platformLogo ? (
                    <img src={s.platformLogo} alt={s.platformName} className="w-4 h-4 rounded object-contain bg-theme-surface" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-theme-tertiary" />
                  )}
                  <span>{s.platformName ?? 'Custom'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-theme-tertiary">Page:</span>
                  <span className="font-medium text-theme-primary">{s.pageName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-theme-tertiary">Cycle:</span>
                  <span className="font-medium text-theme-primary capitalize">{s.billingCycle}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span className="font-medium text-theme-primary">{s.activeMembers}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-theme-divider-light">
                <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
                  <span className="font-medium text-theme-secondary">Capacity</span>
                  <span className="text-theme-tertiary font-medium">
                    {s.occupiedSlots} / {s.totalCapacity}
                  </span>
                </div>
                <div className="h-1.5 bg-theme-surface-hover rounded-full overflow-hidden w-full">
                  <div 
                    className="h-full bg-[#5200FF]" 
                    style={{ width: `${(s.occupiedSlots / s.totalCapacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-theme-divider bg-theme-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme-divider bg-theme-base/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Page</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Cycle</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Price</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Capacity</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subscriptions === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 rounded bg-theme-surface-hover animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-theme-tertiary text-sm">No subscriptions found</td>
                </tr>
              ) : (
                subscriptions.map((s: any) => (
                  <tr key={s._id} className="hover:bg-theme-base transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-theme-primary">{s.name}</p>
                      <p className="text-[11px] text-theme-tertiary">{s.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.platformLogo ? (
                          <img src={s.platformLogo} alt={s.platformName} className="w-6 h-6 rounded object-contain bg-theme-surface" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-theme-surface-hover flex items-center justify-center shrink-0">
                            <CreditCard className="w-3 h-3 text-theme-tertiary" />
                          </div>
                        )}
                        <span className="text-theme-secondary">{s.platformName ?? 'Custom'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-secondary">{s.pageName}</td>
                    <td className="px-4 py-3 text-theme-secondary capitalize">{s.billingCycle}</td>
                    <td className="px-4 py-3 text-theme-secondary">
                      <span className="font-medium text-emerald-600">
                        {s.currency} {s.defaultSlotPrice.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-theme-surface-hover rounded-full overflow-hidden w-16">
                          <div 
                            className="h-full bg-[#5200FF]" 
                            style={{ width: `${(s.occupiedSlots / s.totalCapacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-theme-tertiary">
                          {s.occupiedSlots}/{s.totalCapacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-theme-secondary">
                        <Users className="w-3.5 h-3.5" />
                        {s.activeMembers}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
