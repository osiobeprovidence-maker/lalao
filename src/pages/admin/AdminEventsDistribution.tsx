import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Calendar, MapPin, Tag, Users, DollarSign, Database, Inbox } from 'lucide-react';

/**
 * Admin → Events Distribution analytics.
 * Wired to the real API Partners backend (`apiPartners.getDashboardStats`).
 * Where no distribution data source exists yet, an honest empty state is
 * shown — never fabricated percentages or cities.
 */
export const AdminEventsDistribution: React.FC = () => {
  const stats = useQuery(api.apiPartners.getDashboardStats);

  const statCards = [
    { label: 'Active Partners', value: (stats?.activePartners ?? 0).toLocaleString(), icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Monthly Revenue', value: `₦${(stats?.mrr ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'API Requests', value: (stats?.totalRequests ?? 0).toLocaleString(), icon: Database, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Events', value: (stats?.activeEvents ?? 0).toLocaleString(), icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-theme-primary">Events Distribution Analytics</h1>
        <p className="text-sm text-theme-tertiary mt-1">Track the performance of events imported from external APIs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm">
          <h3 className="font-bold text-lg text-theme-primary mb-4">Top Locations</h3>
          <div className="flex flex-col items-center justify-center border border-dashed border-theme-divider-light rounded-2xl py-10 px-6 text-center">
            <MapPin className="w-6 h-6 text-theme-tertiary mb-2" />
            <p className="text-sm font-bold text-theme-primary">No distributed events yet</p>
            <p className="text-xs text-theme-tertiary mt-1 max-w-xs">
              Location breakdowns appear here once connected partners begin pushing events to Lalao.
            </p>
          </div>
        </div>

        <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm">
          <h3 className="font-bold text-lg text-theme-primary mb-4">Top Categories</h3>
          <div className="flex flex-col items-center justify-center border border-dashed border-theme-divider-light rounded-2xl py-10 px-6 text-center">
            <Tag className="w-6 h-6 text-theme-tertiary mb-2" />
            <p className="text-sm font-bold text-theme-primary">No distributed events yet</p>
            <p className="text-xs text-theme-tertiary mt-1 max-w-xs">
              Category performance appears here once real distribution data exists.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm mt-6">
        <h3 className="font-bold text-lg text-theme-primary mb-4">Top Performing Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-theme-base text-theme-tertiary font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Event Title</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3 rounded-r-lg">Ticket Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-theme-tertiary">
                    <Inbox className="w-6 h-6" />
                    <p className="text-sm font-semibold text-theme-secondary">No distributed partner events yet</p>
                    <p className="text-xs">Metrics for imported partner events will show up here once distribution is live.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
