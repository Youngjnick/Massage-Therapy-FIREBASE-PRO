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

  React.useEffect(() => {
    logEvent('app_loaded');
  }, [logEvent]);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <RouteDebug />
      <AppHeader />
      <NavBar />
      <main className="main-content" role="main">
        <Routes>
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/quiz" replace />} />
        </Routes>
      </main>
      <AppFooter />
    </Router>
  );
};

export default App;
