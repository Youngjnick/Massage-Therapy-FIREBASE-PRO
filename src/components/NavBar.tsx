import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar: React.FC = () => (
  <nav className="navbar">
    <ul>
      <li><Link to="/quiz">Quiz</Link></li>
      <li><Link to="/achievements">Achievements</Link></li>
      <li><Link to="/analytics">Analytics</Link></li>
      <li><Link to="/profile">Profile</Link></li>
    </ul>
  </nav>
);

export default NavBar;
