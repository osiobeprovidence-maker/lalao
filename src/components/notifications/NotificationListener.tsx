import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getFirebaseMessaging, onMessage } from '../../lib/firebase';
import { useLalao } from '../../context/LalaoContext';
import type { NavTab } from '../../context/LalaoContext';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

/**
 * Maps a notification deep-link URL to the in-app tab it should open.
 * Returns null when there is no URL.
 */
export const resolveNotificationTab = (url?: string | null): NavTab | null => {
  if (!url) return null;
  if (url.includes('chat=') || url.includes('tab=messages')) return 'messages';
  if (url.includes('tab=notifications') || /\/notifications(?:[/?#]|$)/.test(url)) {
    return 'notifications';
  }
  return 'home';
};

export const NotificationListener: React.FC = () => {
  const [toast, setToast] = useState<PushNotificationPayload | null>(null);
  const { activeTab, setActiveTab } = useLalao();

  // Keep latest values in refs so the subscriptions below are created once
  // instead of being torn down and re-created on every render.
  const setActiveTabRef = useRef(setActiveTab);
  setActiveTabRef.current = setActiveTab;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((payload: PushNotificationPayload) => {
    // Already looking at the notifications list: it updates live, no toast needed.
    if (resolveNotificationTab(payload.url) === 'notifications' && activeTabRef.current === 'notifications') {
      return;
    }

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setToast(payload);
    // Auto-dismiss after 5 seconds
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setToast(null);
    }, 5000);
  }, []);

  useEffect(() => {
    // 1. Listen for Firebase Cloud Messaging foreground messages
    const messaging = getFirebaseMessaging();
    let unsubscribeFcm: (() => void) | undefined;

    if (messaging) {
      try {
        unsubscribeFcm = onMessage(messaging, (payload) => {
          console.log('[NotificationListener] Foreground FCM message:', payload);
          const title = payload.notification?.title ?? payload.data?.title ?? 'Lalao';
          const body = payload.notification?.body ?? payload.data?.body ?? '';
          const url = payload.data?.url ?? payload.fcmOptions?.link;
          const icon = payload.notification?.icon ?? '/mascot.png';

          showToast({ title, body, url, icon });
        });
      } catch (err) {
        console.warn('Failed to subscribe to FCM foreground messages', err);
      }
    }

    // 2. Listen for native Web Push foreground messages (from sw.js)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        console.log('[NotificationListener] Foreground Native Push message:', event.data.payload);
        const { title, body, icon, url } = event.data.payload ?? {};
        showToast({ title: title ?? 'Lalao', body: body ?? '', icon, url });
      } else if (event.data && event.data.type === 'NAVIGATE') {
        const tab = resolveNotificationTab(event.data.url) ?? 'home';
        setActiveTabRef.current(tab);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if (unsubscribeFcm) unsubscribeFcm();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [showToast]);

  const dismissToast = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setToast(null);
  };

  const handleToastClick = () => {
    const tab = resolveNotificationTab(toast?.url);
    if (tab) setActiveTabRef.current(tab);
    dismissToast();
  };

  if (!toast) return null;

  return (
    <div
      onClick={handleToastClick}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-full max-w-sm cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="bg-theme-surface border border-theme-divider-strong shadow-2xl rounded-2xl p-4 flex items-start gap-3 hover:bg-theme-surface-hover transition-colors">
        {toast.icon && (
          <img src={toast.icon} alt="Notification icon" className="w-10 h-10 rounded-full object-cover shrink-0 bg-theme-surface-active" />
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-bold text-theme-primary truncate">{toast.title}</p>
          <p className="text-xs text-theme-secondary mt-0.5 line-clamp-2">{toast.body}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); dismissToast(); }}
          className="text-theme-tertiary hover:text-theme-primary p-1 -mt-1 -mr-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};
