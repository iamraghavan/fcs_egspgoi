// public/firebase-messaging-sw.js

// Must be outside of any event listeners
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('Service Worker: Script loaded.');

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    // Skip waiting to become active immediately.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    // Take control of all clients immediately.
    event.waitUntil(self.clients.claim());
});

// Get the config from the URL query parameters
const urlParams = new URL(location).searchParams;
const firebaseConfigStr = urlParams.get('firebaseConfig');

let firebaseApp;

if (firebaseConfigStr) {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
        console.log('Service Worker: Firebase config received and parsed.', firebaseConfig);
        firebaseApp = firebase.initializeApp(firebaseConfig);
        
        const messaging = firebase.messaging();
        console.log('Service Worker: Firebase Messaging initialized.');

        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/favicon-32x32.png'
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });

    } catch (e) {
        console.error('Service Worker: Error parsing Firebase config or initializing Firebase.', e);
    }
} else {
    console.error('Service Worker: Firebase config not found in URL. Background notifications will not work.');
}
