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
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Lalao Test Notification', {
            body: 'Desktop notifications are appearing on this device.',
            icon: '/icon-192.png',
            tag: 'lalao-local-notification-test',
            requireInteraction: true,
          } as NotificationOptions);
        } catch (notificationError) {
          // Still run the server push test if the browser blocks page-created notifications.
          console.warn('Could not show local browser notification:', notificationError);
        }
      }
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
  // Hide prompt banner completely when notifications are already on
  if (hasActivePushToken || status === 'success' || browserPermission === 'granted') {
    return null;
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
