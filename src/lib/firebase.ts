import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBv_Cf6i4RvL2pikdVhGb8cHUDKYpjjSRA",
  authDomain: "uselalaoapp.firebaseapp.com",
  projectId: "uselalaoapp",
  storageBucket: "uselalaoapp.appspot.com",
  messagingSenderId: "853680775586",
  appId: "1:853680775586:web:1d3beaf2dd0c8dec35d2fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage using the canonical default bucket for this project.
// The legacy .firebasestorage.app alias can trigger upload CORS failures for some projects.
export const storage = getStorage(app, "gs://uselalaoapp.appspot.com");

export const uploadFileToStorage = async (file: File, folder: string) => {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/* ─────────────────────────────────────────────────────────────────────────────
   FIREBASE CLOUD MESSAGING
   ───────────────────────────────────────────────────────────────────────────── */

// VAPID key for FCM Web Push — get this from:
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair
// Store in VITE_FIREBASE_VAPID_KEY in your .env.local
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let _messaging: Messaging | null = null;

function getFirebaseMessaging(): Messaging | null {
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
    // Register the FCM-compatible service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
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

