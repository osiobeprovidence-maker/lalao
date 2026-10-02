self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
