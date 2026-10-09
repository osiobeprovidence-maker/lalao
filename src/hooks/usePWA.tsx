import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
  triggerInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

const isIOSBrowser = () =>
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
  !(window.navigator as Navigator & { MSStream?: unknown }).MSStream;

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    const updateStandaloneState = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    updateStandaloneState();
    setIsIOS(isIOSBrowser());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
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

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: !!deferredPrompt,
        isInstalled,
        isStandalone,
        isIOS,
        isInstallModalOpen,
        setIsInstallModalOpen,
        triggerInstall,
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
