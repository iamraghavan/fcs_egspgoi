
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCT1UJcwqjKdsXL-6N_7qqa3lZRdAsqoE",
  authDomain: "gitdrive-m4hfj.firebaseapp.com",
  projectId: "gitdrive-m4hfj",
  storageBucket: "gitdrive-m4hfj.firebasestorage.app",
  messagingSenderId: "471156925064",
  appId: "1:471156925064:web:0bd4f67ad521b9a3d9b53d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon-32x32.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
