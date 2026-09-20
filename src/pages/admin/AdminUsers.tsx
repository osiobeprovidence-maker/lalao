import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Shield, ShieldOff, UserCheck, UserX, ChevronRight } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  moderator: 'bg-amber-50 text-amber-700 border-amber-200',
  user: 'bg-neutral-100 text-neutral-600 border-neutral-200',
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
        <h1 className="text-2xl font-black text-neutral-900">Users</h1>
        <p className="text-sm text-neutral-500 mt-1">All registered Lalao users</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#5200FF] shadow-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer shadow-sm"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Pages</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users === undefined ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 rounded bg-neutral-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">No users found</td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-neutral-900">{u.name ?? '—'}</p>
                        <p className="text-[11px] text-neutral-500">{u.email ?? u.username ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role ?? 'user']}`}>
                        {u.role ?? 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{u.pageCount}</td>
                    <td className="px-4 py-3 text-neutral-600">{u.subscriptionCount}</td>
                    <td className="px-4 py-3 text-neutral-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">Suspended</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">Active</span>
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
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(u._id)}
                                title="Suspend user"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <select
                              value={u.role ?? 'user'}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="text-[11px] rounded-lg bg-white border border-neutral-200 text-neutral-700 px-2 py-1 focus:outline-none cursor-pointer shadow-sm"
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
