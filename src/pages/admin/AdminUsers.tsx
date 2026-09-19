import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Shield, ShieldOff, UserCheck, UserX, ChevronRight } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/40',
  admin: 'bg-blue-900/60 text-blue-300 border-blue-700/40',
  moderator: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
  user: 'bg-slate-800 text-slate-400 border-slate-700/40',
};

export const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const users = useQuery(api.admin.listUsers, {
    search: search || undefined,
    role: roleFilter || undefined,
    limit: 100,
  });

  const changeRole = useMutation(api.admin.changeUserRole);
  const suspend = useMutation(api.admin.suspendUser);
  const restore = useMutation(api.admin.restoreUser);

  const handleRoleChange = async (userId: string, role: any) => {
    try {
      await changeRole({ userId: userId as any, role });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user?')) return;
    try {
      await suspend({ userId: userId as any });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await restore({ userId: userId as any });
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Users</h1>
        <p className="text-sm text-slate-400 mt-1">All registered Lalao users</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pages</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users === undefined ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 rounded bg-slate-800/60 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No users found</td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{u.name ?? '—'}</p>
                        <p className="text-[11px] text-slate-500">{u.email ?? u.username ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role ?? 'user']}`}>
                        {u.role ?? 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.pageCount}</td>
                    <td className="px-4 py-3 text-slate-400">{u.subscriptionCount}</td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-900/40 text-rose-400 border border-rose-700/40 px-2 py-0.5 text-[10px] font-bold">Suspended</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 text-[10px] font-bold">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.role !== 'super_admin' && (
                          <>
                            {u.suspended ? (
                              <button
                                onClick={() => handleRestore(u._id)}
                                title="Restore user"
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(u._id)}
                                title="Suspend user"
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-900/30 transition cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <select
                              value={u.role ?? 'user'}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="text-[11px] rounded-lg bg-slate-800 border border-slate-700/40 text-slate-300 px-2 py-1 focus:outline-none cursor-pointer"
                              title="Change role"
                            >
                              <option value="user">user</option>
                              <option value="moderator">moderator</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                          </>
                        )}
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
