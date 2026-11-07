// Install the click handler before Firebase's background handler.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = event.notification.data?.url ||
    event.notification.data?.FCM_MSG?.fcmOptions?.link ||
    '/u/portal/dashboard/notifications';
  let target;
  try {
    target = new URL(raw, self.location.origin);
    if (target.origin !== self.location.origin) throw new Error('External notification URL');
  } catch {
    target = new URL('/u/portal/dashboard/notifications', self.location.origin);
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => client.url === target.href);
      if (existing) return existing.focus();
      return self.clients.openWindow(target.href);
    }),
  );
});

if (typeof importScripts === 'function') {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

  const configParam = new URL(self.location.href).searchParams.get('firebaseConfig');
  if (configParam) {
    try {
      const config = JSON.parse(configParam);
      if (!firebase.apps.length) firebase.initializeApp(config);
      firebase.messaging().onBackgroundMessage((payload) => {
        // Firebase shows notification payloads automatically in the background.
        if (payload.notification) return;
        const title = payload.data?.title || 'CreditWise';
        const body = payload.data?.body || 'You have a new notification.';
        const url = payload.data?.url || '/u/portal/dashboard/notifications';
        return self.registration.showNotification(title, { body, data: { url } });
      });
    } catch (error) {
      console.error('Firebase messaging service worker setup failed:', error);
    }
  }
}
