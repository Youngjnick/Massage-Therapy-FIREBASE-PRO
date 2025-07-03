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

const featureList = [
  {
    icon: '📝',
    title: 'Practice Quizzes',
    desc: 'Test your knowledge with interactive quizzes and instant feedback.'
  },
  {
    icon: '📈',
    title: 'Track Progress',
    desc: 'See your stats, streaks, and improvement over time.'
  },
  {
    icon: '🏆',
    title: 'Earn Achievements',
    desc: 'Unlock badges and celebrate your learning milestones.'
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const mainBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    // Focus the main sign-in button on mount for keyboard users
    if (mainBtnRef.current) {
      mainBtnRef.current.focus();
    }
  }, []);

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthEmulator()) {
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
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c28 0%, #2e7d4f 100%)',
      overflow: 'hidden',
      padding: 0
    }}>
      {/* Animated SVG background blob */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          zIndex: 0,
          opacity: 0.18,
          pointerEvents: 'none',
        }}
        width="600"
        height="600"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="300"
          cy="300"
          rx="300"
          ry="220"
          fill="#6ee7b7"
          style={{
            transformOrigin: 'center',
            animation: 'blobMorph 8s ease-in-out infinite alternate',
          }}
        />
        <style>{`
          @keyframes blobMorph {
            0% { rx: 300; ry: 220; }
            40% { rx: 320; ry: 210; }
            60% { rx: 280; ry: 240; }
            100% { rx: 300; ry: 220; }
          }
        `}</style>
      </svg>
      <div
        className="glass-card"
        style={{
          margin: '3.5rem auto 2rem',
          maxWidth: 700,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: '90vw',
          minWidth: 0,
          padding: '1.2rem 1.1rem',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}icon-512x512.png`}
          alt="Massage Therapy Pro app icon"
          style={{ width: 96, height: 96, marginBottom: 18, borderRadius: '50%', boxShadow: '0 2px 16px rgba(30,60,40,0.12)' }}
        />
        <h1 style={{ fontSize: '2.3rem', fontWeight: 700, color: '#eafff2', marginBottom: 6, letterSpacing: '0.01em' }}>
          Welcome to <span style={{ color: '#6ee7b7' }}>Massage Therapy Pro</span>
        </h1>
        <div style={{ fontSize: '1.18rem', color: '#eafff2cc', margin: '0 auto 1.2rem', maxWidth: 520, fontWeight: 500 }}>
          Ace your massage therapy exams.<br />Practice, track, and succeed.
        </div>
        <p style={{ fontSize: '1.08rem', color: '#eafff2b0', margin: '0 auto 1.5rem', maxWidth: 520 }}>
          Your interactive platform for learning, practicing, and tracking your progress in massage therapy. Get started by signing in or exploring our quizzes and resources.
        </p>
        {/* Onboarding tip */}
        <div style={{ background: 'rgba(110,231,183,0.13)', color: '#1e3c28', borderRadius: 8, padding: '0.7rem 1.2rem', margin: '0 auto 1.2rem', maxWidth: 420, fontSize: '1rem', fontWeight: 500 }}>
          <span role="img" aria-label="Lightbulb" style={{ marginRight: 8 }}>💡</span>
          Tip: You can try quizzes without signing in, but signing in lets you track your progress and earn achievements!
        </div>
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <button
            ref={mainBtnRef}
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
              transition: 'background 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1)',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
              maxWidth: 320,
              marginBottom: 10,
            }}
            onClick={handleSignIn}
            aria-label="Sign in with Google"
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Sign In with Google
          </button>
          <a
            href="/quiz"
            className="main-btn"
            style={{
              padding: '0.85rem 2.2rem',
              background: 'linear-gradient(90deg, #00b894 60%, #3b82f6 100%)',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(0,184,148,0.08)',
              transition: 'background 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1)',
              outline: 'none',
              width: '100%',
              maxWidth: 320,
              marginBottom: 10,
              display: 'inline-block',
              textAlign: 'center',
            }}
            tabIndex={0}
            aria-label="Explore quizzes"
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Explore Quizzes
          </a>
        </div>
        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 36,
          flexWrap: 'wrap',
        }}>
          {featureList.map((f, i) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 14,
                padding: '1.1rem 1.3rem',
                minWidth: 140,
                maxWidth: 220,
                margin: '0.5rem 0',
                boxShadow: '0 2px 12px rgba(30,60,40,0.08)',
                textAlign: 'center',
                color: '#eafff2',
                fontWeight: 500,
                fontSize: '1.04rem',
                border: '1.5px solid #6ee7b7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flex: '1 1 120px',
                boxSizing: 'border-box',
                opacity: 0,
                transform: 'translateY(24px)',
                animation: `fadeInUp 0.7s ${0.15 + i * 0.13}s cubic-bezier(.4,2,.6,1) forwards`,
              }}
            >
              <span style={{ fontSize: '2.1rem', marginBottom: 4 }} aria-hidden="true">
                {f.icon}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.08rem',
                  color: '#6ee7b7',
                  marginBottom: 2,
                  wordBreak: 'break-word',
                }}
              >
                {f.title}
              </span>
              <span style={{ fontSize: '0.98rem', color: '#eafff2cc', lineHeight: 1.3 }}>{f.desc}</span>
            </div>
          ))}
          <style>{`
            @keyframes fadeInUp {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
        <footer style={{ marginTop: 40, color: '#eafff2a0', fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Massage Therapy Pro &mdash; All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
