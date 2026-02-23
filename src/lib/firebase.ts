
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getPerformance } from "firebase/performance";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== "undefined") {
    try {
        getPerformance(app);
    } catch (err) {
        console.error("Failed to initialize Firebase Performance", err);
    }
}

const messaging = () => {
    if (typeof window !== 'undefined') {
        try {
            return getMessaging(app);
        } catch (err) {
            console.error("Failed to initialize Firebase Messaging", err);
            return null;
        }
    }
    return null;
}

export { app, messaging };
