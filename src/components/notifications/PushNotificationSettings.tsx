import React from 'react';
import { Bell, BellOff, CheckCircle2, Loader2, Smartphone, Zap, Send } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
  const sendTestNotification = useAction(api.pushActions.sendTestNotification);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleTestPush = async () => {
    try {
      setIsTesting(true);
      await sendTestNotification();
    } catch (err) {
      console.error('Test push error:', err);
      alert('Failed to send test push notification');
    } finally {
      setIsTesting(false);
    }
  };

  // ── Browser Unsupported ──────────────────────────────────────────────────────
  if (!isSupported || browserPermission === 'unsupported') {
    return (
      <div
        id="push-settings-unsupported"
        className="mx-4 mt-3 rounded-2xl border border-theme-divider bg-theme-surface-hover/70 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-theme-surface-active text-theme-secondary flex items-center justify-center shrink-0">
          <BellOff className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-theme-primary">Push notifications unavailable</p>
          <p className="text-[11px] text-theme-secondary mt-0.5">
            Web Push is not supported by your current browser or device environment.
          </p>
        </div>
      </div>
    );
  }

  // ── Already Enabled / Active Token ──────────────────────────────────────────
  if (hasActivePushToken || status === 'success' || browserPermission === 'granted') {
    return (
      <div
        id="push-settings-active"
        className="mx-4 mt-3 rounded-2xl border border-[#5E43F3]/20 bg-theme-surface-hover/50 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-theme-primary">Push notifications are on</p>
          <p className="text-[11px] text-theme-tertiary mt-0.5">
            You&apos;ll get alerts for likes, replies, follows &amp; more — even when the app is closed.
          </p>
        </div>
        <button
          onClick={handleTestPush}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-primary text-[11px] font-bold transition-colors disabled:opacity-50 shrink-0"
        >
          {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-[#5E43F3]" />}
          <span>Test</span>
        </button>
      </div>
    );
  }

  // ── Browser Permission Denied ────────────────────────────────────────────────
  if (browserPermission === 'denied' || status === 'denied') {
    return (
      <div
        id="push-settings-denied"
        className="mx-4 mt-3 rounded-2xl border border-rose-500/20 bg-theme-surface-hover/50 px-4 py-3 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
          <BellOff className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-theme-primary">Notifications blocked by browser</p>
          <p className="text-[11px] text-theme-tertiary mt-0.5 leading-relaxed">
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
      className="mx-4 mt-3 rounded-2xl border border-[#5E43F3]/20 bg-theme-surface-hover/50 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-theme-primary flex items-center gap-1.5">
            Stay in the loop
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          </p>
          <p className="text-[11px] text-theme-secondary mt-0.5">
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
