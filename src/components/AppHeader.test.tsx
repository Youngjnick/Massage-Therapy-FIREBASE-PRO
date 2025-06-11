import React from 'react';
import { render, screen } from '@testing-library/react';
import AppHeader from './AppHeader';
jest.mock('../utils/baseUrl', () => ({ BASE_URL: '/' }));

describe('AppHeader', () => {
  it('renders the app icon with correct alt text', () => {
    render(<AppHeader />);
    const icon = screen.getByAltText('App Icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('app-header__icon');
  });

  it('renders the bold and regular titles', () => {
    render(<AppHeader />);
    expect(screen.getByText('Massage Therapy')).toHaveClass('app-header__title-bold');
    expect(screen.getByText('Smart Study PRO')).toHaveClass('app-header__title-regular');
  });

  it('has a header role for accessibility', () => {
    render(<AppHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
