// Purpose: Handle incoming push notifications with firebase

importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");


self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(self.clients.claim());
});

console.log("Service Worker: Script loaded.");

const urlParams = new URLSearchParams(location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
    console.log("Service Worker: Firebase config received and parsed.");
    
    firebase.initializeApp(firebaseConfig);
    console.log("Service Worker: Firebase app initialized.");

    const messaging = firebase.messaging();
    console.log("Service Worker: Firebase Messaging initialized.");
    
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification?.title || "New Notification";
        const notificationOptions = {
            body: payload.notification?.body || "You have a new message.",
            icon: '/logo.png',
            data: { url: payload.fcmOptions?.link || "/" }
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log("Service Worker: Firebase initialized and background handler set up.");
} else {
    console.error("Firebase config not found in service worker.");
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil( 
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});
