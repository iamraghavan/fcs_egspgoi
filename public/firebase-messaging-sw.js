
// Use the older 'importScripts' for compatibility in service workers.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Force the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all pages under this service worker's scope immediately.
  event.waitUntil(self.clients.claim());
});

try {
  console.log("Service Worker: Script loaded.");
  const urlParams = new URLSearchParams(self.location.search);
  const firebaseConfigString = urlParams.get('firebaseConfig');

  if (!firebaseConfigString) {
    throw new Error("Firebase config not found in service worker URL.");
  }
  
  const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigString));
  console.log("Service Worker: Firebase config received and parsed.");
  
  // Initialize Firebase using the compat library
  firebase.initializeApp(firebaseConfig);
  console.log("Service Worker: Firebase app initialized.");

  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();
  console.log("Service Worker: Firebase Messaging initialized.");

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/egspgoi_logo_tr.png' // Ensure you have an icon at this path
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  console.log("Service Worker: Firebase initialized and background handler set up.");

} catch (error) {
    console.error("Service Worker Error:", error);
}
