import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

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
export const auth = getAuth(app);

// Connect to Firestore emulator ONLY if explicitly requested
if (typeof window !== 'undefined') {
  const useEmulator =
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
    !!import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
  if (useEmulator) {
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

// Connect to Auth emulator ONLY if explicitly requested
if (typeof window !== 'undefined') {
  const useEmulator =
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
    !!import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ||
    !!import.meta.env.VITE_AUTH_EMULATOR_HOST;
  if (useEmulator) {
    try {
      const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || import.meta.env.VITE_AUTH_EMULATOR_HOST;
      if (emulatorHost) {
        const [host, port] = emulatorHost.replace('http://', '').split(':');
        connectAuthEmulator(auth, `http://${host}:${port}`);
        console.log(`Connected to Auth emulator at ${host}:${port} (from env)`);
      } else {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('Connected to Auth emulator at localhost:9099 (default)');
      }
    } catch (err) {
      console.warn('Error connecting to Auth emulator:', err);
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
