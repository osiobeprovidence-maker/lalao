const CACHE_NAME = 'lalao-shell-v3';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/app-icon.png',
  '/mascot.png',
  '/favicon.ico',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        STATIC_ASSETS.map((asset) => cache.add(asset).catch(() => {})),
      ))
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
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && !response.bodyUsed) {
            try {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => {});
            } catch (err) {
              // ignore clone errors
            }
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
        if (response && response.ok && !response.bodyUsed) {
          try {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          } catch (err) {
            // ignore clone errors
          }
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
      const clickData = data.data || {};
      const conversationId = data.conversationId || clickData.conversationId;
      const targetUrl = data.url || clickData.url || (conversationId ? `/app?chat=${conversationId}` : '/app');

      const messageId = data.messageId || clickData.messageId;
      const tag = data.tag || (messageId ? `msg-${messageId}` : conversationId ? `chat-${conversationId}-${Date.now()}` : undefined);
      const options = {
        body: data.body || data.title,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag,
        renotify: true,
        requireInteraction: false,
        data: {
          url: targetUrl,
          conversationId,
          messageId,
          ...(clickData || {}),
        },
      };

      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PUSH_RECEIVED', payload: { ...data, url: targetUrl } });
        });
        return self.registration.showNotification(data.title || 'Lalao', options);
      });
    }).catch((error) => console.error('Invalid push payload:', error)),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickData = event.notification.data || {};
  const urlToOpen = clickData.conversationId
    ? `/app?chat=${clickData.conversationId}`
    : clickData.postId
      ? `/app?post=${clickData.postId}`
      : (typeof clickData.url === 'string' && clickData.url.startsWith('/'))
        ? clickData.url
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
