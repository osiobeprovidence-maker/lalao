import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CheckCircle2, XCircle } from 'lucide-react';

export const AdminSubPlatforms: React.FC = () => {
  const platforms = useQuery(api.admin.listSubscriptionPlatformsAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Subscription Platforms</h1>
          <p className="text-sm text-slate-400 mt-1">Manage global platforms available for businesses</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition">
          + Add Platform
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Platform</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {platforms === undefined ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading platforms...</td>
              </tr>
            ) : platforms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">No platforms created yet.</td>
              </tr>
            ) : (
              platforms.map((p: any) => (
                <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.logo} alt={p.name} className="w-8 h-8 rounded bg-white object-contain" />
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 text-[11px] font-bold">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                        <XCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-indigo-400 hover:text-indigo-300 text-xs font-bold">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
