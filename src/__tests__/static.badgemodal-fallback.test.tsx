import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BadgeModal from '../components/Quiz/BadgeModal';

describe('BadgeModal fallback image', () => {
  it('renders fallback image on error', () => {
    const badge = { id: 'nonexistent_badge', name: 'Missing Badge', description: 'desc', criteria: 'crit', awarded: false, image: 'nonexistent_badge.png' };
    render(<BadgeModal badge={badge} open={true} onClose={() => {}} />);
    const img = screen.getByTestId('badge-image');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('badges/nonexistent_badge.png');
    // Simulate error
    fireEvent.error(img);
    // Should fallback to badge_test.png
    expect(img.src).toContain('badges/badge_test.png');
  });
});
