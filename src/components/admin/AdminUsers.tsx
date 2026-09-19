import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Shield, UserX, UserCheck, ChevronDown } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-neutral-700 text-neutral-300',
  moderator: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-amber-500/20 text-amber-400',
  super_admin: 'bg-[#5E43F3]/20 text-[#5E43F3]',
};

export const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'suspend' | 'restore';
    userId: string;
    userName: string;
    newRole?: string;
  } | null>(null);

  const users = useQuery(api.admin.listUsers, {
    search: search || undefined,
    role: roleFilter || undefined,
    limit: 100,
  });

  const changeRole = useMutation(api.admin.changeUserRole);
  const suspend = useMutation(api.admin.suspendUser);
  const restore = useMutation(api.admin.restoreUser);

  const handleRoleChange = async (userId: string, role: string) => {
    await changeRole({ userId: userId as any, role: role as any });
    setConfirmAction(null);
  };

  const handleSuspend = async (userId: string) => {
    await suspend({ userId: userId as any });
    setConfirmAction(null);
  };

  const handleRestore = async (userId: string) => {
    await restore({ userId: userId as any });
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Users</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage all Lalao user accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#5E43F3]/60"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5E43F3]/60"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
        {users === undefined ? (
          <div className="p-8 text-center text-neutral-500 text-sm">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-bold">User</th>
                  <th className="px-4 py-3 text-left font-bold">Role</th>
                  <th className="px-4 py-3 text-left font-bold hidden sm:table-cell">Pages</th>
                  <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Subs</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{u.name || '—'}</div>
                      <div className="text-[11px] text-neutral-500">
                        {u.email || u.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${ROLE_COLORS[u.role ?? 'user']}`}>
                        {ROLE_LABELS[u.role ?? 'user']}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 hidden sm:table-cell">{u.pageCount}</td>
                    <td className="px-4 py-3 text-neutral-400 hidden md:table-cell">{u.subscriptionCount}</td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Suspended</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== 'super_admin' && (
                          <>
                            {u.suspended ? (
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'restore', userId: u._id, userName: u.name || u.email })}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                title="Restore user"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'suspend', userId: u._id, userName: u.name || u.email })}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                                title="Suspend user"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <select
                              value={u.role ?? 'user'}
                              onChange={(e) => setConfirmAction({ type: 'role', userId: u._id, userName: u.name || u.email, newRole: e.target.value })}
                              className="text-[11px] bg-neutral-800 border border-white/10 rounded-lg px-2 py-1.5 text-neutral-300 focus:outline-none focus:border-[#5E43F3]/60 cursor-pointer"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </>
                        )}
                        {u.role === 'super_admin' && (
                          <span className="text-[10px] text-neutral-600">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-white mb-2">Confirm Action</h3>
            <p className="text-sm text-neutral-400 mb-6">
              {confirmAction.type === 'role' && `Change ${confirmAction.userName}'s role to "${ROLE_LABELS[confirmAction.newRole ?? 'user']}"?`}
              {confirmAction.type === 'suspend' && `Suspend ${confirmAction.userName}? They will lose access to Lalao.`}
              {confirmAction.type === 'restore' && `Restore ${confirmAction.userName}'s access?`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm font-bold hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmAction.type === 'role' && confirmAction.newRole) {
                    await handleRoleChange(confirmAction.userId, confirmAction.newRole);
                  } else if (confirmAction.type === 'suspend') {
                    await handleSuspend(confirmAction.userId);
                  } else if (confirmAction.type === 'restore') {
                    await handleRestore(confirmAction.userId);
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-black cursor-pointer ${
                  confirmAction.type === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#5E43F3] hover:bg-[#4E34E0]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
