// Firebase Cloud Messaging Service Worker — background push handler
// ⚠️  This file must be served from the root of the origin (public/firebase-messaging-sw.js)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBv_Cf6i4RvL2pikdVhGb8cHUDKYpjjSRA",
  authDomain: "uselalaoapp.firebaseapp.com",
  projectId: "uselalaoapp",
  storageBucket: "uselalaoapp.appspot.com",
  messagingSenderId: "853680775586",
  appId: "1:853680775586:web:1d3beaf2dd0c8dec35d2fb",
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background FCM message received:", payload);

  const title =
    payload.notification?.title ?? payload.data?.title ?? "Lalao";
  const body =
    payload.notification?.body ?? payload.data?.body ?? "You have a new notification";
  const url = payload.data?.url ?? payload.fcmOptions?.link ?? "/";
  const icon = payload.notification?.icon ?? "/mascot.png";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/mascot.png",
    data: { url },
    vibrate: [100, 50, 100],
    tag: "lalao-notification",
    renotify: true,
  });
});

// When the user clicks a notification, open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing open window and navigate it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
