export type ExternalEventStatus = 'imported' | 'active' | 'updated' | 'cancelled' | 'expired' | 'deleted';

export interface ExternalEvent {
  id: string; // Lalao internal ID
  externalId: string; // ID from My Events
  sourceId: string; // "my_events", "partner_b", etc.
  sourceName: string; // "My Events"
  status: ExternalEventStatus;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  
  // Schedule
  date: string;
  time: string;
  
  // Location Data for Discovery
  venue: string;
  country: string;
  state: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  discoveryRadius: number; // in km
  
  // Ticketing
  price: number;
  currency: string;
  ticketUrl: string;
  
  // Organizer
  organizerName: string;
  organizerAvatar?: string;

  // Metadata for analytics
  importedAt: string;
  lastSyncAt: string;
  impressions: number;
  views: number;
  ticketClicks: number;
}

export interface ApiPartner {
  id: string;
  name: string;
  status: 'connected' | 'sandbox' | 'disconnected';
  apiKey: string;
  eventsImported: number;
  activeEvents: number;
  apiRequests: number;
  lastSync: string;
  plan: 'Growth' | 'Enterprise' | 'Free';
  monthlyFee: number;
  maxEvents: number;
  maxApiRequests: number;
}

// Used for API request simulation
export interface ExternalEventPayload {
  external_id: string;
  source: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  country: string;
  state: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
  ticket_url: string;
  organizer: {
    name: string;
  };
}
