import React, { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import { getUserSettings, setUserSettings } from '../userSettings';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [ariaSound, setAriaSound] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testSignInError, setTestSignInError] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Debug output for E2E: log user state to window
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window._E2E_USER = firebaseUser;
        console.log('[E2E DEBUG] Profile user:', firebaseUser);
        // Always set firebaseUserUid in localStorage for E2E reliability
        if (window.localStorage) {
          if (firebaseUser) {
            window.localStorage.setItem('firebaseUserUid', firebaseUser.uid);
          } else {
            window.localStorage.removeItem('firebaseUserUid');
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle dark mode by adding/removing a class on body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Load user settings from Firestore
  useEffect(() => {
    if (!user) return;
    setSettingsLoaded(false); // Reset when user changes
    console.log('[DEBUG] Loading user settings for:', user.uid);
    getUserSettings(user.uid).then(settings => {
      console.log('[DEBUG] Loaded settings:', settings);
      if (!settings) {
        setSettingsLoaded(true);
        return; // null check
      }
      setDarkMode(!!settings.darkMode);
      setAriaSound(settings.ariaSound !== false);
      setHaptic(!!settings.haptic);
      setShowExplanations(settings.showExplanations !== false);
      setSettingsLoaded(true);
    });
  }, [user]);

  // Save settings to Firestore when changed, but only after settingsLoaded
  useEffect(() => {
    if (!user || !settingsLoaded) return;
    const settings = { darkMode, ariaSound, haptic, showExplanations };
    console.log('[DEBUG] Saving user settings for:', user.uid, settings);
    setUserSettings(user.uid, settings);
  }, [user, darkMode, ariaSound, haptic, showExplanations, settingsLoaded]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch {
      // Sign in failed, handle error
    }
  };
  const handleSignOut = async () => {
    await signOut(auth);
  };
  const handleReset = () => alert('Reset all user data (implement logic)');

  const handleTestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSignInError(null);
    try {
      console.log('[E2E TEST SIGNIN]', { testEmail, testPassword }); // Debug: log credentials
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('testUid', userCredential.user.uid); // Store real UID for E2E tests
        window.localStorage.setItem('firebaseUserUid', userCredential.user.uid); // Also set firebaseUserUid for E2E tests
      }
    } catch (err: any) {
      console.error('[E2E TEST SIGNIN ERROR]', err); // Debug output for E2E
      setTestSignInError(err.message || 'Sign in failed');
    }
  };

  return (
    <div style={{ textAlign: 'center' }} data-testid="profile-page" role="form">
      <h2>Profile</h2>
      <img
        src={user && user.photoURL ? user.photoURL : `${import.meta.env.BASE_URL}default_avatar.png`}
        alt="User Avatar"
        style={{ width: 120, height: 120, borderRadius: '50%', margin: '1rem auto', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      />
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>
        {user ? user.displayName : 'Guest'}
      </div>
      {user && (
        <div data-testid="profile-uid" style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          {user.email?.split('@')[0]}
        </div>
      )}
      {/* Only render settings after settingsLoaded is true */}
      {settingsLoaded ? (
        <div style={{ margin: '2rem auto', maxWidth: 340, textAlign: 'left' }}>
          <h3>Settings</h3>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} aria-label="Toggle dark mode" /> Dark Mode
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={ariaSound} onChange={e => setAriaSound(e.target.checked)} aria-label="Toggle aria sound" /> Aria Sound
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={haptic} onChange={e => setHaptic(e.target.checked)} aria-label="Toggle haptic feedback" /> Haptic Feedback
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={showExplanations} onChange={e => setShowExplanations(e.target.checked)} aria-label="Toggle show explanations" /> Show Explanations
          </label>
        </div>
      ) : (
        <div style={{ margin: '2rem auto', maxWidth: 340, textAlign: 'center' }}>
          <span>Loading settings…</span>
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        {user ? (
          <button onClick={handleSignOut} aria-label="Sign out">Sign Out</button>
        ) : (
          <button onClick={handleSignIn} aria-label="Sign in with Google">Sign In with Google</button>
        )}
        <button onClick={handleReset} style={{ marginLeft: 16 }} aria-label="Reset all user data">Reset All</button>
      </div>
      {/* Test/dev-only sign-in form */}
      {import.meta.env.DEV && !user && (
        <form onSubmit={handleTestSignIn} style={{ marginTop: 32, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto', background: '#f8f8f8', padding: 16, borderRadius: 8 }} data-testid="test-signin-form">
          <h4>Test/Dev Email Sign-In</h4>
          <input
            type="email"
            placeholder="Test Email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
            autoComplete="username"
            aria-label="Test email"
            required
            data-testid="test-signin-email"
          />
          <input
            type="password"
            placeholder="Password"
            value={testPassword}
            onChange={e => setTestPassword(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
            autoComplete="current-password"
            aria-label="Test password"
            required
            data-testid="test-signin-password"
          />
          <button type="submit" style={{ width: '100%' }} aria-label="Sign in with email" data-testid="test-signin-submit">Sign In (Test Only)</button>
          {testSignInError && <div style={{ color: 'red', marginTop: 8 }}>{testSignInError}</div>}
        </form>
      )}
    </div>
  );
};
export default Profile;
