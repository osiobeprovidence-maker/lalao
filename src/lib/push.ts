// src/lib/push.ts

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/**
 * Converts a base64 string to a Uint8Array.
 * Required for PushManager.subscribe's applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission, register the native Web Push service worker,
 * and return the Web Push Subscription.
 *
 * Returns null if permission is denied or the browser doesn't support push.
 */
export async function getOrRequestWebPushSubscription(): Promise<PushSubscription | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[push] Push notifications not supported in this browser.");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.info("[push] Notification permission denied.");
    return null;
  }

  if (!VAPID_KEY) {
    // If VAPID is not set, native Web Push is bypassed (OneSignal handles push delivery)
    return null;
  }

  try {
    // Register the native push service worker
    const registration = await navigator.serviceWorker.register(
      "/sw.js",
      { scope: "/" }
    );

    // Wait until the service worker is ready
    await navigator.serviceWorker.ready;

    // First check if we already have a subscription
    let subscription = await registration.pushManager.getSubscription();
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_KEY);

    // If the VAPID key changed since the subscription was created, the old
    // subscription can never receive pushes from the new key: replace it.
    if (subscription) {
      const existingKey = subscription.options?.applicationServerKey;
      if (existingKey) {
        const existingBytes = new Uint8Array(existingKey);
        const same =
          existingBytes.length === convertedVapidKey.length &&
          existingBytes.every((byte, i) => byte === convertedVapidKey[i]);
        if (!same) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
    }

    if (!subscription) {
      // Create a new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    return subscription;
  } catch (err) {
    console.error("[push] Failed to get push subscription:", err);
    return null;
  }
}

/**
 * Returns existing subscription without requesting permission.
 */
export async function getCurrentWebPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
