
import { initializeApp, getApps, getApp, type FirebaseOptions } from"firebase/app";
import { getAnalytics } from"firebase/analytics";
import { getMessaging } from"firebase/messaging";
import { getPerformance } from"firebase/performance";
import { getRemoteConfig, type RemoteConfig } from"firebase/remote-config";

const firebaseConfig: FirebaseOptions = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
 measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let remoteConfig: RemoteConfig | null = null;

if (typeof window !=="undefined") {
 try {
 getPerformance(app);
 getAnalytics(app);
 
 // Initialize Remote Config
 remoteConfig = getRemoteConfig(app);
 remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour default
 
 } catch (err) {
 console.error("Failed to initialize Firebase Performance, Analytics, or Remote Config", err);
 }
}

const messaging = () => {
 if (typeof window !== 'undefined') {
 try {
 return getMessaging(app);
 } catch (err) {
 // Silently fail if not supported (e.g. non-secure context or incompatible browser)
 return null;
 }
 }
 return null;
}

export { app, messaging, remoteConfig };
