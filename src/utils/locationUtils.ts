// Geolocation, distance computation and privacy utilities for Lalao

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HubLocation {
  id: string;
  name: string;
  subArea: string;
  coords: Coordinates;
  popular?: boolean;
}

// Verified coordinate hubs across Delta State & Nigerian metro districts
export const KNOWN_LOCATION_HUBS: Record<string, HubLocation> = {
  udu: {
    id: 'udu',
    name: 'Udu',
    subArea: 'Delta State',
    coords: { lat: 5.5039, lng: 5.8276 },
    popular: true,
  },
  'udu-express': {
    id: 'udu-express',
    name: 'Udu Express Junction',
    subArea: 'Delta State',
    coords: { lat: 5.5085, lng: 5.8312 },
  },
  'udu-stadium': {
    id: 'udu-stadium',
    name: 'Udu Township Stadium',
    subArea: 'Delta State',
    coords: { lat: 5.5122, lng: 5.821 },
  },
  'udu-bridge': {
    id: 'udu-bridge',
    name: 'Udu Bridge Shoreline',
    subArea: 'Delta State',
    coords: { lat: 5.5204, lng: 5.8145 },
  },
  'warri-central': {
    id: 'warri-central',
    name: 'Warri Central',
    subArea: 'Delta State',
    coords: { lat: 5.5175, lng: 5.7501 },
    popular: true,
  },
  effurun: {
    id: 'effurun',
    name: 'Effurun',
    subArea: 'Delta State',
    coords: { lat: 5.5567, lng: 5.7828 },
    popular: true,
  },
  dsc: {
    id: 'dsc',
    name: 'DSC Township',
    subArea: 'Delta State',
    coords: { lat: 5.4851, lng: 5.8643 },
    popular: true,
  },
  'lekki-phase-1': {
    id: 'lekki-phase-1',
    name: 'Lekki Phase 1',
    subArea: 'Lagos State',
    coords: { lat: 6.4474, lng: 3.4735 },
    popular: true,
  },
  'ikeja-gra': {
    id: 'ikeja-gra',
    name: 'Ikeja GRA',
    subArea: 'Lagos State',
    coords: { lat: 6.5927, lng: 3.3551 },
    popular: true,
  },
  'victoria-island': {
    id: 'victoria-island',
    name: 'Victoria Island',
    subArea: 'Lagos State',
    coords: { lat: 6.4281, lng: 3.4219 },
    popular: true,
  },
  'wuse-ii': {
    id: 'wuse-ii',
    name: 'Wuse II',
    subArea: 'Abuja FCT',
    coords: { lat: 9.0765, lng: 7.4721 },
    popular: true,
  },
  'trans-amadi': {
    id: 'trans-amadi',
    name: 'Trans-Amadi',
    subArea: 'Port Harcourt',
    coords: { lat: 4.8156, lng: 7.0498 },
    popular: true,
  },
};

/**
 * Calculates distance in meters between two geographical coordinates
 * using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Given a location name, attempts to find registered coordinates,
 * or provides a fuzzy match to known hubs.
 */
export function getCoordinatesForLocation(locationName: string): Coordinates {
  const clean = locationName.toLowerCase().trim();
  for (const [key, hub] of Object.entries(KNOWN_LOCATION_HUBS)) {
    if (
      clean.includes(key) ||
      clean.includes(hub.name.toLowerCase()) ||
      hub.name.toLowerCase().includes(clean)
    ) {
      return hub.coords;
    }
  }

  // Generate deterministic offset if unknown name, so it's consistent
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = (hash << 5) - hash + locationName.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 50) - 25) / 1000;
  const lngOffset = ((Math.abs(hash * 3) % 50) - 25) / 1000;

  // Default to Udu epicenter with small hash-based displacement
  return {
    lat: 5.5039 + latOffset,
    lng: 5.8276 + lngOffset,
  };
}

/**
 * Format distance in a human-friendly way, with privacy protection options.
 * If privacy is enabled, distance is rounded to approximate bands
 * to prevent pinpoint triangulation.
 */
export function formatDistance(
  meters: number,
  approximate: boolean = false
): string {
  if (approximate) {
    if (meters < 250) return 'Nearby (< 250m)';
    if (meters < 500) return 'Within 500m';
    if (meters < 1000) return '~800m away';
    const kmRounded = Math.round(meters / 500) * 0.5;
    return `~${kmRounded.toFixed(1)} km away`;
  }

  if (meters < 50) return '< 50m';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Returns proximity category for UI tags & styling
 */
export function getProximityCategory(meters: number): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  if (meters <= 1000) {
    return {
      label: 'Walking distance',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      dotColor: 'bg-emerald-500',
    };
  }
  if (meters <= 5000) {
    return {
      label: 'Neighborhood',
      badgeClass: 'bg-indigo-50 text-[#5E43F3] border-indigo-100',
      dotColor: 'bg-[#5E43F3]',
    };
  }
  if (meters <= 15000) {
    return {
      label: 'District',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    label: 'Greater Metro',
    badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dotColor: 'bg-neutral-400',
  };
}
