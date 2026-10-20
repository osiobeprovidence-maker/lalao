/**
 * Location snapshot models, validation, distance calculation,
 * and eligibility logic for LaLao.
 * 
 * Rules:
 * - Default discovery radius: 5 km (configurable).
 * - Maximum acceptable location accuracy: 100 meters (configurable).
 * - Location snapshot captured at post publication remains fixed for that post.
 * - Profile location is NEVER substituted for a post snapshot or viewer location.
 * - Raw coordinates must never be leaked to public payloads.
 */

export const DEFAULT_NEARBY_RADIUS_KM = 5;
export const MAX_ACCEPTABLE_ACCURACY_METERS = 100;
export const MAX_LOCATION_AGE_MS = 10 * 60 * 1000; // 10 minutes max age for publication location

export interface PostLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: number;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  formattedAddress?: string;
  isValid: boolean;
}

export interface ViewerLocationContext {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: number;
}

export interface PostCreationLocationContext {
  authorLocationSnapshot?: string;
  viewerLocation?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  capturedAt?: number;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  audience?: string;
}

/**
 * Calculates geographical distance in meters between two coordinates (Haversine formula).
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Validates whether GPS coordinates meet accuracy and recency standards for Nearby publishing.
 */
export function validateCoordinatesForNearby(coords: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  capturedAt?: number;
  maxAccuracyMeters?: number;
  maxAgeMs?: number;
}): { valid: boolean; reason?: string } {
  const { latitude, longitude, accuracy, capturedAt } = coords;
  const maxAccuracy = coords.maxAccuracyMeters ?? MAX_ACCEPTABLE_ACCURACY_METERS;
  const maxAge = coords.maxAgeMs ?? MAX_LOCATION_AGE_MS;

  if (typeof latitude !== "number" || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, reason: "Invalid latitude" };
  }
  if (typeof longitude !== "number" || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, reason: "Invalid longitude" };
  }
  if (accuracy !== undefined && (isNaN(accuracy) || accuracy > maxAccuracy)) {
    return {
      valid: false,
      reason: `Location accuracy (${Math.round(accuracy)}m) exceeds maximum threshold (${maxAccuracy}m)`,
    };
  }
  if (capturedAt !== undefined) {
    const age = Date.now() - capturedAt;
    if (age > maxAge) {
      return { valid: false, reason: "Location reading is stale (>10 min)" };
    }
  }

  return { valid: true };
}

/**
 * Generates a privacy-safe coarse location label without exposing precise coordinates or exact addresses.
 * E.g.: "Warri, Delta State" or "Lekki, Lagos State".
 */
export function formatCoarseLocationLabel(location: {
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  fallbackLabel?: string;
}): string {
  const parts: string[] = [];
  if (location.neighborhood) {
    parts.push(location.neighborhood);
  } else if (location.city) {
    parts.push(location.city);
  }

  if (location.state && (!location.city || location.state !== location.city)) {
    parts.push(location.state);
  } else if (!parts.length && location.country) {
    parts.push(location.country);
  }

  if (parts.length > 0) {
    return parts.join(", ");
  }
  return location.fallbackLabel?.trim() || "";
}

/**
 * Checks if a post is geographically eligible for a viewer.
 * Core rule: Evaluates true Haversine distance between viewer coordinates and post publication snapshot coordinates.
 * State or city name matching alone NEVER grants eligibility.
 */
export function isPostGeographicallyEligible(
  postLocation: {
    latitude?: number;
    longitude?: number;
    nearbyEnabled?: boolean;
    audience?: string;
    state?: string;
    city?: string;
  },
  viewerLocation: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    state?: string;
    city?: string;
  },
  radiusMeters: number = DEFAULT_NEARBY_RADIUS_KM * 1000
): { eligible: boolean; distanceMeters?: number; reason?: string } {
  // If post is explicitly not for nearby or has no coordinates, reject
  if (typeof postLocation.latitude !== "number" || typeof postLocation.longitude !== "number") {
    return { eligible: false, reason: "Post lacks valid coordinates" };
  }

  if (typeof viewerLocation.latitude !== "number" || typeof viewerLocation.longitude !== "number") {
    return { eligible: false, reason: "Viewer lacks valid coordinates" };
  }

  // Reject if viewer location accuracy is wildly unacceptable (e.g. > 500m)
  if (typeof viewerLocation.accuracy === "number" && viewerLocation.accuracy > 500) {
    return { eligible: false, reason: "Viewer location accuracy too low" };
  }

  const distance = haversineMeters(
    viewerLocation.latitude,
    viewerLocation.longitude,
    postLocation.latitude,
    postLocation.longitude
  );

  if (distance <= radiusMeters) {
    return { eligible: true, distanceMeters: distance };
  }

  return { eligible: false, distanceMeters: distance, reason: `Distance (${distance}m) exceeds radius (${radiusMeters}m)` };
}

/**
 * Resolves post creation location snapshot.
 * Preserves author's publication snapshot and never substitutes viewer location or profile location.
 */
export function resolvePostCreationLocation({
  authorLocationSnapshot,
}: PostCreationLocationContext): string {
  return authorLocationSnapshot?.trim() || "";
}
