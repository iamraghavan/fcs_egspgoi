
// Scripts for Firebase
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

console.log("Service Worker: Script loaded.");

// Get Firebase config from URL
const urlParams = new URLSearchParams(location.search);
const firebaseConfigEncoded = urlParams.get('firebaseConfig');

if (!firebaseConfigEncoded) {
    console.error("Service Worker: Firebase config not found in URL. Notifications will not work in the background.");
} else {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigEncoded));
        console.log("Service Worker: Firebase config received and parsed.");

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        const messaging = firebase.messaging();
        console.log("Service Worker: Firebase Messaging initialized.");

        // Optional: Set up background message handler
        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);

            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/logo.png' // Make sure you have a logo file at this path
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
        console.log("Service Worker: Firebase initialized and background handler set up.");

    } catch (error) {
        console.error("Service Worker: Error initializing Firebase.", error);
    }
}

// Service worker lifecycle events for immediate activation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(self.clients.claim()); // Become available to all pages
});
