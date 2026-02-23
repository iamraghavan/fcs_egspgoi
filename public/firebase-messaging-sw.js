/* public/firebase-messaging-sw.js */
if (typeof importScripts === 'function') {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });

  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

  const urlParams = new URLSearchParams(self.location.search);
  const firebaseConfig = {
    apiKey: urlParams.get('apiKey'),
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId'),
  };

  if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.error("Firebase config not found in service worker. Cannot initialize.");
  }
}
