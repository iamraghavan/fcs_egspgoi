// public/firebase-messaging-sw.js

// This file should be in the public directory
if (typeof importScripts === 'function') {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

  self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    // Take control of all clients as soon as the service worker is activated.
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            // Check if there's a window for the target URL
            if (client.url.includes(targetUrl) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window found, open a new one
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  });

  const urlParams = new URL(location).searchParams;
  const firebaseConfigParam = urlParams.get('firebaseConfig');

  if (firebaseConfigParam) {
    try {
      const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
      
      if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();
        
        messaging.onBackgroundMessage((payload) => {
            console.log('Service Worker: Received background message ', payload);
            const notificationTitle = payload.notification?.title || 'New Message';
            const notificationOptions = {
                body: payload.notification?.body || 'You have a new message.',
                data: { url: payload.fcmOptions?.link || '/' }
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
        console.log('Service Worker: Firebase initialized and background handler set up.');
      }
    } catch (e) {
      console.error('Service Worker: Error parsing Firebase config or initializing.', e);
    }
  } else {
    console.error('Service Worker: Firebase config not found in URL.');
  }

} else {
    console.log('Service Worker: importScripts is not supported.');
}
