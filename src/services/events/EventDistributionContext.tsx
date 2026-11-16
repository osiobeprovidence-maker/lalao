import React, { createContext, useContext, useState } from 'react';
import { ExternalEvent } from './types';

/**
 * External Events distribution.
 *
 * There is no seeded/demo data here. `externalEvents` starts empty and stays
 * empty until real external event partners sync into this context from a
 * backend integration. Without a backend feed this is an honest empty state —
 * never fabricated listings or metrics.
 *
 * Tracking helpers keep the counters at zero until real events exist.
 */
interface EventDistributionContextType {
  externalEvents: ExternalEvent[];

  // Tracking
  trackImpression: (eventId: string) => void;
  trackView: (eventId: string) => void;
  trackTicketClick: (eventId: string) => void;
}

const EventDistributionContext = createContext<EventDistributionContextType | null>(null);

export const EventDistributionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);

  const trackImpression = (eventId: string) => {
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, impressions: e.impressions + 1 } : e));
  };

  const trackView = (eventId: string) => {
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, views: e.views + 1 } : e));
  };

  const trackTicketClick = (eventId: string) => {
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, ticketClicks: e.ticketClicks + 1 } : e));
  };

  return (
    <EventDistributionContext.Provider value={{
      externalEvents,
      trackImpression,
      trackView,
      trackTicketClick
    }}>
      {children}
    </EventDistributionContext.Provider>
  );
};

export const useEventDistribution = () => {
  const context = useContext(EventDistributionContext);
  if (!context) throw new Error("useEventDistribution must be used within EventDistributionProvider");
  return context;
};
