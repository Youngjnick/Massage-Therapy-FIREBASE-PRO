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
  const [showTip, setShowTip] = React.useState(false);

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
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden', zIndex: 1000 }} className="skip-link">
        Skip to main content
      </a>
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
            animation: 'blobScale 7s cubic-bezier(.4,2,.6,1) infinite alternate, blobColor 12s cubic-bezier(.4,2,.6,1) infinite alternate, blobRotate 18s linear infinite',
            filter: 'blur(0px) drop-shadow(0 0 32px #6ee7b7aa)',
          }}
        />
        <style>{`
          @keyframes blobScale {
            0% { transform: scaleX(1) scaleY(1); }
            20% { transform: scaleX(1.12) scaleY(0.93); }
            40% { transform: scaleX(0.92) scaleY(1.13); }
            60% { transform: scaleX(1.08) scaleY(0.98); }
            80% { transform: scaleX(0.97) scaleY(1.09); }
            100% { transform: scaleX(1) scaleY(1); }
          }
          @keyframes blobColor {
            0% { fill: #6ee7b7; }
            25% { fill: #3b82f6; }
            50% { fill: #a5b4fc; }
            75% { fill: #3b82f6; }
            100% { fill: #6ee7b7; }
          }
          @keyframes blobRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </svg>
      <div
        id="main-content"
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
          opacity: 0,
          transform: 'translateY(32px)',
          animation: 'fadeInCard 1.1s cubic-bezier(.4,2,.6,1) 0.2s forwards',
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
              transition: 'background 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
              maxWidth: 320,
              marginBottom: 10,
            }}
            onClick={handleSignIn}
            aria-label="Sign in with Google"
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
              transition: 'background 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)',
              outline: 'none',
              width: '100%',
              maxWidth: 320,
              marginBottom: 10,
              display: 'inline-block',
              textAlign: 'center',
            }}
            aria-label="Explore quizzes"
            onClick={e => { e.preventDefault(); setShowTip(true); navigate('/quiz'); }}
          >
            Explore Quizzes
          </a>
        </div>
        {/* Onboarding tip */}
        {showTip && (
          <div style={{ background: 'rgba(110,231,183,0.13)', color: '#1e3c28', borderRadius: 8, padding: '0.7rem 1.2rem', margin: '0 auto 1.2rem', maxWidth: 420, fontSize: '1rem', fontWeight: 500 }}>
            <span role="img" aria-label="Lightbulb" style={{ marginRight: 8 }}>💡</span>
            Tip: You can try quizzes without signing in, but signing in lets you track your progress and earn achievements!
          </div>
        )}
        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 36,
          flexWrap: 'wrap',
        }}>
          {featureList.map((f, i) => {
            // Map feature to route
            let route = '/';
            if (f.title === 'Practice Quizzes') route = '/quiz';
            else if (f.title === 'Track Progress') route = '/analytics';
            else if (f.title === 'Earn Achievements') route = '/achievements';
            return (
              <button
                key={f.title}
                type="button"
                className="feature-card"
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
                  border: '1.5px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  flex: '1 1 120px',
                  boxSizing: 'border-box',
                  opacity: 0,
                  transform: 'translateY(24px)',
                  animation: `fadeInUp 0.7s ${0.15 + i * 0.13}s cubic-bezier(.4,2,.6,1) forwards, floatCard 4.2s ${(i * 0.7).toFixed(2)}s ease-in-out infinite alternate`,
                  cursor: 'pointer',
                  transition: 'transform 0.22s cubic-bezier(.4,2,.6,1), box-shadow 0.22s cubic-bezier(.4,2,.6,1), border 0.4s',
                  outline: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                aria-label={f.title + ' (click to view)'}
                onClick={e => {
                  // Ripple effect
                  const card = e.currentTarget;
                  const ripple = document.createElement('span');
                  ripple.className = 'ripple';
                  const rect = card.getBoundingClientRect();
                  ripple.style.left = `${e.clientX - rect.left}px`;
                  ripple.style.top = `${e.clientY - rect.top}px`;
                  card.appendChild(ripple);
                  setTimeout(() => ripple.remove(), 600);
                  navigate(route);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(route);
                  }
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
                {/* Animated border gradient overlay */}
                <span className="feature-card-border" aria-hidden="true" />
              </button>
            );
          })}
          <style>{`
            @keyframes fadeInUp {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeInCard {
              from {
                opacity: 0;
                transform: translateY(32px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes floatCard {
              0% { transform: translateY(0); }
              50% { transform: translateY(-8px) scale(1.03); }
              100% { transform: translateY(0); }
            }
            .feature-card {
              position: relative;
              z-index: 1;
            }
            .feature-card-border {
              pointer-events: none;
              content: '';
              position: absolute;
              inset: -2px;
              border-radius: 16px;
              z-index: 2;
              border: 2.5px solid transparent;
              background: linear-gradient(120deg, #6ee7b7, #3b82f6, #a5b4fc, #6ee7b7 90%);
              background-size: 300% 300%;
              animation: borderMove 3.5s linear infinite;
              opacity: 0.7;
              filter: blur(1.2px);
              transition: opacity 0.2s;
            }
            @keyframes borderMove {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .feature-card:hover .feature-card-border,
            .feature-card:focus-visible .feature-card-border {
              opacity: 1;
              filter: blur(0.2px) drop-shadow(0 0 8px #6ee7b7cc);
            }
            .feature-card:hover, .feature-card:focus-visible {
              transform: scale(1.08) translateY(-4px) !important;
              box-shadow: 0 6px 32px 0 #6ee7b7cc, 0 2px 12px rgba(30,60,40,0.13);
              z-index: 2;
              border-color: #6ee7b7;
            }
            .feature-card:active {
              transform: scale(0.97) translateY(1px) !important;
              box-shadow: 0 2px 8px 0 #6ee7b788, 0 2px 8px rgba(30,60,40,0.10);
            }
            /* Ripple effect */
            .ripple {
              position: absolute;
              border-radius: 50%;
              transform: scale(0);
              animation: ripple 0.6s linear;
              background: rgba(110,231,183,0.25);
              pointer-events: none;
              z-index: 3;
              width: 120px;
              height: 120px;
              opacity: 0.7;
            }
            @keyframes ripple {
              to {
                transform: scale(2.5);
                opacity: 0;
              }
            }
            .main-btn {
              transition: background 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1);
              will-change: transform;
              outline: none;
            }
            .main-btn:hover, .main-btn:focus-visible {
              transform: scale(1.08);
              box-shadow: 0 0 0 3px #6ee7b7cc, 0 6px 32px 0 #6ee7b7cc, 0 2px 12px rgba(30,60,40,0.13);
              z-index: 2;
            }
            .main-btn:active {
              transform: scale(0.97);
            }
          `}</style>
        </div>
        <footer style={{ marginTop: 40, color: '#eafff2a0', fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Massage Therapy Pro &mdash; All rights reserved.
          {/* Add nav bar after footer for tab loop */}
          <nav style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 32 }} aria-label="Footer navigation">
            <a href="/about" className="footer-nav-link" style={{ color: '#6ee7b7', textDecoration: 'underline', fontWeight: 500, fontSize: 16 }}>About</a>
            <a href="/privacy" className="footer-nav-link" style={{ color: '#6ee7b7', textDecoration: 'underline', fontWeight: 500, fontSize: 16 }}>Privacy</a>
            <a href="/contact" className="footer-nav-link" style={{ color: '#6ee7b7', textDecoration: 'underline', fontWeight: 500, fontSize: 16 }}>Contact</a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
