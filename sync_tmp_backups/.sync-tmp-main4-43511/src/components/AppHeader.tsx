import React from 'react';
import './AppHeader.css';

const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <img src={`${import.meta.env.BASE_URL}icon-512x512.png`} alt="App Icon" className="app-header__icon" />
      <div className="app-header__titles">
        <span className="app-header__title-bold">Massage Therapy</span>
        <span className="app-header__title-regular">Smart Study PRO</span>
      </div>
    </header>
  );
};

export default AppHeader;
