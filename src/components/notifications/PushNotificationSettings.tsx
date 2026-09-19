import React, { useState } from 'react';
import { Bell, BellOff, CheckCircle2, Loader2, Smartphone, Zap } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

/**
 * PushNotificationSettings
 *
 * Shown inside the Notifications view as a banner / settings block.
 * - If push is already enabled  → shows green "Active" state.
 * - If permission is denied     → shows browser instruction.
 * - Otherwise                   → shows "Enable" button.
 */
export const PushNotificationSettings: React.FC = () => {
  const { enablePushNotifications, pushEnabled } = useLalao();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');

  const browserPermission =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';

  const handleEnable = async () => {
    if (browserPermission === 'denied') {
      setStatus('denied');
      return;
    }
    setStatus('loading');
    const ok = await enablePushNotifications();
    setStatus(ok ? 'success' : 'denied');
  };

  // ── Already enabled ──────────────────────────────────────────────────────────
  if (pushEnabled || status === 'success') {
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
            You'll get alerts for likes, replies, follows &amp; more — even when the app is closed.
          </p>
        </div>
        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
      </div>
    );
  }

  // ── Browser denied ────────────────────────────────────────────────────────────
  if (status === 'denied' || browserPermission === 'denied') {
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

  // ── Default prompt ────────────────────────────────────────────────────────────
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
          onClick={handleEnable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5E43F3] text-white text-[11px] font-bold hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer disabled:opacity-60 shrink-0"
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
