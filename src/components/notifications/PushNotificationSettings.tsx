import React from 'react';
import { Bell, BellOff, CheckCircle2, Loader2, Smartphone, Zap } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

/**
 * PushNotificationSettings
 *
 * Shown inside the Notifications view as a banner / settings block.
 * - Uses the unified usePushNotifications hook shared with Home.
 * - Displays active, denied, prompt, or unsupported state dynamically.
 */
export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    browserPermission,
    hasActivePushToken,
    status,
    enableNotifications,
  } = usePushNotifications();

  // ── Browser Unsupported ──────────────────────────────────────────────────────
  if (!isSupported || browserPermission === 'unsupported') {
    return (
      <div
        id="push-settings-unsupported"
        className="mx-4 mt-3 rounded-2xl border border-neutral-200 bg-neutral-100/70 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0">
          <BellOff className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-neutral-800">Push notifications unavailable</p>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            Web Push is not supported by your current browser or device environment.
          </p>
        </div>
      </div>
    );
  }

  // ── Already Enabled / Active Token ──────────────────────────────────────────
  if (hasActivePushToken || status === 'success') {
    return (
      <div
        id="push-settings-active"
        className="mx-4 mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-emerald-900">Push notifications are on</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            You&apos;ll get alerts for likes, replies, follows &amp; more — even when the app is closed.
          </p>
        </div>
        <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
      </div>
    );
  }

  // ── Browser Permission Denied ────────────────────────────────────────────────
  if (browserPermission === 'denied' || status === 'denied') {
    return (
      <div
        id="push-settings-denied"
        className="mx-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <BellOff className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-amber-900">Notifications blocked by browser</p>
          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
            To enable push notifications, open your browser settings, find <strong>Site Permissions</strong>, and allow notifications for this site.
          </p>
        </div>
      </div>
    );
  }

  // ── Default Prompt ───────────────────────────────────────────────────────────
  return (
    <div
      id="push-settings-prompt"
      className="mx-4 mt-3 rounded-2xl border border-[#5E43F3]/20 bg-gradient-to-br from-[#5E43F3]/5 to-indigo-50 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-neutral-900 flex items-center gap-1.5">
            Stay in the loop
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          </p>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            Get instant alerts for likes, replies, follows &amp; local activity.
          </p>
        </div>
        <button
          id="push-enable-btn"
          type="button"
          disabled={status === 'loading'}
          onClick={enableNotifications}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5E43F3] text-white text-[11px] font-bold hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer disabled:opacity-60 shrink-0"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Enabling…</span>
            </>
          ) : (
            <span>Enable</span>
          )}
        </button>
      </div>
    </div>
  );
};
