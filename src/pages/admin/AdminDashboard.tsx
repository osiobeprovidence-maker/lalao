import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Users,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Activity,
  Database,
  Bell,
  CloudUpload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Rocket,
} from 'lucide-react';

const StatCard: React.FC<{
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  color: string;
  sub?: string;
}> = ({ label, value, icon: Icon, color, sub }) => (
  <div className={`rounded-2xl border bg-slate-900/60 backdrop-blur p-5 flex flex-col gap-3 ${color}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.includes('indigo') ? 'bg-indigo-900/50' : color.includes('emerald') ? 'bg-emerald-900/50' : color.includes('amber') ? 'bg-amber-900/50' : color.includes('rose') ? 'bg-rose-900/50' : 'bg-blue-900/50'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-3xl font-black text-white">
      {value === null || value === undefined ? (
        <span className="text-slate-500 text-base font-semibold">Not available</span>
      ) : (
        value.toLocaleString()
      )}
    </div>
    {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
  </div>
);

export const AdminDashboard: React.FC = () => {
  const stats = useQuery(api.admin.getDashboardStats);
  const auditLog = useQuery(api.admin.listAuditLog, { limit: 8 });
  const role = useQuery(api.admin.getMyRole);
  const bootstrapSuperAdmin = useMutation(api.admin.bootstrapSuperAdmin);

  const handleBootstrap = async () => {
    try {
      const result = await bootstrapSuperAdmin({});
      alert(`Super Admin bootstrapped! Status: ${result.status}`);
      window.location.reload();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const systemServices = [
    { name: 'Convex Database', status: stats !== undefined ? 'operational' : 'checking' },
    { name: 'Authentication', status: role !== undefined ? 'operational' : 'checking' },
    { name: 'Web Push (FCM)', status: 'check_pending' },
    { name: 'Storage (Cloudinary)', status: 'check_pending' },
    { name: 'Payments / Wallet', status: 'check_pending' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">
            Lalao Admin
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Platform Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform overview — all data from Convex
          </p>
        </div>
        {role !== 'super_admin' && role !== undefined && (
          <button
            onClick={handleBootstrap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            Bootstrap Super Admin
          </button>
        )}
      </div>

      {/* Metric Cards */}
      {stats === undefined ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-700/40 bg-slate-900/60 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="border-indigo-700/40 text-indigo-300"
            sub={stats.suspendedUsers > 0 ? `${stats.suspendedUsers} suspended` : 'No suspended accounts'}
          />
          <StatCard
            label="Total Pages"
            value={stats.totalPages}
            icon={Building2}
            color="border-blue-700/40 text-blue-300"
            sub={`${stats.totalBusinesses} business pages`}
          />
          <StatCard
            label="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={CreditCard}
            color="border-emerald-700/40 text-emerald-300"
            sub="Active membership slots"
          />
          <StatCard
            label="Transactions"
            value={stats.totalTransactions}
            icon={Activity}
            color="border-amber-700/40 text-amber-300"
            sub={`₦${(stats.totalTransactionAmount ?? 0).toLocaleString()} completed volume`}
          />
          <StatCard
            label="Suspended Users"
            value={stats.suspendedUsers}
            icon={AlertTriangle}
            color="border-rose-700/40 text-rose-300"
          />
          <StatCard
            label="Businesses"
            value={stats.totalBusinesses}
            icon={Building2}
            color="border-purple-700/40 text-purple-300"
            sub="Pages with type=business"
          />
          <StatCard
            label="Transaction Volume"
            value={`₦${(stats.totalTransactionAmount ?? 0).toLocaleString()}`}
            icon={ArrowUpRight}
            color="border-teal-700/40 text-teal-300"
            sub="Completed transactions only"
          />
        </div>
      )}

      {/* Recent Audit Log + System Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Platform Activity
          </h2>
          {auditLog === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : auditLog.length === 0 ? (
            <p className="text-sm text-slate-500">No audit log entries yet.</p>
          ) : (
            <div className="space-y-2.5">
              {auditLog.map((entry: any) => (
                <div key={entry._id} className="flex items-start gap-3 py-2 border-b border-slate-800/60 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {entry.actorName ?? 'System'}{entry.target ? ` → ${entry.target}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            System Status
          </h2>
          <div className="space-y-3">
            {systemServices.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{svc.name}</span>
                {svc.status === 'operational' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Operational
                  </span>
                ) : svc.status === 'checking' ? (
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <CloudUpload className="w-3.5 h-3.5" />
                    Check pending
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
