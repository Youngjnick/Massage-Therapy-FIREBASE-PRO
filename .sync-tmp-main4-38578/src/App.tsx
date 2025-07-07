import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import NavBar from './components/NavBar';
import Quiz from './pages/Quiz';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AppFooter from './components/AppFooter';
import './App.css';
import { useAnalytics } from './hooks/useAnalytics';
import LandingPage from './pages/LandingPage';

// Debug component to log routing info
function RouteDebug() {
  const location = useLocation();
  React.useEffect(() => {
     
    console.log('[DEBUG][Router] location.pathname:', location.pathname, 'basename:', import.meta.env.BASE_URL);
  }, [location]);
  return null;
}


const App: React.FC = () => {
  const { logEvent } = useAnalytics();
  // Simulate user/Firebase loading state
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    logEvent('app_loaded');
    // Simulate async Firebase/user init (replace with real logic if available)
    const timer = setTimeout(() => setLoading(false), 600); // 600ms for demo
    return () => clearTimeout(timer);
  }, [logEvent]);

  if (loading) {
    return (
      <div className="app-loading-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div>
          <div className="spinner" style={{ margin: '0 auto', width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 16, color: '#888', fontSize: 18 }}>Loading…</div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      {import.meta.env.DEV && <RouteDebug />}
      <AppHeader />
      <NavBar />
      <main className="main-content" role="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AppFooter />
    </Router>
  );
};

export default App;
