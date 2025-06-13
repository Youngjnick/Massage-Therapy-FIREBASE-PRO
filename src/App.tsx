import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import NavBar from './components/NavBar';
import Quiz from './pages/Quiz';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AppFooter from './components/AppFooter';
import './App.css';

const App: React.FC = () => (
  <Router>
    <AppHeader />
    <NavBar />
    <div className="main-content">
      <Routes>
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/quiz" replace />} />
      </Routes>
    </div>
    <AppFooter />
  </Router>
);

export default App;
