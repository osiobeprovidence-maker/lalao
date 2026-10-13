import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Trash2, 
  FlaskConical, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  RefreshCw,
  Eye,
  X,
  ShieldAlert
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  admin: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  moderator: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  user: 'bg-theme-surface-hover text-theme-secondary border-theme-divider',
};

export const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [testAccountFilter, setTestAccountFilter] = useState<'all' | 'test_only' | 'genuine_only'>('all');
  
  // Selection state for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Impact inspection / confirmation modal state
  const [modalMode, setModalMode] = useState<'single_delete' | 'bulk_delete' | 'dry_run' | null>(null);
  const [targetUserForDelete, setTargetUserForDelete] = useState<any>(null);
  const [deletionResults, setDeletionResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

  const users = useQuery(api.admin.listUsers, {
    search: search || undefined,
    role: roleFilter || undefined,
    isTestAccount: testAccountFilter === 'test_only' ? true : testAccountFilter === 'genuine_only' ? false : undefined,
    limit: 200,
  });

  const changeRole = useMutation(api.admin.changeUserRole);
  const suspend = useMutation(api.admin.suspendUser);
  const restore = useMutation(api.admin.restoreUser);
  const setTestAccountStatus = useMutation(api.admin.setTestAccountStatus);
  const deleteTestAccounts = useMutation(api.admin.deleteTestAccounts);

  // Queries impact of selected accounts when modal opens
  const isModalOpen = modalMode === 'single_delete' || modalMode === 'bulk_delete' || modalMode === 'dry_run';
  const targetIdsForImpact = isModalOpen
    ? (modalMode === 'single_delete' && targetUserForDelete ? [targetUserForDelete._id] : selectedUserIds)
    : [];

  const impactData = useQuery(
    api.admin.getTestAccountImpact,
    isModalOpen && targetIdsForImpact.length > 0 ? { userIds: targetIdsForImpact as any } : 'skip'
  );

  const handleToggleSelectAll = () => {
    if (!users) return;
    const selectable = users.filter((u: any) => u.is_test_account && u.role !== 'super_admin');
    if (selectedUserIds.length === selectable.length && selectable.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectable.map((u: any) => u._id));
    }
  };

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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

  const handleToggleTestStatus = async (user: any) => {
    const nextStatus = !user.is_test_account;
    const confirmMsg = nextStatus 
      ? `Mark ${user.name || user.username || user._id} as an explicit TEST / DEMO account?` 
      : `Unmark ${user.name || user.username || user._id} as a test account (treat as genuine)?`;
    
    if (!confirm(confirmMsg)) return;
    try {
      await setTestAccountStatus({
        userId: user._id as any,
        isTestAccount: nextStatus,
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const executeDelete = async (dryRun = false) => {
    const ids = modalMode === 'single_delete' && targetUserForDelete 
      ? [targetUserForDelete._id] 
      : selectedUserIds;

    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await deleteTestAccounts({
        userIds: ids as any,
        dryRun,
      });
      setDeletionResults(res);
      if (!dryRun) {
        setSelectedUserIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    } catch (e: any) {
      alert(`Deletion error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetUserForDelete(null);
    setDeletionResults(null);
    setConfirmationInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary">Users & Test Account Management</h1>
          <p className="text-sm text-theme-tertiary mt-1">Manage platform members and safely purge confirmed development/demo accounts.</p>
        </div>

        {/* Bulk Action Controls */}
        {selectedUserIds.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {selectedUserIds.length} test account(s) selected
            </span>
            <button
              onClick={() => {
                setModalMode('dry_run');
                setDeletionResults(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-theme-surface border border-theme-divider text-theme-primary hover:bg-theme-surface-hover transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview Impact
            </button>
            <button
              onClick={() => {
                setModalMode('bulk_delete');
                setDeletionResults(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="p-1 text-theme-tertiary hover:text-theme-primary transition cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username, or account ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-theme-surface border border-theme-divider text-theme-primary text-sm placeholder:text-theme-tertiary focus:outline-none focus:border-[#5200FF] shadow-sm"
          />
        </div>
        
        <select
          value={testAccountFilter}
          onChange={(e) => setTestAccountFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider text-theme-primary text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer shadow-sm font-medium"
        >
          <option value="all">All Accounts (Test & Genuine)</option>
          <option value="test_only">Test / Demo Accounts Only</option>
          <option value="genuine_only">Genuine Users Only</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider text-theme-primary text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer shadow-sm"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users === undefined ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            No users found.
          </div>
        ) : (
          users.map((u: any) => (
            <div key={u._id} className="bg-theme-surface border border-theme-divider rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-theme-primary">{u.name ?? '—'}</p>
                    {u.is_test_account ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold">
                        <FlaskConical className="w-3 h-3" />
                        Test
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                        Genuine
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-theme-tertiary mt-0.5">{u.email ?? u.username ?? '—'}</p>
                  <p className="text-[10px] text-theme-tertiary font-mono">{u._id}</p>
                </div>
                {u.suspended ? (
                  <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">Suspended</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">Active</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role ?? 'user']}`}>
                  {u.role ?? 'user'}
                </span>
                <span className="text-theme-tertiary text-[11px]">
                  Pages: <span className="font-semibold text-theme-primary">{u.pageCount}</span>
                </span>
                <span className="text-theme-tertiary text-[11px]">
                  Subs: <span className="font-semibold text-theme-primary">{u.subscriptionCount}</span>
                </span>
                <span className="text-theme-tertiary text-[11px] ml-auto">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-theme-divider-light flex-wrap">
                {u.role !== 'super_admin' && (
                  <>
                    <button
                      onClick={() => handleToggleTestStatus(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        u.is_test_account 
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 hover:bg-purple-100' 
                          : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-active'
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5 inline mr-1" />
                      {u.is_test_account ? 'Unmark Test' : 'Mark Test'}
                    </button>

                    {u.is_test_account && (
                      <button
                        onClick={() => {
                          setTargetUserForDelete(u);
                          setModalMode('single_delete');
                        }}
                        className="px-2.5 py-1 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        Delete
                      </button>
                    )}
                  </>
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
              <tr className="border-b border-theme-divider bg-theme-base/50">
                <th className="px-4 py-3 text-left w-10">
                  <button 
                    onClick={handleToggleSelectAll}
                    className="text-theme-tertiary hover:text-theme-primary transition cursor-pointer"
                    title="Select all test accounts"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">User / ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Pages</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Subs</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Created</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {users === undefined ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-6 rounded bg-theme-surface-hover animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-theme-tertiary text-sm">No users found</td>
                </tr>
              ) : (
                users.map((u: any) => {
                  const isSelected = selectedUserIds.includes(u._id);
                  const isSelectable = u.is_test_account && u.role !== 'super_admin';

                  return (
                    <tr key={u._id} className={`hover:bg-theme-base transition-colors ${isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''}`}>
                      <td className="px-4 py-3">
                        {isSelectable ? (
                          <button
                            onClick={() => handleToggleSelect(u._id)}
                            className="text-theme-tertiary hover:text-purple-600 transition cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4 h-4 inline-block opacity-20">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-theme-primary">{u.name ?? '—'}</p>
                          <p className="text-[11px] text-theme-tertiary">{u.email ?? u.username ?? '—'}</p>
                          <p className="text-[10px] text-theme-tertiary/70 font-mono select-all">{u._id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_test_account ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold">
                            <FlaskConical className="w-3 h-3" />
                            Test Account
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                            Genuine User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role ?? 'user']}`}>
                          {u.role ?? 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-theme-secondary">{u.pageCount}</td>
                      <td className="px-4 py-3 text-theme-secondary">{u.subscriptionCount}</td>
                      <td className="px-4 py-3 text-theme-tertiary text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.suspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">Suspended</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== 'super_admin' && (
                            <>
                              {/* Mark / Unmark Test button */}
                              <button
                                onClick={() => handleToggleTestStatus(u)}
                                title={u.is_test_account ? "Unmark as test account" : "Mark as confirmed test account"}
                                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  u.is_test_account
                                    ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                    : 'text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-primary'
                                }`}
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                              </button>

                              {/* Individual Delete Test Account */}
                              {u.is_test_account && (
                                <button
                                  onClick={() => {
                                    setTargetUserForDelete(u);
                                    setModalMode('single_delete');
                                  }}
                                  title="Delete this test account"
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

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
                                className="text-[11px] rounded-lg bg-theme-surface border border-theme-divider text-theme-secondary px-2 py-1 focus:outline-none cursor-pointer shadow-sm"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Confirmation / Impact Preview / Deletion Results */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-theme-surface border border-theme-divider rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-theme-tertiary hover:text-theme-primary transition rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Results Display */}
            {deletionResults ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-theme-primary">
                      {deletionResults.results?.some((r: any) => r.status === 'dry_run') ? 'Dry Run Completed' : 'Deletion Completed'}
                    </h3>
                    <p className="text-xs text-theme-tertiary">
                      {deletionResults.deletedCount} account(s) purged, {deletionResults.totalRequested} processed.
                    </p>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 divide-y divide-theme-divider/50 border border-theme-divider rounded-xl p-3 bg-theme-base/50">
                  {deletionResults.results?.map((res: any) => (
                    <div key={res.userId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <span className="font-mono text-theme-secondary truncate max-w-[200px]">{res.userId}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        res.status === 'deleted' 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : res.status === 'dry_run'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {res.status} {res.reason ? `(${res.reason})` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-theme-inverse text-theme-text-inverse font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    modalMode === 'dry_run' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {modalMode === 'dry_run' ? <Eye className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-theme-primary">
                      {modalMode === 'single_delete' 
                        ? 'Confirm Test Account Deletion' 
                        : modalMode === 'bulk_delete'
                        ? `Bulk Purge (${selectedUserIds.length} Test Accounts)`
                        : 'Dry-Run Impact Preview'}
                    </h3>
                    <p className="text-xs text-theme-tertiary">
                      {modalMode === 'dry_run' 
                        ? 'Simulates cleanup without altering database records.' 
                        : 'Permanent cleanup of confirmed test accounts and related data.'}
                    </p>
                  </div>
                </div>

                {/* Impact Analysis Breakdown */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Platform Integrity Protection Notice
                    </p>
                    Only accounts marked with <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">is_test_account: true</code> are eligible. Genuine user accounts, financial transaction logs, and super admin accounts are protected and cannot be deleted.
                  </div>

                  {impactData === undefined ? (
                    <div className="py-6 text-center text-xs text-theme-tertiary animate-pulse">
                      Analyzing associated database records...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-theme-primary uppercase tracking-wider">Affected Records Breakdown</p>
                      {impactData.map((summary: any) => (
                        <div key={summary.userId} className="p-3 rounded-xl border border-theme-divider bg-theme-base/60 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-theme-primary">{summary.name} (@{summary.username})</span>
                            <span className="font-mono text-[10px] text-theme-tertiary">{summary.userId}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-theme-secondary pt-1 border-t border-theme-divider/50">
                            <div>Posts: <span className="font-bold text-theme-primary">{summary.counts.posts}</span></div>
                            <div>Comments: <span className="font-bold text-theme-primary">{summary.counts.comments}</span></div>
                            <div>Pages: <span className="font-bold text-theme-primary">{summary.counts.pages}</span></div>
                            <div>Follows: <span className="font-bold text-theme-primary">{summary.counts.followsGiven + summary.counts.followsReceived}</span></div>
                            <div>Notifications: <span className="font-bold text-theme-primary">{summary.counts.notifications}</span></div>
                            <div>Wallets: <span className="font-bold text-theme-primary">{summary.counts.wallets}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Explicit Type-to-Confirm for Deletions */}
                {modalMode !== 'dry_run' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-theme-primary mb-1">
                      Type <span className="font-mono text-rose-600">DELETE</span> to confirm:
                    </label>
                    <input
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-xs focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="pt-4 border-t border-theme-divider flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-3.5 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-secondary font-bold text-xs hover:bg-theme-surface-hover transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  {modalMode === 'dry_run' ? (
                    <button
                      onClick={() => executeDelete(true)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? 'Simulating...' : 'Run Simulation'}
                    </button>
                  ) : (
                    <button
                      onClick={() => executeDelete(false)}
                      disabled={confirmationInput !== 'DELETE' || isProcessing}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Deleting...' : 'Permanently Delete'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
