import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBar from './NavBar';

describe('NavBar', () => {
  it('renders all navigation links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('links have correct hrefs', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Quiz').closest('a')).toHaveAttribute('href', '/quiz');
    expect(screen.getByText('Achievements').closest('a')).toHaveAttribute('href', '/achievements');
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics');
    expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile');
  });

  it('is accessible by role', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('allows keyboard navigation between links', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    const links = screen.getAllByRole('link');
    links[0].focus();
    expect(links[0]).toHaveFocus();
    await user.tab();
    expect(links[1]).toHaveFocus();
    await user.tab();
    expect(links[2]).toHaveFocus();
    await user.tab();
    expect(links[3]).toHaveFocus();
  });
});
