import React from 'react';
import { render } from '@testing-library/react';
import BadgeCard from '../BadgeCard';

describe('BadgeCard', () => {
  test('renders correctly', () => {
    const { getAllByText } = render(<BadgeCard badge={{ id: 'b1', name: 'Test Badge', earned: true }} />);
    const badgeNameElements = getAllByText('Test Badge', { selector: '.badgeName' });
    expect(badgeNameElements.length).toBe(1);
  });

  test('placeholder', () => {
    expect(true).toBe(true);
  });
});