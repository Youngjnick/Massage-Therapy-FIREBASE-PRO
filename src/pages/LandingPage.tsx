import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function isAuthEmulator() {
  // Check for emulator via environment or window location
  if (typeof window !== 'undefined') {
    // Vite env var
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') return true;
    // Only treat port 9099 as emulator
    if (window.location.port === '9099') return true;
  }
  // Fallback for Node/test
  if (typeof process !== 'undefined' && process.env.VITE_USE_FIREBASE_EMULATOR === 'true') return true;
  return false;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthEmulator()) {
      // In emulator mode, go to /profile for test/dev sign-in
      navigate('/profile');
      return;
    }
    try {
      await signInWithPopup(auth, provider);
      navigate('/profile');
    } catch {
      // Optionally show error
    }
  };

  return (
    <div className="glass-card" style={{ margin: '2rem auto', maxWidth: 700, textAlign: 'center' }}>
      <img
        src={`${import.meta.env.BASE_URL}icon-512x512.png`}
        alt="Massage Therapy Pro Logo"
        style={{ width: 96, height: 96, marginBottom: 24, borderRadius: '50%', boxShadow: '0 2px 16px rgba(30,60,40,0.12)' }}
      />
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#eafff2', marginBottom: 8, letterSpacing: '0.01em' }}>
        Welcome to <span style={{ color: '#6ee7b7' }}>Massage Therapy Pro</span>
      </h1>
      <p style={{ fontSize: '1.18rem', color: '#eafff2cc', margin: '0 auto 1.5rem', maxWidth: 520 }}>
        Your interactive platform for learning, practicing, and tracking your progress in massage therapy. Get started by signing in or exploring our quizzes and resources.
      </p>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        <button
          className="main-btn"
          style={{
            padding: '0.85rem 2.2rem',
            background: 'linear-gradient(90deg, #3b82f6 60%, #6ee7b7 100%)',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
            transition: 'background 0.2s',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={handleSignIn}
          aria-label="Sign in with Google"
        >
          Sign In with Google
        </button>
        <a href="/quiz" className="main-btn" style={{
          padding: '0.85rem 2.2rem',
          background: 'linear-gradient(90deg, #00b894 60%, #3b82f6 100%)',
          color: '#fff',
          borderRadius: 10,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '1.1rem',
          boxShadow: '0 2px 8px rgba(0,184,148,0.08)',
          transition: 'background 0.2s',
        }}>Explore Quizzes</a>
      </div>
    </div>
  );
};

export default LandingPage;
