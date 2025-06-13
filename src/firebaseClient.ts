// src/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
