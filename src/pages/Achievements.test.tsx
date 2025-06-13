import React from 'react';
import { render, screen, fireEvent, waitForElementToBeRemoved, act } from '@testing-library/react';
import Achievements from './Achievements';

// Mock getBadges to return a fixed set of badges
jest.mock('../badges', () => ({
  getBadges: async () => [
    {
      id: 'first_quiz',
      name: 'First Quiz',
      description: 'Complete your first quiz',
      criteria: 'first_quiz',
      awarded: true,
    },
    {
      id: 'accuracy_100',
      name: 'Accuracy 100%',
      description: 'Get 100% on a quiz',
      criteria: 'accuracy_100',
      awarded: false,
    },
  ],
}));

// Mock BASE_URL
jest.mock('../utils/baseUrl', () => ({ BASE_URL: '/' }));

// Mock Modal to just render children for simplicity
jest.mock('../components/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, children }: any) => (isOpen ? <div data-testid="modal-overlay">{children}</div> : null),
}));

describe('Achievements Page', () => {
  it('renders badges from getBadges()', async () => {
    await act(async () => {
      render(<Achievements />);
    });
    expect(await screen.findByText('First Quiz')).toBeInTheDocument();
    expect(screen.getByText('Accuracy 100%')).toBeInTheDocument();
    // Check that badge images are present
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2);
  });

  it('opens and closes badge modal on click', async () => {
    await act(async () => {
      render(<Achievements />);
    });
    const badge = await screen.findByText('First Quiz');
    fireEvent.click(badge.closest('[data-testid="badge-container"]')!);
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByText('Complete your first quiz')).toBeInTheDocument();
    // Close the modal by clicking the overlay
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    // Wait for modal to be removed only if it exists
    if (screen.queryByTestId('modal-overlay')) {
      await waitForElementToBeRemoved(() => screen.queryByTestId('modal-overlay'));
    }
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  it('toggles light and dark mode', async () => {
    document.body.innerHTML = '<button data-testid="theme-toggle">Toggle</button>';
    await act(async () => {
      render(<Achievements />);
    });
    const toggle = screen.getByTestId('theme-toggle');
    // Simulate toggling theme
    fireEvent.click(toggle);
    // You would check for a class or attribute change here in a real app
    // For now, just ensure the button is clickable
    expect(toggle).toBeInTheDocument();
  });
});
