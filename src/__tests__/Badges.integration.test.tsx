import React from 'react';
import { render, screen } from '@testing-library/react';
import * as badgesApi from '../badges';
import Achievements from '../pages/Achievements';

jest.mock('../badges');

const mockBadges = [
  { id: 'first_quiz', name: 'First Quiz', description: 'Complete your first quiz', criteria: 'first_quiz', awarded: true },
  { id: 'accuracy_100', name: 'Accuracy 100%', description: 'Get 100% on a quiz', criteria: 'accuracy_100', awarded: false },
];


describe('Badges/Achievements integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (badgesApi.getBadges as jest.Mock).mockResolvedValue(mockBadges);
  });

  it('displays all badges (awarded and not awarded)', async () => {
    render(<Achievements />);
    for (const badge of mockBadges) {
      expect(await screen.findByText(badge.name)).toBeInTheDocument();
    }
  });

  it('shows awarded badges visually distinct', async () => {
    render(<Achievements />);
    const awarded = await screen.findByTestId('badge-awarded');
    expect(awarded).toHaveStyle('opacity: 1');
    const notAwarded = await screen.findByTestId('badge-unawarded');
    expect(notAwarded).toHaveStyle('opacity: 0.5');
  });
});
