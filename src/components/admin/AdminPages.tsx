import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Building2, Users, Repeat, ShoppingBag } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  business: 'bg-amber-500/20 text-amber-400',
  organization: 'bg-blue-500/20 text-blue-400',
  club: 'bg-violet-500/20 text-violet-400',
  community: 'bg-emerald-500/20 text-emerald-400',
};

const BIZ_COLORS: Record<string, string> = {
  commerce: 'bg-pink-500/20 text-pink-400',
  subscription: 'bg-[#5E43F3]/20 text-[#5E43F3]',
  hybrid: 'bg-amber-500/20 text-amber-400',
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
        <p className="text-sm text-neutral-500 mt-1">All Lalao pages and business accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search pages by name or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#5E43F3]/60"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5E43F3]/60"
        >
          <option value="">All Types</option>
          <option value="business">Business</option>
          <option value="organization">Organization</option>
          <option value="club">Club</option>
          <option value="community">Community</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
        {pages === undefined ? (
          <div className="p-8 text-center text-neutral-500 text-sm">Loading pages…</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">No pages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-bold">Page</th>
                  <th className="px-4 py-3 text-left font-bold">Type</th>
                  <th className="px-4 py-3 text-left font-bold hidden sm:table-cell">Owner</th>
                  <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Business Model</th>
                  <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Active Tools</th>
                  <th className="px-4 py-3 text-left font-bold">Subs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pages.map((p: any) => (
                  <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#5E43F3]/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-[#5E43F3]" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-neutral-500">@{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${TYPE_COLORS[p.type] ?? 'bg-neutral-700 text-neutral-300'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs text-neutral-300">{p.ownerName}</div>
                      <div className="text-[11px] text-neutral-600">{p.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.businessType ? (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${BIZ_COLORS[p.businessType] ?? 'bg-neutral-700 text-neutral-300'}`}>
                          {p.businessType}
                        </span>
                      ) : <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.activeTools ?? []).map((tool: string) => (
                          <span key={tool} className="text-[9px] font-bold px-1.5 py-0.5 bg-white/5 text-neutral-400 rounded uppercase">
                            {tool}
                          </span>
                        ))}
                        {(!p.activeTools || p.activeTools.length === 0) && <span className="text-neutral-600 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-300 font-bold">{p.subscriptionCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
