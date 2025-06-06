import React from 'react';
import { render, screen } from '@testing-library/react';
import BadgeCard from '../BadgeCard';

describe('BadgeCard', () => {
  test('renders BadgeCard component', () => {
    render(<BadgeCard badge={{ id: 'b1', name: 'Test Badge', earned: true }} />);
    const badgeElement = screen.getByTestId('badge-earned-b1');
    expect(badgeElement).toBeInTheDocument();
  });

  test('placeholder', () => {
    expect(true).toBe(true);
  });
});