export const AVAILABLE_COUNTRY_CODES = ['NG', 'KE', 'GH'] as const;

export function isCountryAvailable(countryCode: string): boolean {
  return (AVAILABLE_COUNTRY_CODES as readonly string[]).includes(countryCode.toUpperCase());
}
