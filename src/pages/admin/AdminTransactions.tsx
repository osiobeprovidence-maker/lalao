import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_ICONS = {
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  pending: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  failed: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
};

const STATUS_COLORS = {
  completed: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
  pending: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  failed: 'text-rose-400 bg-rose-900/30 border-rose-700/40',
};

export const AdminTransactions: React.FC = () => {
  const transactions = useQuery(api.admin.getTransactionsOverview, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Transactions</h1>
        <p className="text-sm text-slate-400 mt-1">Platform-wide wallet activity and payments</p>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Transaction</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-6 rounded bg-slate-800/60 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No transactions found</td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{t.description}</p>
                      {t.reference && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{t.reference}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{t.userName}</p>
                      <p className="text-[11px] text-slate-500">{t.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? (
                          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={`font-medium ${['deposit', 'transfer_in', 'prize_payout'].includes(t.type) ? 'text-emerald-400' : 'text-slate-200'}`}>
                          ₦{t.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_ICONS[t.status as keyof typeof STATUS_ICONS]}
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
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
