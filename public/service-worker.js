self.addEventListener('install', (event) => {
  // Forces the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Ensures that updates to the underlying service worker take effect immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }
  const data = event.data.json();
  const title = data.title || 'CreditWise Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/apple-touch-icon.png',
    badge: data.badge || '/favicon-32x32.png',
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
