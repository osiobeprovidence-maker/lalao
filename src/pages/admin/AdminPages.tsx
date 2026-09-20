import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Building2, Users } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  business: 'bg-blue-50 text-blue-700 border-blue-200',
  organization: 'bg-purple-50 text-purple-700 border-purple-200',
  club: 'bg-amber-50 text-amber-700 border-amber-200',
  community: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
        <h1 className="text-2xl font-black text-neutral-900">Pages & Businesses</h1>
        <p className="text-sm text-neutral-500 mt-1">All Lalao pages across the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#5200FF] shadow-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer shadow-sm"
        >
          <option value="">All types</option>
          <option value="business">Business</option>
          <option value="organization">Organization</option>
          <option value="club">Club</option>
          <option value="community">Community</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {pages === undefined ? (
          <div className="text-center py-8 text-neutral-500 bg-white rounded-2xl border border-neutral-200 shadow-sm text-sm">
            Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 bg-white rounded-2xl border border-neutral-200 shadow-sm text-sm">
            No pages found
          </div>
        ) : (
          pages.map((p: any) => (
            <div key={p._id} className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">@{p.username}</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${TYPE_COLORS[p.type] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                  {p.type}
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-3 text-xs">
                <div>
                  <span className="text-neutral-500">Owner: </span>
                  <span className="font-medium text-neutral-900">{p.ownerName}</span>
                  {p.ownerEmail && <span className="text-neutral-400 ml-1">({p.ownerEmail})</span>}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-neutral-600">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{p.followersCount ?? 0}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Subs: <span className="font-semibold text-neutral-900">{p.subscriptionCount}</span>
                  </div>
                </div>
                <span className="text-neutral-400 text-[10px] font-medium">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Page</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pages === undefined ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-6 rounded bg-neutral-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">No pages found</td>
                </tr>
              ) : (
                pages.map((p: any) => (
                  <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 text-neutral-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{p.name}</p>
                          <p className="text-[11px] text-neutral-500">@{p.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[p.type] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-900 text-sm">{p.ownerName}</p>
                      {p.ownerEmail && <p className="text-[11px] text-neutral-500">{p.ownerEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <Users className="w-3.5 h-3.5" />
                        {p.followersCount ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.subscriptionCount}</td>
                    <td className="px-4 py-3 text-neutral-500 text-[11px]">
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
