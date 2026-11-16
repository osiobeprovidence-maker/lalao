import React, { createContext, useContext, useState, useEffect } from 'react';
import { ExternalEvent, ApiPartner, ExternalEventPayload } from './types';
import { useAuth } from '../../context/AuthContext';

interface EventDistributionContextType {
  externalEvents: ExternalEvent[];
  apiPartners: ApiPartner[];
  
  // Analytics
  totalImpressions: number;
  totalViews: number;
  totalTicketClicks: number;
  
  // Actions
  importMockEvent: (payload: ExternalEventPayload) => Promise<void>;
  updateMockEvent: (id: string, updates: Partial<ExternalEventPayload>) => Promise<void>;
  cancelMockEvent: (id: string) => Promise<void>;
  
  // Tracking
  trackImpression: (eventId: string) => void;
  trackView: (eventId: string) => void;
  trackTicketClick: (eventId: string) => void;
}

const EventDistributionContext = createContext<EventDistributionContextType | null>(null);

export const EventDistributionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [apiPartners, setApiPartners] = useState<ApiPartner[]>([]);
  
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalTicketClicks, setTotalTicketClicks] = useState(0);

  // MOCK API LAYER
  const importMockEvent = async (payload: ExternalEventPayload) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    
    const newEvent: ExternalEvent = {
      id: `evt_${Date.now()}`,
      externalId: payload.external_id,
      sourceId: 'partner_my_events', // mocked to only partner
      sourceName: 'My Events',
      status: 'active',
      title: payload.title,
      description: payload.description,
      imageUrl: payload.image_url,
      category: payload.category,
      date: payload.date,
      time: payload.time,
      venue: payload.venue,
      country: payload.country,
      state: payload.state,
      city: payload.city,
      area: payload.area,
      latitude: payload.latitude,
      longitude: payload.longitude,
      discoveryRadius: 25, // default admin radius
      price: payload.price,
      currency: payload.currency,
      ticketUrl: payload.ticket_url,
      organizerName: payload.organizer.name,
      importedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      impressions: 0,
      views: 0,
      ticketClicks: 0,
    };
    
    setExternalEvents(prev => [newEvent, ...prev]);
    setApiPartners(prev => prev.map(p => 
      p.id === 'partner_my_events' 
        ? { ...p, eventsImported: p.eventsImported + 1, activeEvents: p.activeEvents + 1, apiRequests: p.apiRequests + 1 }
        : p
    ));
  };

  const updateMockEvent = async (id: string, updates: Partial<ExternalEventPayload>) => {
    await new Promise(r => setTimeout(r, 600));
    setExternalEvents(prev => prev.map(evt => {
      if (evt.id === id || evt.externalId === id) {
        return {
          ...evt,
          title: updates.title ?? evt.title,
          description: updates.description ?? evt.description,
          date: updates.date ?? evt.date,
          time: updates.time ?? evt.time,
          venue: updates.venue ?? evt.venue,
          price: updates.price ?? evt.price,
          lastSyncAt: new Date().toISOString(),
        };
      }
      return evt;
    }));
    incrementApiRequest();
  };

  const cancelMockEvent = async (id: string) => {
    await new Promise(r => setTimeout(r, 600));
    setExternalEvents(prev => prev.map(evt => {
      if (evt.id === id || evt.externalId === id) {
        return { ...evt, status: 'cancelled', lastSyncAt: new Date().toISOString() };
      }
      return evt;
    }));
    incrementApiRequest();
  };
  
  const incrementApiRequest = () => {
    setApiPartners(prev => prev.map(p => 
      p.id === 'partner_my_events' ? { ...p, apiRequests: p.apiRequests + 1 } : p
    ));
  };

  const trackImpression = (eventId: string) => {
    setTotalImpressions(p => p + 1);
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, impressions: e.impressions + 1 } : e));
  };

  const trackView = (eventId: string) => {
    setTotalViews(p => p + 1);
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, views: e.views + 1 } : e));
  };

  const trackTicketClick = (eventId: string) => {
    setTotalTicketClicks(p => p + 1);
    setExternalEvents(prev => prev.map(e => e.id === eventId ? { ...e, ticketClicks: e.ticketClicks + 1 } : e));
  };

  return (
    <EventDistributionContext.Provider value={{
      externalEvents,
      apiPartners,
      totalImpressions,
      totalViews,
      totalTicketClicks,
      importMockEvent,
      updateMockEvent,
      cancelMockEvent,
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
