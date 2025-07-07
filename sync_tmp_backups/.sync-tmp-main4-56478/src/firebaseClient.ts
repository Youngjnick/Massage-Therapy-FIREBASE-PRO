// src/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANzEDUkGjM0M6L6dwZd1-TaOy1olo_6OM",
  authDomain: "massage-therapy-smart-st-c7f8f.firebaseapp.com",
  projectId: "massage-therapy-smart-st-c7f8f",
  storageBucket: "massage-therapy-smart-st-c7f8f.firebasestorage.app",
  messagingSenderId: "278320425266",
  appId: "1:278320425266:web:e9c93be0473651351ccf2b",
  measurementId: "G-SWVWKNWDD3"
};

// Prevent re-initialization in hot-reload/dev
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log('[DEBUG] import.meta.env:', import.meta.env);

// Accept emulator in dev, test, or if VITE_FIRESTORE_EMULATOR_HOST is set
const shouldUseEmulator =
  typeof window !== 'undefined' &&
  (
    import.meta.env.MODE === 'development' ||
    import.meta.env.MODE === 'test' ||
    !!import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
  ) &&
  import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;

if (shouldUseEmulator) {
  const [host, port] = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST.split(':');
  console.log('[DEBUG] Attempting to connect to Firestore emulator:', host, port);
  connectFirestoreEmulator(db, host, Number(port));
  console.log(`[DEBUG] Connected to Firestore emulator at ${host}:${port}`);
} else {
  console.log('[DEBUG] Not connecting to Firestore emulator. Env:', {
    mode: import.meta.env.MODE,
    emulatorHost: import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
  });
}
