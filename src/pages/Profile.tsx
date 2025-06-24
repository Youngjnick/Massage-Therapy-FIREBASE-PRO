import React, { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Debug output for E2E: log user state to window
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window._E2E_USER = firebaseUser;
        console.log('[E2E DEBUG] Profile user:', firebaseUser);
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
    getUserSettings(user.uid).then(settings => {
      if (!settings) return; // null check
      setDarkMode(!!settings.darkMode);
      setAriaSound(settings.ariaSound !== false);
      setHaptic(!!settings.haptic);
      setShowExplanations(settings.showExplanations !== false);
    });
  }, [user]);

  // Save settings to Firestore when changed
  useEffect(() => {
    if (!user) return;
    setUserSettings(user.uid, {
      darkMode,
      ariaSound,
      haptic,
      showExplanations,
    });
  }, [user, darkMode, ariaSound, haptic, showExplanations]);

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

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Profile</h2>
      <img
        src={user && user.photoURL ? user.photoURL : `${import.meta.env.BASE_URL}default_avatar.png`}
        alt="User Avatar"
        style={{ width: 120, height: 120, borderRadius: '50%', margin: '1rem auto', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      />
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>
        {user ? user.displayName : 'Guest'}
      </div>
      <div style={{ margin: '2rem auto', maxWidth: 340, textAlign: 'left' }}>
        <h3>Settings</h3>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} /> Dark Mode
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={ariaSound} onChange={e => setAriaSound(e.target.checked)} /> Aria Sound
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={haptic} onChange={e => setHaptic(e.target.checked)} /> Haptic Feedback
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={showExplanations} onChange={e => setShowExplanations(e.target.checked)} /> Show Explanations
        </label>
      </div>
      <div style={{ marginTop: 32 }}>
        {user ? (
          <button onClick={handleSignOut}>Sign Out</button>
        ) : (
          <button onClick={handleSignIn}>Sign In with Google</button>
        )}
        <button onClick={handleReset} style={{ marginLeft: 16 }}>Reset All</button>
      </div>
    </div>
  );
};
export default Profile;
