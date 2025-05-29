import { auth } from "../firebase/indexFirebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return signOut(auth);
}

export function observeAuthState(callback) {
  onAuthStateChanged(auth, callback);
}

export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Signed in
    return userCredential.user;
  } catch (error) {
    console.error("Sign-in error:", error);
    throw error;
  }
}

// --- PHONE AUTH ---
export function setupRecaptcha(containerId, callback) {
  window.recaptchaVerifier = new RecaptchaVerifier(containerId, {
    size: 'invisible',
    callback: callback,
  }, auth);
}

export async function signInWithPhone(phoneNumber, appVerifier) {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Phone sign-in error:", error);
    throw error;
  }
}
// To complete sign-in, call confirmationResult.confirm(code)

// --- E2E TEST HOOK: Mock Firebase Auth user for Playwright E2E tests ---
if (typeof window !== 'undefined' && localStorage.getItem('e2e-mock-auth')) {
  // Only run in browser and if test key is set
  const mockUser = {
    uid: 'e2e-test-user',
    displayName: 'E2E Test User',
    email: 'e2e-test@example.com',
    photoURL: '/default-avatar.png',
    emailVerified: true,
    isAnonymous: false,
    providerData: [{
      providerId: 'google.com',
      uid: 'e2e-test-user',
      displayName: 'E2E Test User',
      email: 'e2e-test@example.com',
      photoURL: '/default-avatar.png',
    }],
    getIdToken: async () => 'e2e-mock-token',
  };
  // Patch auth.currentUser and fire onAuthStateChanged
  Object.defineProperty(auth, 'currentUser', {
    get: () => mockUser,
    configurable: true,
  });
  setTimeout(() => {
    // Fire onAuthStateChanged listeners with mock user
    onAuthStateChanged(auth, (cb) => cb && cb(mockUser));
    // Defensive: also fire any listeners already attached
    if (auth._onAuthStateChanged) {
      auth._onAuthStateChanged.forEach(cb => cb && cb(mockUser));
    }
    window.__E2E_TEST__ = true;
    console.log('[E2E] Mock Firebase Auth user injected for E2E test');
  }, 0);
}