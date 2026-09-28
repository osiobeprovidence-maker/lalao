import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Building2, Users, Edit2, Play } from 'lucide-react';

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

  const bootstrapPages = useMutation(api.admin.bootstrapPlatformPages);
  const assignOwner = useMutation(api.admin.assignPageOwner);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const searchResults = useQuery(api.admin.listUsers, assignModalOpen ? { search: userSearch || undefined, limit: 5 } : 'skip') || [];
  const [assigning, setAssigning] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const handleBootstrap = async () => {
    try {
      setBootstrapping(true);
      const res = await bootstrapPages();
      const details = (res.results || []).map((r: any) => `✓ ${r.name} — ${r.status}`).join('\n');
      alert(`System Pages:\n\n${details}`);
    } catch (e: any) {
      alert(e.message || 'Failed to bootstrap pages');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage || !targetEmail) return;
    try {
      setAssigning(true);
      const res = await assignOwner({ pageId: selectedPage._id, targetEmail });
      alert(res.message);
      setAssignModalOpen(false);
      setTargetEmail('');
    } catch (e: any) {
      alert(e.message || 'Failed to assign owner');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Pages & Businesses</h1>
          <p className="text-sm text-neutral-500 mt-1">All Lalao pages across the platform</p>
        </div>
        <button
          onClick={handleBootstrap}
          disabled={bootstrapping}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {bootstrapping ? 'Running...' : 'Bootstrap System Pages'}
        </button>
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
          <option value="commerce_partner">Commerce Partner</option>
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-neutral-500">Owner: </span>
                    <span className="font-medium text-neutral-900">{p.ownerName}</span>
                    {p.ownerEmail && <span className="text-neutral-400 ml-1">({p.ownerEmail})</span>}
                  </div>
                  <button 
                    onClick={() => { setSelectedPage(p); setAssignModalOpen(true); }}
                    className="p-1 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded"
                    title="Re-assign owner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
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
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Partner</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Created</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Actions</th>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">No pages found</td>
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
                      {p.partnerType === 'COMMERCE_PARTNER' ? (
                        <span className="text-xs font-bold text-indigo-600">Commerce</span>
                      ) : p.partnerType ? (
                        <span className="text-xs font-medium text-neutral-600">{p.partnerType}</span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
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
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => { setSelectedPage(p); setAssignModalOpen(true); }}
                        className="p-1.5 text-neutral-400 hover:text-[#5E43F3] bg-neutral-50 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Re-assign owner"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Owner Modal */}
      {assignModalOpen && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-neutral-900 mb-1">Assign Owner</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Assigning ownership for page <span className="font-bold text-neutral-900">{selectedPage.name}</span>
            </p>

            <form onSubmit={handleAssignOwner} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                  Search Users
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#5E43F3]"
                    placeholder="Search by name or @username..."
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-1 border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-500">No users found</div>
                  ) : (
                    searchResults.map((u: any) => (
                      <div 
                        key={u._id}
                        onClick={() => setTargetEmail(u.email)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${targetEmail === u.email ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white hover:shadow-sm border border-transparent'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-bold bg-neutral-200">
                              {u.name?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">{u.name}</p>
                          <p className="text-xs text-neutral-500 truncate">@{u.username} • {u.email}</p>
                        </div>
                        {targetEmail === u.email && (
                          <div className="w-2 h-2 rounded-full bg-[#5E43F3]"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !targetEmail}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#5E43F3] hover:bg-[#4E34E0] disabled:opacity-50 transition-colors"
                >
                  {assigning ? 'Assigning...' : 'Assign Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
