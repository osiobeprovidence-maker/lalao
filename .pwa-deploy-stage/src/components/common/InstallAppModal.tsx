import React from 'react';
import { X, Smartphone, Share, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { AppIcon } from './AppIcon';

export const InstallAppModal: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isInstallModalOpen,
    setIsInstallModalOpen,
    triggerInstall,
  } = usePWA();

  if (!isInstallModalOpen) return null;

  const installed = isInstalled || isStandalone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-theme-base w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-4">
        {/* Close Button */}
        <button 
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-theme-surface transition-colors"
        >
          <X className="w-5 h-5 text-theme-secondary" />
        </button>

        {/* Header / Icon */}
        <div className="pt-8 pb-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 bg-theme-surface flex items-center justify-center p-1.5">
            <AppIcon className="w-full h-full rounded-xl" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary">
            {installed ? 'Lalao is already installed' : 'Install Lalao'}
          </h2>
          <p className="text-theme-secondary text-center text-sm px-8 mt-2 leading-relaxed">
            {installed
              ? 'You are already using the Lalao app. Enjoy your local communities!'
              : 'Install Lalao on your phone for quick access to your communities, messages, and discoveries.'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-4">
          {installed ? (
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="w-full py-3.5 rounded-full bg-theme-accent text-white font-bold hover:bg-[#4E35D3] transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Back to App
            </button>
          ) : isInstallable ? (
            <button
              onClick={triggerInstall}
              className="w-full py-3.5 rounded-full bg-theme-accent text-white font-bold hover:bg-[#4E35D3] transition-colors shadow-lg shadow-theme-accent/25 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              Install App
            </button>
          ) : isIOS ? (
            <div className="bg-theme-surface p-4 rounded-xl text-sm text-theme-secondary space-y-3">
              <p className="font-semibold text-theme-primary text-center">To install on iOS:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button in Safari menu</li>
                <li>Scroll down and select <strong>"Add to Home Screen"</strong></li>
                <li>Confirm by tapping <strong>Add</strong></li>
              </ol>
            </div>
          ) : (
            <div className="bg-theme-surface p-4 rounded-xl text-sm text-theme-secondary space-y-2">
              <p className="font-semibold text-theme-primary text-center">To install manually:</p>
              <p>Look for an "Install App" or "Add to Home Screen" option in your browser menu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
