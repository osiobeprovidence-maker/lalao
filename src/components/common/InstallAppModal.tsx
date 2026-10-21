import React from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Tablet,
  Share,
  Download,
  CheckCircle2,
  ExternalLink,
  Laptop,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { AppIcon } from './AppIcon';

export const InstallAppModal: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    deviceInfo,
    isInstallModalOpen,
    closeInstallModal,
    dismissInstallPrompt,
    triggerInstall,
  } = usePWA();

  if (!isInstallModalOpen) return null;

  const { deviceType, browserType, isDesktop, isAndroid, isIOS, isTablet, isWindows, isMac } = deviceInfo;

  // Primary headings & descriptions per device
  let title = 'Install LALAO';
  let description = 'Install LALAO for quick access to your communities, messages, and discoveries.';
  let DeviceIcon = Smartphone;

  if (isDesktop) {
    title = 'Install LALAO on Your PC';
    description =
      'Install LALAO for quick access to your communities, messages, and discoveries, right from your desktop.';
    DeviceIcon = isMac ? Laptop : Monitor;
  } else if (isTablet) {
    title = 'Install LALAO on Your Tablet';
    description =
      'Install LALAO for an immersive full-screen experience with quick access to your communities, messages, and discoveries.';
    DeviceIcon = Tablet;
  } else if (isAndroid) {
    title = 'Install LALAO on Android';
    description =
      'Install LALAO on your phone for quick access to your communities, messages, and discoveries.';
    DeviceIcon = Smartphone;
  } else if (isIOS) {
    title = 'Install LALAO on iPhone';
    description =
      'Install LALAO on your phone for quick access to your communities, messages, and discoveries.';
    DeviceIcon = Smartphone;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await triggerInstall();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        className="bg-theme-base border border-theme-divider w-full max-w-md md:max-w-lg rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar with close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
              <DeviceIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-theme-tertiary">
              {isDesktop ? (isMac ? 'macOS App' : 'Desktop App') : isTablet ? 'Tablet App' : 'Mobile App'}
            </span>
          </div>

          <button
            type="button"
            onClick={dismissInstallPrompt}
            aria-label="Close installation popup"
            className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-primary hover:bg-theme-surface transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand / Visual Header */}
        <div className="px-6 pt-3 pb-4 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 md:w-22 md:h-22 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl shadow-[#5E43F3]/20 bg-theme-surface flex items-center justify-center p-2 ring-1 ring-black/5 dark:ring-white/10">
              <AppIcon className="w-full h-full rounded-xl md:rounded-2xl object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#5E43F3] text-white p-1 rounded-full shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          <h2 id="install-modal-title" className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
            {isInstalled ? 'LALAO is Installed' : title}
          </h2>
          <p className="text-theme-secondary text-xs sm:text-sm px-2 sm:px-6 mt-2 leading-relaxed">
            {isInstalled
              ? 'You are already enjoying the dedicated LALAO app experience. Open it from your device home screen or applications menu anytime!'
              : description}
          </p>
        </div>

        {/* Main interactive body */}
        <div className="px-6 pb-6 pt-1 space-y-4">
          {isInstalled ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>LALAO is active in standalone app mode on your device.</span>
              </div>
              <button
                type="button"
                onClick={closeInstallModal}
                className="w-full py-3 rounded-full bg-[#5E43F3] text-white font-bold hover:bg-[#4E35D3] transition-colors shadow-lg shadow-[#5E43F3]/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Continue in LALAO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Direct Native Installation Trigger (Desktop Chrome/Edge, Android Chrome) */}
              {isInstallable && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-4 rounded-xl md:rounded-2xl bg-[#5E43F3] text-white font-bold hover:bg-[#4E35D3] active:scale-[0.99] transition shadow-lg shadow-[#5E43F3]/25 flex items-center justify-center gap-2.5 cursor-pointer text-sm md:text-base group"
                  >
                    <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                    <span>Install App</span>
                  </button>
                  <p className="text-[11px] text-center text-theme-tertiary">
                    Instant installation &bull; No downloads required &bull; 100% lightweight & secure
                  </p>
                </div>
              )}

              {/* Desktop Browser Instructions (When beforeinstallprompt hasn't fired or is manual like Firefox/Safari macOS) */}
              {isDesktop && !isInstallable && (
                <div className="bg-theme-surface border border-theme-divider p-4 rounded-2xl text-xs text-theme-secondary space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-theme-primary text-xs sm:text-sm">
                    <Monitor className="w-4 h-4 text-[#5E43F3]" />
                    <span>How to Install on Desktop Browser:</span>
                  </div>
                  {browserType === 'edge' ? (
                    <ol className="list-decimal pl-5 space-y-1.5 text-theme-secondary">
                      <li>
                        Look at the right side of the address bar at the top and click the{' '}
                        <strong className="text-theme-primary font-bold">"App available / Install"</strong> icon (or open Edge menu &bull;&bull;&bull;).
                      </li>
                      <li>
                        Select <strong className="text-theme-primary font-bold">"Install LALAO"</strong>.
                      </li>
                      <li>Click "Install" in the prompt to add LALAO to your taskbar and desktop.</li>
                    </ol>
                  ) : browserType === 'chrome' ? (
                    <ol className="list-decimal pl-5 space-y-1.5 text-theme-secondary">
                      <li>
                        Click the <strong className="text-theme-primary font-bold">Install icon</strong> on the right of your URL address bar, or click the Chrome three-dot menu (<MoreVertical className="w-3.5 h-3.5 inline text-theme-primary" />).
                      </li>
                      <li>
                        Choose <strong className="text-theme-primary font-bold">"Save and share" &rarr; "Install LALAO..."</strong>.
                      </li>
                      <li>Confirm by clicking <strong className="text-theme-primary font-bold">Install</strong>.</li>
                    </ol>
                  ) : isMac ? (
                    <ol className="list-decimal pl-5 space-y-1.5 text-theme-secondary">
                      <li>
                        In Safari, click <strong className="text-theme-primary font-bold">File</strong> in the top menu bar.
                      </li>
                      <li>
                        Click <strong className="text-theme-primary font-bold">"Add to Dock..."</strong>.
                      </li>
                      <li>Confirm to pin LALAO directly into your Mac Dock and Launchpad.</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal pl-5 space-y-1.5 text-theme-secondary">
                      <li>Open your browser settings menu at the top right.</li>
                      <li>Look for <strong className="text-theme-primary font-bold">"Install LALAO"</strong> or <strong className="text-theme-primary font-bold">"Add to Desktop"</strong>.</li>
                      <li>Follow the prompt to pin LALAO for 1-click desktop launch.</li>
                    </ol>
                  )}
                </div>
              )}

              {/* iOS / iPadOS Safari Instructions */}
              {isIOS && (
                <div className="bg-theme-surface border border-theme-divider p-4 rounded-2xl text-xs text-theme-secondary space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-theme-primary text-xs sm:text-sm">
                    <Share className="w-4 h-4 text-[#5E43F3]" />
                    <span>How to Install on iPhone & iPad:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-theme-secondary">
                    <li>
                      Tap the <strong className="text-theme-primary font-bold">Share</strong> button{' '}
                      <Share className="w-3.5 h-3.5 inline mx-0.5 text-[#5E43F3]" /> at the bottom or top of Safari.
                    </li>
                    <li>
                      Scroll down in the options sheet and tap{' '}
                      <strong className="text-theme-primary font-bold">"Add to Home Screen"</strong>.
                    </li>
                    <li>
                      Tap <strong className="text-theme-primary font-bold">Add</strong> in the top-right corner to place LALAO on your device home screen.
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Options: PWA & Native APK Option */}
              {isAndroid && !isInstallable && (
                <div className="bg-theme-surface border border-theme-divider p-4 rounded-2xl text-xs text-theme-secondary space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-theme-primary text-xs sm:text-sm">
                    <Smartphone className="w-4 h-4 text-[#5E43F3]" />
                    <span>To install via Android browser menu:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-theme-secondary">
                    <li>
                      Tap the browser menu (<MoreVertical className="w-3.5 h-3.5 inline text-theme-primary" />) at the top right.
                    </li>
                    <li>
                      Select <strong className="text-theme-primary font-bold">"Install app"</strong> or{' '}
                      <strong className="text-theme-primary font-bold">"Add to Home screen"</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {/* Android APK Download Option */}
              {isAndroid && (
                <div className="pt-1">
                  <a
                    href="/lalao-app.apk"
                    download="lalao-app.apk"
                    className="w-full py-2.5 px-3 rounded-xl border border-theme-divider hover:border-[#5E43F3]/40 bg-theme-surface hover:bg-theme-surface-hover transition flex items-center justify-between text-xs font-semibold text-theme-primary group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Download Android APK (Direct)</div>
                        <div className="text-[10px] text-theme-tertiary">Official standalone Android package</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-theme-tertiary group-hover:text-theme-primary transition" />
                  </a>
                </div>
              )}

              {/* Features summary */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-divider/40">
                  <Zap className="w-3.5 h-3.5 text-[#5E43F3] mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-theme-primary">Fast & Offline</div>
                  <div className="text-[9px] text-theme-tertiary">Instant caching</div>
                </div>
                <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-divider/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-theme-primary">Secure</div>
                  <div className="text-[9px] text-theme-tertiary">End-to-end sync</div>
                </div>
                <div className="p-2.5 rounded-xl bg-theme-surface/50 border border-theme-divider/40">
                  <DeviceIcon className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-theme-primary">Full-Screen</div>
                  <div className="text-[9px] text-theme-tertiary">Native experience</div>
                </div>
              </div>

              {/* Dismiss / Later Button */}
              <button
                type="button"
                onClick={dismissInstallPrompt}
                className="w-full py-2.5 text-xs font-medium text-theme-tertiary hover:text-theme-primary transition text-center cursor-pointer"
              >
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
