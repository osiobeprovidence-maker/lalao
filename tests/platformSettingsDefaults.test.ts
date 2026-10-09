import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_BRANDING_SETTINGS, normalizeBrandingSettings } from "../convex/internal/platformSettingsDefaults.ts";

test("returns full LaLao defaults when no branding record exists", () => {
  assert.deepEqual(normalizeBrandingSettings(undefined), DEFAULT_BRANDING_SETTINGS);
});

test("returns full LaLao defaults for malformed stored branding JSON", () => {
  assert.deepEqual(normalizeBrandingSettings("not-json"), DEFAULT_BRANDING_SETTINGS);
});

test("preserves valid branding values and fills missing fields", () => {
  const settings = normalizeBrandingSettings(
    JSON.stringify({
      platformName: "Lalao Community",
      primaryColor: "#123456",
      pwaShortName: "Lalao",
    })
  );

  assert.equal(settings.platformName, "Lalao Community");
  assert.equal(settings.primaryColor, "#123456");
  assert.equal(settings.pwaShortName, "Lalao");
  assert.equal(settings.shortName, "Lalao");
  assert.equal(settings.browserTitle, "Lalao | Community Platform");
});


