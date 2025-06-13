import React from 'react';
import './AppHeader.css';
import { getBaseUrl } from '../utils/getBaseUrl';

const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <img src={`${getBaseUrl()}icon-512x512.png`} alt="App Icon" className="app-header__icon" />
      <div className="app-header__titles">
        <span className="app-header__title-bold">Massage Therapy</span>
        <span className="app-header__title-regular">Smart Study PRO</span>
      </div>
    </header>
  );
};

export default AppHeader;
