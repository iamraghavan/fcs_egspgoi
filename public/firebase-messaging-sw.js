
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  self.clients.claim();
});

// Listen for the config message from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    const firebaseConfig = event.data.config;

    if (firebaseConfig && firebaseConfig.apiKey) {
      console.log("Service Worker: Firebase config received, initializing...");
      try {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
          console.log('[firebase-messaging-sw.js] Received background message ', payload);
          const notificationTitle = payload.notification.title;
          const notificationOptions = {
            body: payload.notification.body,
            icon: '/logo.png' 
          };
          self.registration.showNotification(notificationTitle, notificationOptions);
        });

        console.log("Service Worker: Firebase initialized and background handler set up.");
        
        // Use the port from the message event to send a reply
        if (event.ports[0]) {
          event.ports[0].postMessage({ type: 'INIT_SUCCESS' });
        }

      } catch (e) {
        console.error("Service Worker: Error initializing Firebase.", e);
        if (event.ports[0]) {
          event.ports[0].postMessage({ type: 'INIT_FAILURE', error: e.message });
        }
      }
    } else {
      console.error('Service Worker: Config not received or invalid.');
       if (event.ports[0]) {
        event.ports[0].postMessage({ type: 'INIT_FAILURE', error: 'Config not received or invalid.' });
      }
    }
  }
});
