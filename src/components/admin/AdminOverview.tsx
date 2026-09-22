// @ts-nocheck
import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Users, Building2, Repeat, CreditCard, TrendingUp, UserX, Activity } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const stats = useQuery(api.admin.getDashboardStats);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    sub,
  }: {
    label: string;
    value: string | number | undefined;
    icon: React.FC<any>;
    color: string;
    sub?: string;
  }) => (
    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:border-white/20 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">{label}</div>
        <div className="text-2xl font-black text-white">
          {value === undefined ? (
            <span className="inline-block w-16 h-6 bg-white/10 rounded animate-pulse" />
          ) : typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Platform Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Real-time statistics from the Lalao database.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          label="Total Pages"
          value={stats?.totalPages}
          icon={Building2}
          color="bg-violet-500/20 text-violet-400"
        />
        <StatCard
          label="Businesses"
          value={stats?.totalBusinesses}
          icon={Building2}
          color="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats?.activeSubscriptions}
          icon={Repeat}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="Transactions"
          value={stats?.totalTransactions}
          icon={CreditCard}
          color="bg-pink-500/20 text-pink-400"
        />
        <StatCard
          label="Transaction Volume"
          value={stats ? `₦${stats.totalTransactionAmount.toLocaleString()}` : undefined}
          icon={TrendingUp}
          color="bg-[#5E43F3]/20 text-[#5E43F3]"
        />
        {(stats?.suspendedUsers ?? 0) > 0 && (
          <StatCard
            label="Suspended Users"
            value={stats?.suspendedUsers}
            icon={UserX}
            color="bg-red-500/20 text-red-400"
            sub="Require attention"
          />
        )}
      </div>

      {/* Quick links */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Platform Sections</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Users', desc: 'Manage user accounts', color: 'border-blue-500/30 hover:border-blue-500/60' },
            { label: 'Pages & Businesses', desc: 'View all pages', color: 'border-violet-500/30 hover:border-violet-500/60' },
            { label: 'Subscriptions', desc: 'Platform-wide memberships', color: 'border-emerald-500/30 hover:border-emerald-500/60' },
            { label: 'Transactions', desc: 'All wallet activity', color: 'border-pink-500/30 hover:border-pink-500/60' },
            { label: 'Platform Settings', desc: 'Feature flags & config', color: 'border-amber-500/30 hover:border-amber-500/60' },
            { label: 'Audit Log', desc: 'Admin action history', color: 'border-neutral-500/30 hover:border-neutral-500/60' },
          ].map((item) => (
            <div
              key={item.label}
              className={`p-3 rounded-xl border transition-colors ${item.color} bg-white/[0.02]`}
            >
              <div className="text-sm font-bold text-white">{item.label}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System status */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">System Status</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-neutral-300 font-medium">All systems operational</span>
        </div>
        <p className="text-[11px] text-neutral-600 mt-1">Powered by Convex · Real-time data</p>
      </div>
    </div>
  );
};
