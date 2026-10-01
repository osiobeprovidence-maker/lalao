import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Shield } from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const auditLog = useQuery(api.admin.listAuditLog, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-theme-primary">Audit Log</h1>
        <p className="text-sm text-theme-tertiary mt-1">Platform administrative actions history</p>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {auditLog === undefined ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            Loading audit logs...
          </div>
        ) : auditLog.length === 0 ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            No audit logs found
          </div>
        ) : (
          auditLog.map((log: any) => (
            <div key={log._id} className="bg-theme-surface border border-theme-divider rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-theme-primary text-sm">{log.actorName}</p>
                    <p className="text-[11px] text-theme-tertiary">{log.actorEmail}</p>
                  </div>
                </div>
                <span className="text-theme-tertiary text-[10px] font-medium whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="bg-theme-base rounded-xl p-3 border border-theme-divider-light">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex rounded-full bg-theme-surface border border-theme-divider text-theme-secondary px-2.5 py-1 text-[11px] font-bold shadow-sm">
                    {log.action}
                  </span>
                  <span className="text-theme-tertiary text-xs">Target: <span className="font-medium text-theme-primary">{log.target ?? '—'}</span></span>
                </div>
                
                {(log.before || log.after) && (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-theme-divider">
                    {log.before && <div className="text-rose-600 text-[11px] break-all">- {log.before}</div>}
                    {log.after && <div className="text-emerald-600 text-[11px] break-all">+ {log.after}</div>}
                  </div>
                )}
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
              <tr className="border-b border-theme-divider">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {auditLog === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-6 rounded bg-theme-surface-hover animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-theme-tertiary text-sm">No audit logs found</td>
                </tr>
              ) : (
                auditLog.map((log: any) => (
                  <tr key={log._id} className="hover:bg-theme-base transition-colors">
                    <td className="px-4 py-3 text-theme-tertiary text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <Shield className="w-3 h-3 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-theme-primary text-xs">{log.actorName}</p>
                          <p className="text-[10px] text-theme-tertiary">{log.actorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-theme-surface-hover border border-theme-divider text-theme-secondary px-2.5 py-1 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-theme-secondary text-xs">
                      {log.target ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {(log.before || log.after) ? (
                        <div className="space-y-1">
                          {log.before && <div className="text-rose-600 truncate max-w-xs">- {log.before}</div>}
                          {log.after && <div className="text-emerald-600 truncate max-w-xs">+ {log.after}</div>}
                        </div>
                      ) : (
                        <span className="text-theme-tertiary">—</span>
                      )}
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
