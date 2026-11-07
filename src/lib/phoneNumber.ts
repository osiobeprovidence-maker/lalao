import parsePhoneNumberFromString, { type CountryCode } from 'libphonenumber-js';

export type ParsedLalaoPhone = {
  e164: string;
  countryCode: string;
  countryCallingCode: string;
};

export function parseLalaoPhoneNumber(input: string, defaultCountry: CountryCode = 'NG'): ParsedLalaoPhone | null {
  const value = input.trim();
  if (!value) return null;
  const phone = parsePhoneNumberFromString(value, defaultCountry)
    ?? (value.startsWith('+') ? undefined : parsePhoneNumberFromString(`+${value.replace(/\D/g, '')}`));
  if (!phone?.isValid() || !phone.country) return null;
  return {
    e164: phone.number,
    countryCode: phone.country,
    countryCallingCode: phone.countryCallingCode,
  };
}
