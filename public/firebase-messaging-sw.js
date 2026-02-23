// Import the Firebase app and messaging modules (compat version for use with importScripts)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('Service Worker: Script loaded.');

// This event is fired when the service worker is installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Force the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

// This event is fired when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});


const urlParams = new URL(self.location).searchParams;
const firebaseConfigStr = urlParams.get('firebaseConfig');

if (firebaseConfigStr) {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
        console.log('Service Worker: Firebase config received and parsed.');

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('Service Worker: Firebase app initialized.');

        const messaging = firebase.messaging();
        console.log('Service Worker: Firebase Messaging initialized.');
        
        // Set up the background message handler
        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);

            const notificationTitle = payload.notification?.title || 'New Notification';
            const notificationOptions = {
                body: payload.notification?.body || '',
                icon: '/favicon-32x32.png',
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
        console.log('Service Worker: Background message handler set up.');

    } catch (error) {
        console.error('Service Worker: Error during Firebase initialization.', error);
    }
} else {
  console.error('Service Worker: Firebase config not found in URL. Background notifications will not work.');
}
