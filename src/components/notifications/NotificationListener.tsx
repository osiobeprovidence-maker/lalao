import React, { useEffect, useState } from 'react';
import { getFirebaseMessaging, onMessage } from '../../lib/firebase';
import { useLalao } from '../../context/LalaoContext';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export const NotificationListener: React.FC = () => {
  const [toast, setToast] = useState<PushNotificationPayload | null>(null);
  const { setActiveTab } = useLalao();

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
          
          if (url && window.location.search.includes(url.split('?')[1])) { return; } showToast({ title, body, url, icon });
        });
      } catch (err) {
        console.warn('Failed to subscribe to FCM foreground messages', err);
      }
    }

    // 2. Listen for native Web Push foreground messages (from sw.js)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        console.log('[NotificationListener] Foreground Native Push message:', event.data.payload);
        const { title, body, icon, url } = event.data.payload;
        if (url && window.location.search.includes(url.split('?')[1])) { return; } showToast({ title, body, icon, url });
      } else if (event.data && event.data.type === 'NAVIGATE') {
        const url = event.data.url;
        if (url && url.includes('chat=')) {
          setActiveTab('messages');
        } else if (url && url.includes('post=')) {
          // You might handle specific post navigation here
        } else {
          setActiveTab('home');
        }
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
    };
  }, [setActiveTab]);

  const showToast = (payload: PushNotificationPayload) => {
    setToast(payload);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToast((prev) => (prev?.title === payload.title ? null : prev));
    }, 5000);
  };

  const handleToastClick = () => {
    if (toast?.url) {
      if (toast.url.includes('chat=')) {
        setActiveTab('messages');
      } else if (toast.url.includes('post=')) {
        // Handle post
      } else {
        setActiveTab('home');
      }
    }
    setToast(null);
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
          onClick={(e) => { e.stopPropagation(); setToast(null); }}
          className="text-theme-tertiary hover:text-theme-primary p-1 -mt-1 -mr-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};
