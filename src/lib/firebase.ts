import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { buildFirebaseConfig } from "./firebaseConfig";

const configured = buildFirebaseConfig();

// True only when Firebase is explicitly configured (production flag or preview credentials).
export const FIREBASE_ENABLED = configured !== null;

// Initialize Firebase only when explicitly configured. When unconfigured, the
// exported handles are null-like so consumers must check FIREBASE_ENABLED and
// must not attempt network calls against production infrastructure.
const app: FirebaseApp | null = configured ? initializeApp(configured) : null;

export const auth: Auth | null = app ? getAuth(app) : null;

export function isFirebaseReady(): boolean {
  return app !== null;
}

if (app && auth) {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export const storage: FirebaseStorage | null = app ? getStorage(app, configured!.storageBucket) : null;

export const uploadFileToStorage = async (file: File, folder: string) => {
  if (!app || !storage) throw new Error("Firebase storage is not configured in this environment.");
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const DEFAULT_FIREBASE_VAPID_KEY =
  "BLlOLXJS78b8x4VneLVs1iAN5zl1QQhWkWl3YzzzRRjPshoXgmzcp8DG9EgnlnvWSTauqY22NYFF5MwL44BGe0I";

const VAPID_KEY =
  (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) ||
  DEFAULT_FIREBASE_VAPID_KEY;

let _messaging: Messaging | null = null;

function getFirebaseMessaging(): Messaging | null {
  if (!app) return null;
  if (_messaging) return _messaging;
  try {
    _messaging = getMessaging(app);
    return _messaging;
  } catch {
    // Messaging not supported (e.g., in non-browser environments)
    return null;
  }
}

export { onMessage, getFirebaseMessaging };

/**
 * Request notification permission, register the FCM service worker,
 * and return the FCM registration token.
 *
 * Returns null if permission is denied or the browser doesn't support push.
 */
export async function getOrRequestFcmToken(): Promise<string | null> {
  if (!app) {
    console.info("[fcm] Firebase not configured; push disabled in this environment.");
    return null;
  }
  if (!VAPID_KEY) {
    console.info("[fcm] VITE_FIREBASE_VAPID_KEY not set; FCM push disabled in this environment.");
    return null;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[fcm] Push notifications not supported in this browser.");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.info("[fcm] Notification permission denied.");
    return null;
  }

  try {
    // Register the FCM service worker under Firebase's dedicated push scope so it
    // never conflicts with the root PWA service worker (/sw.js on scope "/").
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-cloud-messaging-push-scope" }
    );

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (err) {
    console.error("[fcm] Failed to get FCM token:", err);
    return null;
  }
}
