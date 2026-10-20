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

const MOCK_PARTNER: ApiPartner = {
  id: 'partner_my_events',
  name: 'My Events',
  status: 'connected',
  apiKey: 'lalao_live_mock123456789',
  eventsImported: 250,
  activeEvents: 87,
  apiRequests: 18420,
  lastSync: new Date().toISOString(),
  plan: 'Growth',
  monthlyFee: 150000,
  maxEvents: 5000,
  maxApiRequests: 100000,
};

const INITIAL_MOCK_EVENTS: ExternalEvent[] = [
  {
    id: 'evt_myevents_101',
    externalId: 'ME-10293',
    sourceId: 'partner_my_events',
    sourceName: 'My Events',
    status: 'active',
    title: 'Afrobeats Night',
    description: 'A live Afrobeats experience featuring top artists and DJs.',
    imageUrl: 'https://images.unsplash.com/photo-1540039155732-68473668c227?q=80&w=2070&auto=format&fit=crop',
    category: 'Music',
    date: '2026-10-10',
    time: '20:00',
    venue: 'Surulere Stadium',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Surulere',
    latitude: 6.4969,
    longitude: 3.3476,
    discoveryRadius: 20,
    price: 10000,
    currency: 'NGN',
    ticketUrl: 'https://myevents.mock/afrobeats-night',
    organizerName: 'Example Events',
    importedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    impressions: 4520,
    views: 890,
    ticketClicks: 150,
  },
  {
    id: 'evt_myevents_102',
    externalId: 'ME-10294',
    sourceId: 'partner_my_events',
    sourceName: 'My Events',
    status: 'active',
    title: 'Lagos Tech Meetup',
    description: 'Meet fellow tech enthusiasts.',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop',
    category: 'Technology',
    date: '2026-09-28',
    time: '18:00',
    venue: 'Tech Hub VI',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Victoria Island',
    latitude: 6.4225,
    longitude: 3.4215,
    discoveryRadius: 20,
    price: 0,
    currency: 'NGN',
    ticketUrl: 'https://myevents.mock/tech-meetup',
    organizerName: 'Tech Lagos',
    importedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    impressions: 3200,
    views: 540,
    ticketClicks: 90,
  },
  {
    id: 'evt_myevents_103',
    externalId: 'ME-10295',
    sourceId: 'partner_my_events',
    sourceName: 'My Events',
    status: 'active',
    title: 'Creative Networking Night',
    description: 'Connect with creatives across Lagos.',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop',
    category: 'Business',
    date: '2026-10-02',
    time: '19:30',
    venue: 'Lekki Co-working Space',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Lekki',
    latitude: 6.4538,
    longitude: 3.6190,
    discoveryRadius: 20,
    price: 2000,
    currency: 'NGN',
    ticketUrl: 'https://myevents.mock/creative-networking',
    organizerName: 'Lagos Creatives',
    importedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    impressions: 2100,
    views: 310,
    ticketClicks: 40,
  }
];

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
