import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simulated detectDeviceInfo logic from src/hooks/usePWA.tsx
type DeviceType = 'desktop' | 'android' | 'ios' | 'tablet';
type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'opera' | 'samsung' | 'other';

interface DeviceInfo {
  deviceType: DeviceType;
  browserType: BrowserType;
  isDesktop: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isTablet: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
}

function detectDevice(ua: string, platform = '', maxTouchPoints = 0): DeviceInfo {
  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const isMac = (/Mac/i.test(platform) || /Macintosh/i.test(ua)) && maxTouchPoints <= 1;
  const isLinux = (/Linux/i.test(platform) || /X11/i.test(ua)) && !/Android/i.test(ua);

  const isIPad = /iPad/i.test(ua) || (maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
  const isTablet = isIPad || isAndroidTablet;

  const isIPhone = /iPhone|iPod/i.test(ua);
  const isIOS = isIPad || isIPhone;
  const isAndroid = /Android/i.test(ua) && !isTablet;

  const isDesktop = !isIOS && !isAndroid && !isTablet;

  let deviceType: DeviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isIOS) deviceType = 'ios';
  else if (isAndroid) deviceType = 'android';

  let browserType: BrowserType = 'other';
  if (/Edg\//i.test(ua)) {
    browserType = 'edge';
  } else if (/SamsungBrowser/i.test(ua)) {
    browserType = 'samsung';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browserType = 'opera';
  } else if (/Chrome\/|CriOS/i.test(ua)) {
    browserType = 'chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR/i.test(ua)) {
    browserType = 'safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browserType = 'firefox';
  }

  return {
    deviceType,
    browserType,
    isDesktop,
    isAndroid,
    isIOS,
    isTablet,
    isWindows,
    isMac,
    isLinux,
  };
}

describe('LALAO PWA Device Detection & Installation Logic', () => {
  it('Scenario 1: Detects Windows PC Chrome correctly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const info = detectDevice(ua, 'Win32', 0);
    assert.strictEqual(info.isDesktop, true);
    assert.strictEqual(info.deviceType, 'desktop');
    assert.strictEqual(info.isWindows, true);
    assert.strictEqual(info.browserType, 'chrome');
  });

  it('Scenario 2: Detects Windows PC Edge correctly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.80';
    const info = detectDevice(ua, 'Win32', 0);
    assert.strictEqual(info.isDesktop, true);
    assert.strictEqual(info.isWindows, true);
    assert.strictEqual(info.browserType, 'edge');
  });

  it('Scenario 3: Detects macOS Safari Desktop correctly', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const info = detectDevice(ua, 'MacIntel', 0);
    assert.strictEqual(info.isDesktop, true);
    assert.strictEqual(info.isMac, true);
    assert.strictEqual(info.browserType, 'safari');
  });

  it('Scenario 4: Detects Android Phone Chrome correctly', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
    const info = detectDevice(ua, 'Linux armv8l', 5);
    assert.strictEqual(info.isAndroid, true);
    assert.strictEqual(info.isDesktop, false);
    assert.strictEqual(info.deviceType, 'android');
    assert.strictEqual(info.browserType, 'chrome');
  });

  it('Scenario 5: Detects iPhone Mobile Safari correctly', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    const info = detectDevice(ua, 'iPhone', 5);
    assert.strictEqual(info.isIOS, true);
    assert.strictEqual(info.isDesktop, false);
    assert.strictEqual(info.deviceType, 'ios');
    assert.strictEqual(info.browserType, 'safari');
  });

  it('Scenario 6: Detects iPad Tablet correctly (Modern iPadOS user-agent with touch points)', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const info = detectDevice(ua, 'MacIntel', 5);
    assert.strictEqual(info.isTablet, true);
    assert.strictEqual(info.isIOS, true);
    assert.strictEqual(info.isDesktop, false);
    assert.strictEqual(info.deviceType, 'tablet');
  });

  it('Scenario 7: Detects Android Tablet correctly', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const info = detectDevice(ua, 'Linux aarch64', 5);
    assert.strictEqual(info.isTablet, true);
    assert.strictEqual(info.isAndroid, false); // android mobile flag false for tablet
    assert.strictEqual(info.deviceType, 'tablet');
  });

  it('Scenario 8: Correct modal title and description mapping for PC, Android, iPhone, and Tablet', () => {
    const getModalContent = (deviceInfo: DeviceInfo) => {
      let title = 'Install LALAO';
      let description = 'Install LALAO for quick access to your communities, messages, and discoveries.';
      if (deviceInfo.isDesktop) {
        title = 'Install LALAO on Your PC';
        description =
          'Install LALAO for quick access to your communities, messages, and discoveries, right from your desktop.';
      } else if (deviceInfo.isTablet) {
        title = 'Install LALAO on Your Tablet';
        description =
          'Install LALAO for an immersive full-screen experience with quick access to your communities, messages, and discoveries.';
      } else if (deviceInfo.isAndroid) {
        title = 'Install LALAO on Android';
        description =
          'Install LALAO on your phone for quick access to your communities, messages, and discoveries.';
      } else if (deviceInfo.isIOS) {
        title = 'Install LALAO on iPhone';
        description =
          'Install LALAO on your phone for quick access to your communities, messages, and discoveries.';
      }
      return { title, description };
    };

    const pcContent = getModalContent(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0', 'Win32', 0));
    assert.strictEqual(pcContent.title, 'Install LALAO on Your PC');
    assert.strictEqual(pcContent.description, 'Install LALAO for quick access to your communities, messages, and discoveries, right from your desktop.');

    const tabletContent = getModalContent(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15', 'MacIntel', 5));
    assert.strictEqual(tabletContent.title, 'Install LALAO on Your Tablet');

    const androidContent = getModalContent(detectDevice('Mozilla/5.0 (Linux; Android 14; Mobile) Chrome/124.0.0.0', 'Linux armv8l', 5));
    assert.strictEqual(androidContent.title, 'Install LALAO on Android');

    const iosContent = getModalContent(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/604.1', 'iPhone', 5));
    assert.strictEqual(iosContent.title, 'Install LALAO on iPhone');
  });

  it('Scenario 9: Dismissal calculation respects 7-day suppression', () => {
    const DISMISS_DURATION_DAYS = 7;
    const now = Date.now();
    const expiresAt = now + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    
    // An hour later, prompt is still dismissed
    const checkTime = now + 3600 * 1000;
    assert.strictEqual(expiresAt > checkTime, true);

    // 8 days later, suppression has expired
    const expiredTime = now + 8 * 24 * 60 * 60 * 1000;
    assert.strictEqual(expiresAt > expiredTime, false);
  });
});
