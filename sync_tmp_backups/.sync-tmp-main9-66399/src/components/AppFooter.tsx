import React from 'react';
import './AppFooter.css';

const AppFooter: React.FC = () => (
  <footer className="app-footer">
    <input
      className="question-search-bar"
      type="text"
      placeholder="Search questions..."
      aria-label="Search questions"
    />
  </footer>
);

export default AppFooter;
