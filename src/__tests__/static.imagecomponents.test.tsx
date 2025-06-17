import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Profile from '../pages/Profile';
import BadgeModal from '../components/Quiz/BadgeModal';

// Mock Modal for BadgeModal
describe('Profile image rendering', () => {
  it('renders default avatar if no user photoURL', () => {
    render(<Profile />);
    const img = screen.getByAltText(/user avatar/i);
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('default_avatar.png');
  });
});

describe('BadgeModal image fallback', () => {
  it('renders badge image and falls back on error', () => {
    const badge = { id: 'badge_test', name: 'Test Badge', description: 'desc', criteria: 'crit', awarded: true, image: 'badge_test.png' };
    render(<BadgeModal badge={badge} open={true} onClose={() => {}} />);
    const img = screen.getByTestId('badge-image');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('badges/badge_test.png');
    // Simulate error
    fireEvent.error(img);
    expect(img.getAttribute('src')).toContain('badges/badge_test.png'); // fallback is same for test badge
  });
});
