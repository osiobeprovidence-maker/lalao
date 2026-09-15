import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  Camera,
  Mic,
  Image as ImageIcon,
  Check,
  X,
  ShieldCheck,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

export const PermissionPromptModal: React.FC = () => {
  const {
    activePermissionPrompt,
    setActivePermissionPrompt,
    permissions,
    updatePermission,
    requestPermission,
    detectGpsLocation,
    triggerShareToast,
  } = useLalao();

  const [preciseLocation, setPreciseLocation] = useState(permissions.preciseLocation ?? true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activePermissionPrompt) return null;

  const handleAllow = async (mode: 'app' | 'once' = 'app') => {
    setIsProcessing(true);
    const type = activePermissionPrompt;
    try {
      const granted = await requestPermission(type, { precise: preciseLocation });
      if (type === 'location') {
        updatePermission('preciseLocation', preciseLocation);
        updatePermission('location', 'granted');
        triggerShareToast('Location access granted. Finding nearby posts...');
        await detectGpsLocation();
      } else if (type === 'notifications') {
        updatePermission('notifications', 'granted');
        triggerShareToast('Notifications enabled for neighborhood alerts!');
      } else if (type === 'camera') {
        updatePermission('camera', 'granted');
        triggerShareToast('Camera access granted for 24-hour cycles.');
      } else if (type === 'microphone') {
        updatePermission('microphone', 'granted');
        triggerShareToast('Microphone access granted for voice notes.');
      } else if (type === 'photos') {
        updatePermission('photos', 'granted');
        triggerShareToast('Photo library access enabled.');
      }
    } catch {
      updatePermission(type, 'granted');
    } finally {
      setIsProcessing(false);
      setActivePermissionPrompt(null);
    }
  };

  const handleDeny = () => {
    if (activePermissionPrompt) {
      updatePermission(activePermissionPrompt, 'denied');
      triggerShareToast(`${activePermissionPrompt.charAt(0).toUpperCase() + activePermissionPrompt.slice(1)} access declined.`);
    }
    setActivePermissionPrompt(null);
  };

  return (
    <div
      id="permission-prompt-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDeny}
    >
      <div
        id="permission-prompt-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 p-6 text-center relative"
      >
        {/* Subtle Close Pill on mobile */}
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

        {/* Dynamic Header & Icon depending on requested permission */}
        {activePermissionPrompt === 'location' && (
          <div>
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#5E43F3]/15 rounded-full animate-ping opacity-60" />
              <div className="w-16 h-16 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full flex items-center justify-center border-2 border-[#5E43F3]/20 relative z-10">
                <MapPin className="w-8 h-8 text-[#5E43F3]" />
              </div>
            </div>

            <h3 className="font-bold text-lg text-neutral-900 leading-snug">
              Allow &quot;Lalao&quot; to access this device&apos;s location?
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed max-w-xs mx-auto">
              Lalao uses your location to discover hyperlocal neighborhood updates, urgent rallies, and active neighbors within your current radius.
            </p>

            {/* Precise Location Toggle Pill */}
            <div className="mt-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${preciseLocation ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Precise Location</p>
                  <p className="text-[11px] text-neutral-500">
                    {preciseLocation ? 'Exact street & neighborhood accuracy' : 'Approximate neighborhood hub (1-2 km)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreciseLocation(!preciseLocation)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  preciseLocation ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    preciseLocation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button
                id="btn-allow-location-app"
                disabled={isProcessing}
                onClick={() => handleAllow('app')}
                className="w-full py-3 px-4 bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {isProcessing ? 'Verifying location...' : 'While Using the App'}
              </button>

              <button
                id="btn-allow-location-once"
                disabled={isProcessing}
                onClick={() => handleAllow('once')}
                className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-2xl transition-all active:scale-[0.98]"
              >
                Only This Time
              </button>

              <button
                id="btn-deny-location"
                disabled={isProcessing}
                onClick={handleDeny}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-700 font-semibold text-xs transition-colors"
              >
                Don&apos;t Allow
              </button>
            </div>
          </div>
        )}

        {activePermissionPrompt === 'notifications' && (
          <div>
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center border-2 border-amber-500/20">
                <Bell className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <h3 className="font-bold text-lg text-neutral-900 leading-snug">
              &quot;Lalao&quot; Would Like to Send You Notifications
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed max-w-xs mx-auto">
              Notifications may include real-time alerts for urgent neighborhood rallies, direct messages from nearby residents, and responses to your status updates.
            </p>

            <div className="mt-6 space-y-2">
              <button
                id="btn-allow-notifications"
                disabled={isProcessing}
                onClick={() => handleAllow('app')}
                className="w-full py-3 px-4 bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Allow Notifications
              </button>

              <button
                id="btn-deny-notifications"
                disabled={isProcessing}
                onClick={handleDeny}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-700 font-semibold text-xs transition-colors"
              >
                Don&apos;t Allow
              </button>
            </div>
          </div>
        )}

        {activePermissionPrompt === 'camera' && (
          <div>
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                <Camera className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <h3 className="font-bold text-lg text-neutral-900 leading-snug">
              &quot;Lalao&quot; Would Like to Access the Camera
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed max-w-xs mx-auto">
              Capture instant photos and short video clips for your 24-hour cycle status, and attach visual verification to local rallies.
            </p>

            <div className="mt-6 space-y-2">
              <button
                id="btn-allow-camera"
                disabled={isProcessing}
                onClick={() => handleAllow('app')}
                className="w-full py-3 px-4 bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Allow Camera Access
              </button>

              <button
                id="btn-deny-camera"
                disabled={isProcessing}
                onClick={handleDeny}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-700 font-semibold text-xs transition-colors"
              >
                Don&apos;t Allow
              </button>
            </div>
          </div>
        )}

        {activePermissionPrompt === 'microphone' && (
          <div>
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center border-2 border-blue-500/20">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <h3 className="font-bold text-lg text-neutral-900 leading-snug">
              &quot;Lalao&quot; Would Like to Access the Microphone
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed max-w-xs mx-auto">
              Record voice notes in neighborhood direct messages and add original audio to your video statuses.
            </p>

            <div className="mt-6 space-y-2">
              <button
                id="btn-allow-microphone"
                disabled={isProcessing}
                onClick={() => handleAllow('app')}
                className="w-full py-3 px-4 bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Allow Microphone Access
              </button>

              <button
                id="btn-deny-microphone"
                disabled={isProcessing}
                onClick={handleDeny}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-700 font-semibold text-xs transition-colors"
              >
                Don&apos;t Allow
              </button>
            </div>
          </div>
        )}

        {activePermissionPrompt === 'photos' && (
          <div>
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center border-2 border-purple-500/20">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <h3 className="font-bold text-lg text-neutral-900 leading-snug">
              &quot;Lalao&quot; Would Like to Access Your Photos
            </h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed max-w-xs mx-auto">
              Select existing photos and videos from your photo library to share on your feed and 24-hour cycle status.
            </p>

            <div className="mt-6 space-y-2">
              <button
                id="btn-allow-photos-full"
                disabled={isProcessing}
                onClick={() => handleAllow('app')}
                className="w-full py-3 px-4 bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Allow Full Photo Access
              </button>

              <button
                id="btn-allow-photos-select"
                disabled={isProcessing}
                onClick={() => handleAllow('once')}
                className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-2xl transition-all active:scale-[0.98]"
              >
                Select Photos...
              </button>

              <button
                id="btn-deny-photos"
                disabled={isProcessing}
                onClick={handleDeny}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-700 font-semibold text-xs transition-colors"
              >
                Don&apos;t Allow
              </button>
            </div>
          </div>
        )}

        {/* Privacy footnote */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5E43F3]" />
          <span>You can change approvals anytime in App Settings</span>
        </div>
      </div>
    </div>
  );
};
