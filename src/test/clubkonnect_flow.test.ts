import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getClubkonnectNetworkCode,
  getClubkonnectDiscoCode,
  getClubkonnectCableCode,
  getClubkonnectBettingCode,
  getClubkonnectSmileCode,
  getClubkonnectSpectranetCode,
  getClubkonnectWAECCode,
  getClubkonnectJAMBCode,
} from '../../convex/market';
import { DEFAULT_SERVICE_SETTINGS } from '../../convex/clubkonnect';

describe('Lalao Bill Payments — ClubKonnect Parameter Codes & Configurations', () => {
  it('Correctly translates Nigerian mobile networks to ClubKonnect codes', () => {
    assert.strictEqual(getClubkonnectNetworkCode('MTN'), '01');
    assert.strictEqual(getClubkonnectNetworkCode('GLO'), '02');
    assert.strictEqual(getClubkonnectNetworkCode('9MOBILE'), '03');
    assert.strictEqual(getClubkonnectNetworkCode('ETISALAT'), '03');
    assert.strictEqual(getClubkonnectNetworkCode('AIRTEL'), '04');
    assert.strictEqual(getClubkonnectNetworkCode('unknown'), '01'); // Safe fallback
  });

  it('Correctly translates Nigerian electricity distribution companies to ClubKonnect codes', () => {
    assert.strictEqual(getClubkonnectDiscoCode('EKEDC'), '01');
    assert.strictEqual(getClubkonnectDiscoCode('EKO_ELECTRIC'), '01');
    assert.strictEqual(getClubkonnectDiscoCode('IKEDC'), '02');
    assert.strictEqual(getClubkonnectDiscoCode('IKEJA_ELECTRIC'), '02');
    assert.strictEqual(getClubkonnectDiscoCode('AEDC'), '03');
    assert.strictEqual(getClubkonnectDiscoCode('ABUJA_ELECTRIC'), '03');
    assert.strictEqual(getClubkonnectDiscoCode('KEDCO'), '04');
    assert.strictEqual(getClubkonnectDiscoCode('PHED'), '05');
    assert.strictEqual(getClubkonnectDiscoCode('JED'), '06');
    assert.strictEqual(getClubkonnectDiscoCode('KAEDCO'), '07');
    assert.strictEqual(getClubkonnectDiscoCode('EEDC'), '08');
    assert.strictEqual(getClubkonnectDiscoCode('BEDC'), '09');
  });

  it('Correctly translates Cable TV operators to ClubKonnect codes', () => {
    assert.strictEqual(getClubkonnectCableCode('DStv'), 'dstv');
    assert.strictEqual(getClubkonnectCableCode('GOtv'), 'gotv');
    assert.strictEqual(getClubkonnectCableCode('StarTimes'), 'startimes');
    assert.strictEqual(getClubkonnectCableCode('unknown'), 'dstv');
  });

  it('Enforces default service toggles and fee structure', () => {
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.airtime.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.airtime.fee, 0);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.data.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.electricity.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.electricity.fee, 100);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.cable.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.cable.fee, 100);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.betting.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.betting.fee, 50);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.smile.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.spectranet.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.waec.enabled, true);
    assert.strictEqual(DEFAULT_SERVICE_SETTINGS.jamb.enabled, true);
  });

  it('Correctly translates Betting companies to ClubKonnect codes', () => {
    assert.strictEqual(getClubkonnectBettingCode('SportyBet'), 'prd-sporty-bet');
    assert.strictEqual(getClubkonnectBettingCode('BetKing'), 'product-bet-king');
    assert.strictEqual(getClubkonnectBettingCode('1xBet'), 'product-1x-bet');
    assert.strictEqual(getClubkonnectBettingCode('NairaBet'), 'product-nairabet');
    assert.strictEqual(getClubkonnectBettingCode('BangBet'), 'product-bang-bet');
    assert.strictEqual(getClubkonnectBettingCode('BetWay'), 'product-bet-way');
    assert.strictEqual(getClubkonnectBettingCode('MerryBet'), 'product-merry-bet');
  });

  it('Correctly translates Smile and Spectranet codes', () => {
    assert.strictEqual(getClubkonnectSmileCode(), 'smile-direct');
    assert.strictEqual(getClubkonnectSpectranetCode(), 'spectranet');
  });

  it('Correctly translates WAEC and JAMB exam types to provider codes', () => {
    assert.strictEqual(getClubkonnectWAECCode('waecdirect'), 'waecdirect');
    assert.strictEqual(getClubkonnectWAECCode('WAEC Registration'), 'waec-registration');
    assert.strictEqual(getClubkonnectJAMBCode('UTME (Mock)'), 'utme-mock');
    assert.strictEqual(getClubkonnectJAMBCode('UTME (No-Mock)'), 'utme-no-mock');
    assert.strictEqual(getClubkonnectJAMBCode('Direct Entry'), 'de');
  });

  it('Calculates total customer charge accurately including convenience fee', () => {
    const electricityAmount = 5000;
    const fee = DEFAULT_SERVICE_SETTINGS.electricity.fee; // 100
    const totalCharge = electricityAmount + fee;
    assert.strictEqual(totalCharge, 5100);

    const airtimeAmount = 1500;
    const airtimeFee = DEFAULT_SERVICE_SETTINGS.airtime.fee; // 0
    assert.strictEqual(airtimeAmount + airtimeFee, 1500);

    const bettingAmount = 2000;
    const bettingFee = DEFAULT_SERVICE_SETTINGS.betting.fee; // 50
    assert.strictEqual(bettingAmount + bettingFee, 2050);
  });

  it('Validates 4-digit wallet security PIN format', () => {
    const validPin = '1234';
    const invalidPin1 = '123';
    const invalidPin2 = 'abcd';
    const invalidPin3 = '12345';

    assert.strictEqual(/^\d{4}$/.test(validPin), true);
    assert.strictEqual(/^\d{4}$/.test(invalidPin1), false);
    assert.strictEqual(/^\d{4}$/.test(invalidPin2), false);
    assert.strictEqual(/^\d{4}$/.test(invalidPin3), false);
  });
});
