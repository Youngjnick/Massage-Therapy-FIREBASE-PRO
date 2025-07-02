import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyANzEDUkGjM0M6L6dwZd1-TaOy1olo_6OM",
  authDomain: "massage-therapy-smart-st-c7f8f.firebaseapp.com",
  projectId: "massage-therapy-smart-st-c7f8f",
  storageBucket: "massage-therapy-smart-st-c7f8f.appspot.com",
  messagingSenderId: "278320425266",
  appId: "1:278320425266:web:e9c93be0473651351ccf2b",
  measurementId: "G-SWVWKNWDD3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Connect to Firestore emulator in E2E/dev
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isE2E = window.location.search.includes('e2e=1');
  if (isLocalhost || isE2E) {
    // Use VITE_FIRESTORE_EMULATOR_HOST if set, else default to localhost:8080
    try {
      const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
      if (emulatorHost) {
        const [host, port] = emulatorHost.split(':');
        connectFirestoreEmulator(db, host, Number(port));
        console.log(`Connected to Firestore emulator at ${host}:${port} (from env)`);
      } else {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator at localhost:8080 (default)');
      }
    } catch (err) {
      // Ignore errors when connecting to Firestore emulator (may already be connected)
      console.warn('Error connecting to Firestore emulator:', err);
    }
  }
}

// Initialize analytics only if supported (browser, not SSR)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, firebaseLogEvent, firebaseConfig };
