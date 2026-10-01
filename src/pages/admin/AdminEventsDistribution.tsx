import React from 'react';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { BarChart3, Calendar, Eye, MapPin, MousePointerClick } from 'lucide-react';

export const AdminEventsDistribution: React.FC = () => {
  const { externalEvents, apiPartners, totalImpressions, totalViews, totalTicketClicks } = useEventDistribution();
  
  const activeEvents = externalEvents.filter(e => e.status === 'active');
  
  const statCards = [
    { label: 'Active Events', value: activeEvents.length.toLocaleString(), icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Event Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Event Views', value: totalViews.toLocaleString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Ticket Clicks', value: totalTicketClicks.toLocaleString(), icon: MousePointerClick, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-theme-primary">Events Distribution Analytics</h1>
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
              <p className="text-2xl font-black text-theme-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm">
          <h3 className="font-bold text-lg text-theme-primary mb-4">Top Locations</h3>
          <div className="space-y-4">
            {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'].map((loc, i) => (
              <div key={loc} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-theme-tertiary" />
                  <span className="font-semibold text-theme-secondary">{loc}</span>
                </div>
                <div className="flex items-center gap-4 w-1/2">
                  <div className="h-2 flex-1 bg-theme-surface-hover rounded-full overflow-hidden">
                    <div className="h-full bg-[#5E43F3] rounded-full" style={{ width: `${100 - i * 20}%` }} />
                  </div>
                  <span className="text-sm font-bold text-theme-primary w-10 text-right">{100 - i * 20}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm">
          <h3 className="font-bold text-lg text-theme-primary mb-4">Top Categories</h3>
          <div className="space-y-4">
            {['Music', 'Technology', 'Business', 'Arts'].map((cat, i) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="font-semibold text-theme-secondary">{cat}</span>
                <div className="flex items-center gap-4 w-1/2">
                  <div className="h-2 flex-1 bg-theme-surface-hover rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${90 - i * 15}%` }} />
                  </div>
                  <span className="text-sm font-bold text-theme-primary w-10 text-right">{90 - i * 15}%</span>
                </div>
              </div>
            ))}
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
              {activeEvents.slice(0, 5).map((evt) => (
                <tr key={evt.id}>
                  <td className="px-4 py-4 text-theme-primary font-bold">{evt.title}</td>
                  <td className="px-4 py-4 text-theme-secondary">{evt.sourceName}</td>
                  <td className="px-4 py-4 text-theme-secondary">{evt.city}</td>
                  <td className="px-4 py-4 text-theme-secondary">{evt.impressions.toLocaleString()}</td>
                  <td className="px-4 py-4 text-theme-secondary">{evt.views.toLocaleString()}</td>
                  <td className="px-4 py-4 text-theme-secondary">{evt.ticketClicks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
