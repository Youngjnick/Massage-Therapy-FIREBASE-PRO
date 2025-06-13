import React, { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import { getUserSettings, setUserSettings, UserSettings } from '../userSettings';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const defaultSettings: UserSettings = {
  darkMode: false,
  ariaSound: true,
  haptic: false,
  showExplanations: true,
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        getUserSettings(firebaseUser.uid).then((s) => {
          if (s) setSettings(s);
        });
      } else {
        setSettings(defaultSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', settings.darkMode);
  }, [settings.darkMode]);

  const handleSignIn = async () => {
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    if (!user) {
      setSettings({ ...settings, [key]: value });
      return;
    }
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setUserSettings(user.uid, newSettings);
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '2rem auto', padding: 0 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Profile</h1>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, justifyContent: 'center' }}>
        <img
          src={user?.photoURL || '/default_avatar.png'}
          alt="avatar"
          style={{ width: 80, height: 80, borderRadius: '50%', marginRight: 24 }}
        />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{user?.displayName || 'Guest'}</div>
          <div style={{ color: '#666', fontSize: 16 }}>{user?.email || 'Not signed in'}</div>
        </div>
      </div>
      {user ? (
        <button onClick={handleSignOut} style={{ display: 'block', margin: '0 auto 24px auto' }}>Sign Out</button>
      ) : (
        <button onClick={handleSignIn} style={{ display: 'block', margin: '0 auto 24px auto' }}>Sign in with Google</button>
      )}
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 18 }}>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={e => handleSettingChange('darkMode', e.target.checked)}
          />
          Dark Mode
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 18 }}>
          <input
            type="checkbox"
            checked={settings.ariaSound}
            onChange={e => handleSettingChange('ariaSound', e.target.checked)}
          />
          Aria Sound
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 18 }}>
          <input
            type="checkbox"
            checked={settings.haptic}
            onChange={e => handleSettingChange('haptic', e.target.checked)}
          />
          Haptic Feedback
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 18 }}>
          <input
            type="checkbox"
            checked={settings.showExplanations}
            onChange={e => handleSettingChange('showExplanations', e.target.checked)}
          />
          Show Explanations
        </label>
      </div>
    </div>
  );
};

export default Profile;
