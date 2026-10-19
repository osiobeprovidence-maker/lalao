// src/lib/onesignal.ts
/**
 * Official OneSignal Web SDK v16 Integration Module for Lalao
 * 
 * Features:
 * - Single-source App ID configuration
 * - Strictly idempotent initialization protection (guarded against React StrictMode double-execution)
 * - Custom service worker path (/onesignal/OneSignalSDKWorker.js) with isolated scope (/onesignal/)
 *   to avoid colliding with Lalao's root PWA service worker (/sw.js)
 * - Safe user identity linking (login/logout using Lalao's canonical user ID)
 * - Explicit opt-in permission triggering
 * - Safe deep link notification click navigation
 */

export const ONESIGNAL_APP_ID =
  (import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined) ||
  "0da46499-22a0-4035-8dfa-49f4395367da";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
    __onesignal_initialized__?: boolean;
    __onesignal_init_promise__?: Promise<any>;
  }
}

/**
 * Loads the official OneSignal Web SDK v16 script if not already present.
 */
function loadOneSignalScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.querySelector('script[src*="OneSignalSDK.page.js"]');
    if (existingScript) {
      resolve();
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      console.warn("[OneSignal] Failed to load OneSignalSDK.page.js script:", err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initializes OneSignal exactly once with isolated service worker paths.
 */
export async function initOneSignal(options?: {
  onNotificationClick?: (url: string) => void;
}): Promise<any> {
  if (typeof window === "undefined") return null;

  if (window.__onesignal_init_promise__) {
    return window.__onesignal_init_promise__;
  }

  window.__onesignal_init_promise__ = (async () => {
    try {
      await loadOneSignalScript();

      return await new Promise((resolve) => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            if (!window.__onesignal_initialized__) {
              await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: import.meta.env.DEV,
                // Custom worker path and scope to avoid collision with /sw.js
                serviceWorkerPath: "onesignal/OneSignalSDKWorker.js",
                serviceWorkerParam: {
                  scope: "/onesignal/",
                },
              });

              window.__onesignal_initialized__ = true;
              console.log("[OneSignal] Initialized with App ID:", ONESIGNAL_APP_ID);

              // Set up notification click listener if supported
              if (OneSignal.Notifications?.addEventListener) {
                OneSignal.Notifications.addEventListener("click", (event: any) => {
                  try {
                    const launchURL =
                      event?.notification?.launchURL ||
                      event?.notification?.additionalData?.url ||
                      "/app";

                    if (options?.onNotificationClick) {
                      options.onNotificationClick(launchURL);
                    }
                  } catch (err) {
                    console.warn("[OneSignal] Click listener error:", err);
                  }
                });
              }
            }

            resolve(OneSignal);
          } catch (initErr) {
            console.warn("[OneSignal] Error during OneSignal.init():", initErr);
            resolve(OneSignal);
          }
        });
      });
    } catch (err) {
      console.warn("[OneSignal] Initialization error:", err);
      return null;
    }
  })();

  return window.__onesignal_init_promise__;
}

let lastBoundUserId: string | null = null;

/**
 * Associates the current browser subscription with Lalao's stable canonical user ID.
 * Uses OneSignal.login(externalId).
 * Automatically ensures push subscription is opted in if browser permission is already granted.
 */
export async function setOneSignalUser(userId: string): Promise<void> {
  if (typeof window === "undefined" || !userId) return;

  lastBoundUserId = userId;
  await initOneSignal();

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      // 1. If native permission is already granted but OneSignal push subscription is not yet opted in, opt in automatically without re-prompting
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        if (OneSignal?.User?.PushSubscription && !OneSignal.User.PushSubscription.optedIn) {
          try {
            await OneSignal.User.PushSubscription.optIn();
          } catch (optInErr) {
            console.warn("[OneSignal] PushSubscription.optIn() attempt:", optInErr);
          }
        }
      }

      // 2. Associate external_id
      if (OneSignal?.login) {
        await OneSignal.login(userId);
        console.log(`[OneSignal] Logged in with external user ID: ${userId}, pushOptedIn=${Boolean(OneSignal?.User?.PushSubscription?.optedIn)}, subscriptionId=${OneSignal?.User?.PushSubscription?.id || "pending"}`);
      }

      // 3. Attach a subscription change observer to guarantee identity is bound once subscription becomes active
      if (OneSignal?.User?.PushSubscription?.addEventListener && !(window as any).__onesignal_sub_listener_attached__) {
        (window as any).__onesignal_sub_listener_attached__ = true;
        OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
          console.log("[OneSignal] Push subscription state changed:", event?.current);
          if (event?.current?.optedIn && lastBoundUserId) {
            try {
              await OneSignal.login(lastBoundUserId);
              console.log(`[OneSignal] Re-bound external ID ${lastBoundUserId} on subscription activation: id=${event?.current?.id}`);
            } catch (reErr) {
              console.warn("[OneSignal] Failed to re-bind external ID on change:", reErr);
            }
          }
        });
      }
    } catch (err) {
      console.warn("[OneSignal] Failed to associate user identity:", err);
    }
  });
}

/**
 * Clears the user identity association on sign-out without deleting device subscriptions.
 */
export async function clearOneSignalUser(): Promise<void> {
  if (typeof window === "undefined") return;

  await initOneSignal();

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (OneSignal?.logout) {
        await OneSignal.logout();
        console.log("[OneSignal] User identity cleared on logout");
      }
    } catch (err) {
      console.warn("[OneSignal] Failed to clear user identity on logout:", err);
    }
  });
}

/**
 * Requests push permission explicitly via OneSignal's user opt-in flow.
 * Separate from initialization.
 */
export async function requestOneSignalPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  await initOneSignal();

  return new Promise<boolean>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (OneSignal?.Notifications?.requestPermission) {
          await OneSignal.Notifications.requestPermission();
        } else if (typeof Notification !== "undefined") {
          await Notification.requestPermission();
        }

        const isOptedIn = Boolean(OneSignal?.User?.PushSubscription?.optedIn);
        const hasPermission = Notification.permission === "granted";
        resolve(isOptedIn || hasPermission);
      } catch (err) {
        console.warn("[OneSignal] Permission request error:", err);
        resolve(Notification.permission === "granted");
      }
    });
  });
}

/**
 * Checks current OneSignal push subscription state.
 */
export async function getOneSignalSubscriptionState(): Promise<{
  isOptedIn: boolean;
  subscriptionId?: string;
  pushToken?: string;
  permission: NotificationPermission | "unsupported";
}> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { isOptedIn: false, permission: "unsupported" };
  }

  await initOneSignal();

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      const isOptedIn = Boolean(OneSignal?.User?.PushSubscription?.optedIn);
      const subscriptionId = OneSignal?.User?.PushSubscription?.id;
      const pushToken = OneSignal?.User?.PushSubscription?.token;
      const permission = Notification.permission;

      resolve({
        isOptedIn,
        subscriptionId,
        pushToken,
        permission,
      });
    });
  });
}
