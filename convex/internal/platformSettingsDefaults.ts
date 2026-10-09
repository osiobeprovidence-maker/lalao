export type BrandingSettings = {
  platformName: string;
  shortName: string;
  wordmarkUrl: string;
  appIconUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  browserTitle: string;
  browserDescription: string;
  pwaName: string;
  pwaShortName: string;
  authLogoUrl: string;
  authWordmark: string;
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  platformName: "Lalao",
  shortName: "Lalao",
  wordmarkUrl: "",
  appIconUrl: "",
  faviconUrl: "",
  primaryColor: "#1877F2",
  accentColor: "#5E43F3",
  backgroundColor: "#F8F9FA",
  browserTitle: "Lalao | Community Platform",
  browserDescription: "Join the community on Lalao",
  pwaName: "Lalao App",
  pwaShortName: "Lalao",
  authLogoUrl: "",
  authWordmark: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeBrandingSettings(value: unknown): BrandingSettings {
  let parsed: unknown = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = undefined;
    }
  }

  const overrides = isRecord(parsed) ? parsed : {};
  return {
    platformName: typeof overrides.platformName === "string" ? overrides.platformName : DEFAULT_BRANDING_SETTINGS.platformName,
    shortName: typeof overrides.shortName === "string" ? overrides.shortName : DEFAULT_BRANDING_SETTINGS.shortName,
    wordmarkUrl: typeof overrides.wordmarkUrl === "string" ? overrides.wordmarkUrl : DEFAULT_BRANDING_SETTINGS.wordmarkUrl,
    appIconUrl: typeof overrides.appIconUrl === "string" ? overrides.appIconUrl : DEFAULT_BRANDING_SETTINGS.appIconUrl,
    faviconUrl: typeof overrides.faviconUrl === "string" ? overrides.faviconUrl : DEFAULT_BRANDING_SETTINGS.faviconUrl,
    primaryColor: typeof overrides.primaryColor === "string" ? overrides.primaryColor : DEFAULT_BRANDING_SETTINGS.primaryColor,
    accentColor: typeof overrides.accentColor === "string" ? overrides.accentColor : DEFAULT_BRANDING_SETTINGS.accentColor,
    backgroundColor: typeof overrides.backgroundColor === "string" ? overrides.backgroundColor : DEFAULT_BRANDING_SETTINGS.backgroundColor,
    browserTitle: typeof overrides.browserTitle === "string" ? overrides.browserTitle : DEFAULT_BRANDING_SETTINGS.browserTitle,
    browserDescription: typeof overrides.browserDescription === "string" ? overrides.browserDescription : DEFAULT_BRANDING_SETTINGS.browserDescription,
    pwaName: typeof overrides.pwaName === "string" ? overrides.pwaName : DEFAULT_BRANDING_SETTINGS.pwaName,
    pwaShortName: typeof overrides.pwaShortName === "string" ? overrides.pwaShortName : DEFAULT_BRANDING_SETTINGS.pwaShortName,
    authLogoUrl: typeof overrides.authLogoUrl === "string" ? overrides.authLogoUrl : DEFAULT_BRANDING_SETTINGS.authLogoUrl,
    authWordmark: typeof overrides.authWordmark === "string" ? overrides.authWordmark : DEFAULT_BRANDING_SETTINGS.authWordmark,
  };
}
