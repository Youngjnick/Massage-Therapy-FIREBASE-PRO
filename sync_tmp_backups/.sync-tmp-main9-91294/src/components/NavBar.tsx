import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar: React.FC = () => (
  <nav className="navbar" role="navigation" aria-label="Main navigation">
    <ul>
      <li><Link to="/quiz" aria-label="Go to Quiz page" role="link">Quiz</Link></li>
      <li><Link to="/achievements" aria-label="Go to Achievements page" role="link">Achievements</Link></li>
      <li><Link to="/analytics" aria-label="Go to Analytics page" role="link">Analytics</Link></li>
      <li><Link to="/profile" aria-label="Go to Profile page" role="link">Profile</Link></li>
    </ul>
  </nav>
);

export default NavBar;
