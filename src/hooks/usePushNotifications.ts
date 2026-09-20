import { useState, useCallback, useEffect } from 'react';
import { useLalao } from '../context/LalaoContext';

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';
export type PushSyncStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unsupported' | 'error';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  browserPermission: PushPermissionState;
  hasActivePushToken: boolean;
  pushEnabled: boolean;
  status: PushSyncStatus;
  errorMessage: string | null;
  isPromptDismissed: boolean;
  enableNotifications: () => Promise<boolean>;
  dismissPrompt: () => void;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { pushEnabled, enablePushNotifications: enableInContext } = useLalao();

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;

  const [browserPermission, setBrowserPermission] = useState<PushPermissionState>(() => {
    if (!isSupported) return 'unsupported';
    return (Notification.permission as PushPermissionState) ?? 'default';
  });

  const [status, setStatus] = useState<PushSyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lalao_dismissed_push_prompt') === 'true';
    } catch {
      return false;
    }
  });

  // Keep browser permission state in sync with current window.Notification.permission
  useEffect(() => {
    if (!isSupported) {
      setBrowserPermission('unsupported');
      return;
    }
    const current = (Notification.permission as PushPermissionState) ?? 'default';
    setBrowserPermission(current);
  }, [isSupported]);

  const dismissPrompt = useCallback(() => {
    try {
      localStorage.setItem('lalao_dismissed_push_prompt', 'true');
    } catch {
      // ignore storage errors
    }
    setIsPromptDismissed(true);
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setStatus('unsupported');
      setErrorMessage('Web Push notifications are not supported by this browser.');
      return false;
    }

    if (Notification.permission === 'denied') {
      setBrowserPermission('denied');
      setStatus('denied');
      return false;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      // Trigger real browser permission prompt (Notification.requestPermission)
      // and register native Web Push Subscription + Convex token record
      const success = await enableInContext();
      if (success) {
        setBrowserPermission('granted');
        setStatus('success');
        return true;
      } else {
        const currentPerm = (Notification.permission as PushPermissionState) ?? 'default';
        setBrowserPermission(currentPerm);
        if (currentPerm === 'denied') {
          setStatus('denied');
        } else {
          setStatus('error');
          setErrorMessage('Could not complete push subscription registration.');
        }
        return false;
      }
    } catch (err: any) {
      console.error('[usePushNotifications] Enable error:', err);
      setStatus('error');
      setErrorMessage(
        err?.message ?? 'An unexpected error occurred while enabling notifications.'
      );
      return false;
    }
  }, [isSupported, enableInContext]);

  return {
    isSupported,
    browserPermission,
    hasActivePushToken: pushEnabled,
    pushEnabled,
    status,
    errorMessage,
    isPromptDismissed,
    enableNotifications,
    dismissPrompt,
  };
};
