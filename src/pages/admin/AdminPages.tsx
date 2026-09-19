import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Building2, Users } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  business: 'bg-blue-900/50 text-blue-300 border-blue-700/40',
  organization: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
  club: 'bg-amber-900/50 text-amber-300 border-amber-700/40',
  community: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
};

export const AdminPages: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const pages = useQuery(api.admin.listPages, {
    search: search || undefined,
    type: typeFilter || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Pages & Businesses</h1>
        <p className="text-sm text-slate-400 mt-1">All Lalao pages across the platform</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All types</option>
          <option value="business">Business</option>
          <option value="organization">Organization</option>
          <option value="club">Club</option>
          <option value="community">Community</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Page</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pages === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-6 rounded bg-slate-800/60 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No pages found</td>
                </tr>
              ) : (
                pages.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-[11px] text-slate-500">@{p.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[p.type] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{p.ownerName}</p>
                      {p.ownerEmail && <p className="text-[11px] text-slate-500">{p.ownerEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        {p.followersCount ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{p.subscriptionCount}</td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
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
