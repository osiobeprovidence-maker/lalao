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
  <div className={`rounded-2xl border bg-white p-5 flex flex-col gap-3 shadow-sm ${color.replace('border-', 'border-')}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.includes('indigo') ? 'bg-indigo-50 text-indigo-600' : color.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : color.includes('amber') ? 'bg-amber-50 text-amber-600' : color.includes('rose') ? 'bg-rose-50 text-rose-600' : color.includes('purple') ? 'bg-purple-50 text-purple-600' : color.includes('teal') ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-3xl font-black text-neutral-900">
      {value === null || value === undefined ? (
        <span className="text-neutral-400 text-base font-semibold">Not available</span>
      ) : (
        value.toLocaleString()
      )}
    </div>
    {sub && <p className="text-[11px] text-neutral-500">{sub}</p>}
  </div>
);

export const AdminDashboard: React.FC = () => {
  const role = useQuery(api.admin.getMyRole);
  
  const stats = useQuery(
    api.admin.getDashboardStats, 
    role === 'super_admin' || role === 'admin' || role === 'editor' ? {} : "skip"
  );
  const auditLog = useQuery(
    api.admin.listAuditLog, 
    role === 'super_admin' || role === 'admin' || role === 'editor' ? { limit: 8 } : "skip"
  );

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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-1">
            Lalao Admin
          </p>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            Platform Control Center
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time platform overview — all data from Convex
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      {stats === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="border-indigo-200"
            sub={stats.suspendedUsers > 0 ? `${stats.suspendedUsers} suspended` : 'No suspended accounts'}
          />
          <StatCard
            label="Total Pages"
            value={stats.totalPages}
            icon={Building2}
            color="border-blue-200"
            sub={`${stats.totalBusinesses} business pages`}
          />
          <StatCard
            label="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={CreditCard}
            color="border-emerald-200"
            sub="Active membership slots"
          />
          <StatCard
            label="Transactions"
            value={stats.totalTransactions}
            icon={Activity}
            color="border-amber-200"
            sub={`₦${(stats.totalTransactionAmount ?? 0).toLocaleString()} completed volume`}
          />
          <StatCard
            label="Suspended Users"
            value={stats.suspendedUsers}
            icon={AlertTriangle}
            color="border-rose-200"
          />
          <StatCard
            label="Businesses"
            value={stats.totalBusinesses}
            icon={Building2}
            color="border-purple-200"
            sub="Pages with type=business"
          />
          <StatCard
            label="Transaction Volume"
            value={`₦${(stats.totalTransactionAmount ?? 0).toLocaleString()}`}
            icon={ArrowUpRight}
            color="border-teal-200"
            sub="Completed transactions only"
          />
        </div>
      )}

      {/* Recent Audit Log + System Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Recent Platform Activity
          </h2>
          {auditLog === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : auditLog.length === 0 ? (
            <p className="text-sm text-neutral-500">No audit log entries yet.</p>
          ) : (
            <div className="space-y-2.5">
              {auditLog.map((entry: any) => (
                <div key={entry._id} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {entry.actorName ?? 'System'}{entry.target ? ` → ${entry.target}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            System Status
          </h2>
          <div className="space-y-3">
            {systemServices.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between py-1">
                <span className="text-sm text-neutral-600">{svc.name}</span>
                {svc.status === 'operational' ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Operational
                  </span>
                ) : svc.status === 'checking' ? (
                  <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold bg-neutral-100 px-2 py-1 rounded-full">
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
