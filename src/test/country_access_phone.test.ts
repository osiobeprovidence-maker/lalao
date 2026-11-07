import assert from 'node:assert/strict';
import { isCountryAvailable } from '../lib/countryAccess';
import { parseLalaoPhoneNumber } from '../lib/phoneNumber';

assert.equal(isCountryAvailable('NG'), true);
assert.equal(isCountryAvailable('KE'), true);
assert.equal(isCountryAvailable('GH'), true);
assert.equal(isCountryAvailable('US'), false, 'previously restricted countries remain restricted');

for (const input of ['0712345678', '+254712345678']) {
  assert.deepEqual(parseLalaoPhoneNumber(input, 'KE'), {
    e164: '+254712345678', countryCode: 'KE', countryCallingCode: '254',
  });
}
for (const input of ['0112345678', '+254112345678']) {
  assert.deepEqual(parseLalaoPhoneNumber(input, 'KE'), {
    e164: '+254112345678', countryCode: 'KE', countryCallingCode: '254',
  });
}
for (const input of ['0241234567', '+233241234567']) {
  assert.deepEqual(parseLalaoPhoneNumber(input, 'GH'), {
    e164: '+233241234567', countryCode: 'GH', countryCallingCode: '233',
  });
}
assert.equal(parseLalaoPhoneNumber('07123', 'KE'), null);
assert.equal(parseLalaoPhoneNumber('07ABC45678', 'KE'), null);
assert.equal(parseLalaoPhoneNumber('', 'GH'), null);
assert.deepEqual(parseLalaoPhoneNumber('+2348012345678'), {
  e164: '+2348012345678', countryCode: 'NG', countryCallingCode: '234',
});

console.log('Country access and E.164 phone normalization tests passed.');
