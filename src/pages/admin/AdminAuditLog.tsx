import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Shield } from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const auditLog = useQuery(api.admin.listAuditLog, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">Audit Log</h1>
        <p className="text-sm text-neutral-500 mt-1">Platform administrative actions history</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {auditLog === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-6 rounded bg-neutral-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 text-sm">No audit logs found</td>
                </tr>
              ) : (
                auditLog.map((log: any) => (
                  <tr key={log._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <Shield className="w-3 h-3 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 text-xs">{log.actorName}</p>
                          <p className="text-[10px] text-neutral-500">{log.actorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 px-2.5 py-1 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-xs">
                      {log.target ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {(log.before || log.after) ? (
                        <div className="space-y-1">
                          {log.before && <div className="text-rose-600 truncate max-w-xs">- {log.before}</div>}
                          {log.after && <div className="text-emerald-600 truncate max-w-xs">+ {log.after}</div>}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
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
