const CACHE_NAME = 'lalao-cache-v1';
const DYNAMIC_CACHE = 'lalao-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mascot.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API requests (Convex, Firebase, etc.)
  if (url.hostname.includes('convex.cloud') || url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return;
  }

  // Network first for HTML and navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, Images)
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => null);
        return cachedResponse || fetchPromise;
      })
    );
  }
});

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/logo192.png',
        badge: '/logo192.png', // A small monochrome icon is usually preferred for badge
        data: data.data || {}
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (err) {
      console.error('Error parsing push data', err);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const clickData = event.notification.data;
  let urlToOpen = '/';

  if (clickData && clickData.url) {
    urlToOpen = clickData.url;
  } else if (clickData && clickData.conversationId) {
    urlToOpen = '/app?chat=' + clickData.conversationId;
  } else if (clickData && clickData.postId) {
    urlToOpen = '/app?post=' + clickData.postId;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/app') && 'focus' in client) {
          // Send message to the client to navigate to the specific chat/post without full reload
          client.postMessage({
            type: 'NAVIGATE',
            url: urlToOpen,
            data: clickData
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
