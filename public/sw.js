const CACHE_NAME = 'lalao-shell-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/mascot.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isPrivateRequest = url.hostname.includes('convex.cloud') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.pathname.startsWith('/api/');

  if (!isSameOrigin || isPrivateRequest || request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  event.waitUntil(
    event.data.json().then((data) => {
      const options = {
        body: data.body || data.title,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: data.data || { url: data.url || '/app' },
      };

      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const focusedClient = clients.find((client) => client.focused);
        if (focusedClient) {
          focusedClient.postMessage({ type: 'PUSH_RECEIVED', payload: data });
          return;
        }
        return self.registration.showNotification(data.title || 'Lalao', options);
      });
    }).catch((error) => console.error('Invalid push payload:', error)),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickData = event.notification.data || {};
  const urlToOpen = clickData.url || clickData.conversationId
    ? `/app?chat=${clickData.conversationId}`
    : clickData.postId
      ? `/app?post=${clickData.postId}`
      : '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.includes('/app') && 'focus' in client);
      if (existing) {
        existing.postMessage({ type: 'NAVIGATE', url: urlToOpen, data: clickData });
        return existing.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }),
  );
});
