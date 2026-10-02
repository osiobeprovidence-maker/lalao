import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_ICONS = {
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  pending: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-600" />,
};

const STATUS_COLORS = {
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
};

export const AdminTransactions: React.FC = () => {
  const transactions = useQuery(api.admin.getTransactionsOverview, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-theme-primary">Transactions</h1>
        <p className="text-sm text-theme-tertiary mt-1">Platform-wide wallet activity and payments</p>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {transactions === undefined ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            No transactions found
          </div>
        ) : (
          transactions.map((t: any) => (
            <div key={t._id} className="bg-theme-surface border border-theme-divider rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-theme-primary">{t.description}</p>
                  {t.reference && <p className="text-[10px] font-mono text-theme-tertiary mt-0.5 break-all">{t.reference}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-theme-base px-2 py-1 rounded-lg border border-theme-divider-light">
                  {['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? (
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-bold text-sm ${['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? 'text-emerald-600' : 'text-theme-secondary'}`}>
                    ₦{t.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="text-xs">
                  <span className="text-theme-tertiary">User: </span>
                  <span className="font-medium text-theme-primary">{t.userName}</span>
                  <span className="text-theme-tertiary ml-1">({t.userEmail})</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-theme-divider-light">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-theme-tertiary uppercase tracking-wider font-semibold bg-theme-surface-hover px-2 py-0.5 rounded">
                    {t.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_ICONS[t.status as keyof typeof STATUS_ICONS]}
                    <span className="capitalize">{t.status}</span>
                  </span>
                </div>
                <span className="text-theme-tertiary text-[10px] font-medium">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
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
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Transaction</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-6 rounded bg-theme-surface-hover animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-tertiary text-sm">No transactions found</td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t._id} className="hover:bg-theme-base transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-theme-primary">{t.description}</p>
                      {t.reference && <p className="text-[10px] font-mono text-theme-tertiary mt-0.5">{t.reference}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-theme-secondary">{t.userName}</p>
                      <p className="text-[11px] text-theme-tertiary">{t.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? (
                          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? 'text-emerald-600' : 'text-theme-secondary'}`}>
                          ₦{t.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-theme-tertiary uppercase tracking-wider font-semibold">
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_ICONS[t.status as keyof typeof STATUS_ICONS]}
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-theme-tertiary text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
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
