self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming native Web Push messages
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[SW] Push received:', payload);

    const title = payload.title || 'Lalao Notification';
    const options = {
      body: payload.body || 'You have a new notification',
      icon: payload.icon || '/mascot.png',
      badge: payload.badge || '/mascot.png',
      image: payload.image,
      data: {
        url: payload.url || payload.data?.url || '/',
        notificationId: payload.notificationId
      },
      tag: payload.tag || 'lalao-notification',
      renotify: true,
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[SW] Error parsing push data:', err);
    // Fallback if not JSON
    event.waitUntil(
      self.registration.showNotification('Lalao', {
        body: event.data.text(),
        icon: '/mascot.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an open tab for this origin
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if ('navigate' in client && client.url !== new URL(urlToOpen, self.location.origin).href) {
               client.navigate(urlToOpen);
            }
            return;
          }
        }
        // No matching tab, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
