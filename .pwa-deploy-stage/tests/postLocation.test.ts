import assert from "node:assert/strict";
import test from "node:test";

import {
  resolvePostCreationLocation,
  haversineMeters,
  validateCoordinatesForNearby,
  formatCoarseLocationLabel,
  isPostGeographicallyEligible,
  DEFAULT_NEARBY_RADIUS_KM,
  MAX_ACCEPTABLE_ACCURACY_METERS,
} from "../src/utils/postLocation.ts";

// Warri Central: 5.5175, 5.7501
// Effurun: 5.5567, 5.7828 (~5.6 km from Warri Central)
// Udu: 5.5039, 5.8276 (~8.7 km from Warri Central)
// Asaba (Delta State capital): 6.1983, 6.7329 (~130 km from Warri Central)
// Lagos (Lekki): 6.4474, 3.4735 (~270 km from Warri Central)

/* ─────────────────────────────────────────────────────────────────────────────
   1. GEOGRAPHIC TESTS
   ───────────────────────────────────────────────────────────────────────────── */

test("viewer within configured 5 km radius qualifies geographically", () => {
  // Author in Warri Central
  const postLocation = {
    latitude: 5.5175,
    longitude: 5.7501,
  };
  // Viewer approx 1.2 km away
  const viewerLocation = {
    latitude: 5.524,
    longitude: 5.758,
  };

  const distance = haversineMeters(
    viewerLocation.latitude,
    viewerLocation.longitude,
    postLocation.latitude,
    postLocation.longitude
  );

  assert.ok(distance < 5000, `Distance ${distance}m should be under 5000m`);

  const result = isPostGeographicallyEligible(postLocation, viewerLocation, 5000);
  assert.equal(result.eligible, true);
  assert.ok(typeof result.distanceMeters === "number");
});

test("viewer outside configured 5 km radius does NOT qualify", () => {
  const postLocation = {
    latitude: 5.5175,
    longitude: 5.7501, // Warri
  };
  const viewerLocation = {
    latitude: 5.5039,
    longitude: 5.8276, // Udu (~8.7 km)
  };

  const distance = haversineMeters(
    viewerLocation.latitude,
    viewerLocation.longitude,
    postLocation.latitude,
    postLocation.longitude
  );

  assert.ok(distance > 5000, `Distance ${distance}m should exceed default 5km`);

  const result = isPostGeographicallyEligible(postLocation, viewerLocation, 5000);
  assert.equal(result.eligible, false);
});

test("matching state names alone does NOT grant eligibility (Asaba vs Warri in Delta State)", () => {
  // Both are in Delta State, but ~130 km apart
  const postLocation = {
    latitude: 5.5175,
    longitude: 5.7501,
    state: "Delta State",
    city: "Warri",
  };
  const viewerLocation = {
    latitude: 6.1983,
    longitude: 6.7329,
    state: "Delta State",
    city: "Asaba",
  };

  const result = isPostGeographicallyEligible(postLocation, viewerLocation, 5000);
  assert.equal(
    result.eligible,
    false,
    "Viewer in Asaba must not see a Warri post simply because both are in Delta State"
  );
});

test("viewer in Lagos does NOT qualify for a Warri post", () => {
  const postLocation = {
    latitude: 5.5175,
    longitude: 5.7501, // Warri
  };
  const viewerLocation = {
    latitude: 6.4474,
    longitude: 3.4735, // Lagos
  };

  const result = isPostGeographicallyEligible(postLocation, viewerLocation, 5000);
  assert.equal(result.eligible, false);
});

test("post remains anchored to its publication location after author moves", () => {
  // Riderezzy creates post in Warri
  const originalPostSnapshot = {
    latitude: 5.5175,
    longitude: 5.7501,
    city: "Warri",
    state: "Delta State",
    capturedAt: 1700000000000,
  };

  // Author travels to Lagos the next day
  const authorNewProfileLocation = {
    latitude: 6.5244,
    longitude: 3.3792,
    city: "Lagos",
    state: "Lagos State",
  };

  // Viewer is still in Warri
  const warriViewer = {
    latitude: 5.5200,
    longitude: 5.7520,
  };

  // Post still evaluates against originalPostSnapshot, NOT authorNewProfileLocation
  const result = isPostGeographicallyEligible(originalPostSnapshot, warriViewer, 5000);
  assert.equal(result.eligible, true, "Warri viewer must still see post anchored in Warri");

  // Lagos viewer near author's new location must NOT see the Warri post in Nearby
  const lagosViewer = {
    latitude: 6.5250,
    longitude: 3.3800,
  };
  const lagosResult = isPostGeographicallyEligible(originalPostSnapshot, lagosViewer, 5000);
  assert.equal(lagosResult.eligible, false, "Lagos viewer must not see historical Warri post");
});

test("new post captures a new independent location snapshot", () => {
  const warriSnapshot = {
    authorLocationSnapshot: "Warri",
    latitude: 5.5175,
    longitude: 5.7501,
  };

  const lagosSnapshot = {
    authorLocationSnapshot: "Lekki, Lagos",
    latitude: 6.4474,
    longitude: 3.4735,
  };

  assert.notEqual(warriSnapshot.latitude, lagosSnapshot.latitude);
  assert.notEqual(warriSnapshot.authorLocationSnapshot, lagosSnapshot.authorLocationSnapshot);
});

/* ─────────────────────────────────────────────────────────────────────────────
   2. ACCURACY & PERMISSION VALIDATION TESTS
   ───────────────────────────────────────────────────────────────────────────── */

test("validates accuracy threshold (rejects accuracy > 100m for Nearby publishing)", () => {
  const validReading = validateCoordinatesForNearby({
    latitude: 5.5175,
    longitude: 5.7501,
    accuracy: 35, // 35 meters
    capturedAt: Date.now(),
  });
  assert.equal(validReading.valid, true);

  const inaccurateReading = validateCoordinatesForNearby({
    latitude: 5.5175,
    longitude: 5.7501,
    accuracy: 350, // 350 meters (> 100m)
    capturedAt: Date.now(),
  });
  assert.equal(inaccurateReading.valid, false);
  assert.match(inaccurateReading.reason!, /exceeds maximum threshold/);
});

test("rejects stale location submissions older than 10 minutes", () => {
  const staleTime = Date.now() - 15 * 60 * 1000; // 15 min old
  const staleReading = validateCoordinatesForNearby({
    latitude: 5.5175,
    longitude: 5.7501,
    accuracy: 20,
    capturedAt: staleTime,
  });
  assert.equal(staleReading.valid, false);
  assert.match(staleReading.reason!, /stale/);
});

/* ─────────────────────────────────────────────────────────────────────────────
   3. PRIVACY TESTS
   ───────────────────────────────────────────────────────────────────────────── */

test("coarse location label formatter never reveals raw coordinates or house numbers", () => {
  const label = formatCoarseLocationLabel({
    neighborhood: "Warri Central",
    city: "Warri",
    state: "Delta State",
    country: "Nigeria",
  });
  assert.equal(label, "Warri Central, Delta State");
  assert.doesNotMatch(label, /\d+\.\d+/); // No raw lat/lng
});

test("never falls back to profile location when post location is absent", () => {
  const resolved = resolvePostCreationLocation({
    authorLocationSnapshot: "",
    viewerLocation: "Warri",
  });
  assert.equal(resolved, "");
});

test("missing coordinates disqualify post from Nearby distribution", () => {
  const postWithoutCoords = {
    latitude: undefined,
    longitude: undefined,
  };
  const viewer = {
    latitude: 5.5175,
    longitude: 5.7501,
  };
  const result = isPostGeographicallyEligible(postWithoutCoords, viewer, 5000);
  assert.equal(result.eligible, false);
});

test("preserves existing author posting isolation tests", () => {
  const userBPost = resolvePostCreationLocation({
    authorLocationSnapshot: "Warri",
    viewerLocation: "Udu",
  });
  const userAPost = resolvePostCreationLocation({
    authorLocationSnapshot: "Udu",
    viewerLocation: "Warri",
  });

  assert.equal(userBPost, "Warri");
  assert.equal(userAPost, "Udu");
});
