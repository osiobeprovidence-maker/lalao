import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CreditCard, Users } from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
  const subscriptions = useQuery(api.admin.getSubscriptionsOverview);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Subscriptions</h1>
        <p className="text-sm text-slate-400 mt-1">Platform-wide subscription listings and capacity</p>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Page</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Cycle</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Capacity</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscriptions === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 rounded bg-slate-800/60 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No subscriptions found</td>
                </tr>
              ) : (
                subscriptions.map((s: any) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.platformLogo ? (
                          <img src={s.platformLogo} alt={s.platformName} className="w-6 h-6 rounded object-contain bg-white" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                          </div>
                        )}
                        <span className="text-slate-300">{s.platformName ?? 'Custom'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{s.pageName}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{s.billingCycle}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="font-medium text-emerald-400">
                        {s.currency} {s.defaultSlotPrice.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-16">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${(s.occupiedSlots / s.totalCapacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {s.occupiedSlots}/{s.totalCapacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-400">
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
