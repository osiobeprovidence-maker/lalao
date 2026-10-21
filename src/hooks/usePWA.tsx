import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type DeviceType = 'desktop' | 'android' | 'ios' | 'tablet';
export type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'opera' | 'samsung' | 'other';

export interface DeviceInfo {
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

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  deviceInfo: DeviceInfo;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  triggerInstall: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

const DISMISS_KEY = 'lalao_pwa_install_dismissed_until';
const DISMISS_DURATION_DAYS = 7; // Suppress auto-popup for 7 days when dismissed

export const detectDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined' || !window.navigator) {
    return {
      deviceType: 'desktop',
      browserType: 'other',
      isDesktop: true,
      isAndroid: false,
      isIOS: false,
      isTablet: false,
      isWindows: false,
      isMac: false,
      isLinux: false,
    };
  }

  const ua = window.navigator.userAgent || '';
  const platform = (window.navigator as any).userAgentData?.platform || window.navigator.platform || '';
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  // OS detection
  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const isMac = (/Mac/i.test(platform) || /Macintosh/i.test(ua)) && maxTouchPoints <= 1;
  const isLinux = (/Linux/i.test(platform) || /X11/i.test(ua)) && !/Android/i.test(ua);

  // Tablet & Mobile detection
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

  // Browser detection
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
};

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDeviceInfo());
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    const updateStandaloneState = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    updateStandaloneState();
    setDeviceInfo(detectDeviceInfo());

    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent browser default mini-infobar on mobile Chrome
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      // Auto-display rule for first-time or expired dismissal visitors on /app
      try {
        const dismissedUntil = localStorage.getItem(DISMISS_KEY);
        const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();
        const isAppPath = window.location.pathname.startsWith('/app');

        const standalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

        if (!standalone && !isDismissed && isAppPath) {
          // Delay briefly to allow initial page hydrate and render cleanly
          const timer = setTimeout(() => {
            setIsInstallModalOpen(true);
          }, 2500);
          return () => clearTimeout(timer);
        }
      } catch {
        // LocalStorage disabled / private mode safe
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('resize', updateStandaloneState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', updateStandaloneState);
    };
  }, []);

  const openInstallModal = useCallback(() => {
    setIsInstallModalOpen(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setIsInstallModalOpen(false);
  }, []);

  const dismissInstallPrompt = useCallback(() => {
    setIsInstallModalOpen(false);
    try {
      const expiresAt = Date.now() + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, expiresAt.toString());
    } catch {
      // ignore
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
        setIsInstallModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Error during native prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: !!deferredPrompt,
        isInstalled: isInstalled || isStandalone,
        isStandalone,
        isIOS: deviceInfo.isIOS,
        deviceInfo,
        isInstallModalOpen,
        setIsInstallModalOpen,
        openInstallModal,
        closeInstallModal,
        triggerInstall,
        dismissInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
