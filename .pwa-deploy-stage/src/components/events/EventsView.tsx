import React, { useState } from 'react';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { useLalao } from '../../context/LalaoContext';
import { calculateDistanceMeters } from '../../utils/locationUtils';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { ExternalEventDetailModal } from './ExternalEventDetailModal';

export interface EventsViewProps {
  locationMode?: 'current' | 'selected' | 'global';
  maxRadiusMeters?: number;
}

export const EventsView: React.FC<EventsViewProps> = ({ locationMode = 'global', maxRadiusMeters = Infinity }) => {
  const { location, currentUser } = useLalao();
  const { externalEvents, trackImpression } = useEventDistribution();
  const [activeTab, setActiveTab] = useState<'for_you' | 'nearby' | 'popular' | 'upcoming'>('for_you');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const activeEvents = externalEvents.filter(e => e.status === 'active');

  const getDistance = (lat: number, lng: number) => {
    if (!location.latitude || !location.longitude) return 0;
    return calculateDistanceMeters(location.latitude, location.longitude, lat, lng) / 1000;
  };

  const filteredEvents = activeEvents.filter(e => {
    if (locationMode === 'global') return true;
    const dist = getDistance(e.latitude, e.longitude) * 1000;
    return dist <= maxRadiusMeters;
  });

  const sortedEvents = (() => {
    const events = [...filteredEvents];
    switch (activeTab) {
      case 'nearby':
        return events.sort((a, b) => getDistance(a.latitude, a.longitude) - getDistance(b.latitude, b.longitude));
      case 'popular':
        return events.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'upcoming':
        return events.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      case 'for_you':
        const userInterests = currentUser?.interests || [];
        if (userInterests.length === 0) return events;
        // mock logic for recommended events based on interests or category
        return events.filter(e => userInterests.includes(e.category));
      default:
        return events;
    }
  })();

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-4 pt-6 pb-2 sticky top-0 z-10 bg-theme-base/95 backdrop-blur-sm">
        <h1 className="text-xl sm:text-2xl font-black text-theme-primary mb-4">Discover Events</h1>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
          {['for_you', 'nearby', 'popular', 'upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-[#5E43F3] text-white shadow-sm' : 'bg-black/5 text-theme-secondary hover:bg-black/10 hover:text-theme-primary'
              }`}
            >
              {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center text-theme-tertiary py-12 font-medium">No events found in this category.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedEvents.map(evt => {
              const distance = getDistance(evt.latitude, evt.longitude).toFixed(1);
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className="bg-theme-surface rounded-xl overflow-hidden shadow-sm border border-theme-divider-light cursor-pointer hover:shadow-md transition"
                  onMouseEnter={() => trackImpression(evt.id)}
                >
                  <div className="relative w-full pt-[56.25%]">
                    <img src={evt.imageUrl} alt={evt.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-theme-surface/90 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold text-theme-primary shadow">
                      {evt.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-lg text-theme-primary mb-2 line-clamp-1">{evt.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-theme-secondary mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#5E43F3]" />
                        <span>{new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#5E43F3]" />
                        <span>{evt.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-theme-tertiary mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{evt.area}, {evt.city}{activeTab === 'nearby' && ` • ${distance} km`}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-theme-divider-light">
                      <div>
                        <span className="text-xs font-bold text-theme-tertiary uppercase block mb-0.5">Price</span>
                        <span className="font-black text-theme-primary">
                          {evt.price === 0 ? 'Free' : `${evt.currency} ${evt.price.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-theme-tertiary uppercase block">Powered by</span>
                          <span className="text-xs font-black text-theme-primary">{evt.sourceName}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-theme-surface-hover flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-theme-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEventId && (
        <ExternalEventDetailModal 
          eventId={selectedEventId} 
          onClose={() => setSelectedEventId(null)} 
        />
      )}
    </div>
  );
};
