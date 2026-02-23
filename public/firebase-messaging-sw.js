/* eslint-disable no-undef */

// Use more recent versions to align better with the main app's Firebase version
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    // Force the waiting service worker to become the active service worker.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    // Ensure the service worker takes control of pages immediately.
    event.waitUntil(self.clients.claim());
});

// Get the config from the query string passed during registration
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Only initialize if the config is valid
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log("[firebase-messaging-sw.js] Received background message ", payload);
        
        const notificationTitle = payload.notification.title || "New Notification";
        const notificationOptions = {
            body: payload.notification.body || "",
            icon: "/favicon-32x32.png", // A small, safe icon
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error("Firebase config not found in service worker. Notifications will not work in the background.");
}
