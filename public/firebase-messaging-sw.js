// This file must be in the public directory.

// The service worker needs to be able to import the Firebase libraries.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

console.log("Service Worker: Script loaded.");

// The service worker needs to take control of the page immediately
// to ensure it can handle push events from the start.
self.addEventListener('install', (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(self.clients.claim());
});


// The configuration is passed as a URL parameter when the service worker is registered.
const urlParams = new URL(location).searchParams;
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    // The config is URI-encoded, so it needs to be decoded.
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
    console.log("Service Worker: Firebase config received and parsed.", firebaseConfig);

    try {
        // Initialize the Firebase app with the config.
        firebase.initializeApp(firebaseConfig);
        console.log("Service Worker: Firebase app initialized.");

        // Get an instance of Firebase Messaging.
        const messaging = firebase.messaging();
        console.log("Service Worker: Firebase Messaging initialized.");

        // This is the handler for background notifications.
        // It's what runs when a push notification is received and the app tab is not in the foreground.
        messaging.onBackgroundMessage((payload) => {
            console.log('Service Worker: Received background message ', payload);

            const notificationTitle = payload.notification?.title || "New Notification";
            const notificationOptions = {
                body: payload.notification?.body || "You have a new update.",
                icon: payload.notification?.icon || '/favicon-32x32.png',
                data: { url: payload.fcmOptions?.link || "/" },
            };

            // Display the notification to the user.
            self.registration.showNotification(notificationTitle, notificationOptions);
        });
        
        console.log("Service Worker: Firebase initialized and background handler set up.");
        
    } catch (e) {
        console.error("Service Worker: Error during Firebase initialization.", e);
    }
} else {
    console.error("Service Worker: Firebase config not found in URL. Background notifications will not work.");
}

// This handler is for when a user clicks on a notification.
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked.", event.notification);
  event.notification.close(); // Close the notification

  const targetUrl = event.notification.data?.url || "/";

  // This code tries to focus an existing tab with the target URL,
  // or opens a new one if it can't find one.
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Check if the client URL includes the target.
        // You might want to make this check stricter depending on your needs.
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // If no client was found, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
