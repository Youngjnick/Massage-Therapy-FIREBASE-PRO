import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BadgeModal from './BadgeModal';
import type { Badge } from '../../badges';

describe('BadgeModal', () => {
  const badge: Badge = {
    id: 'test_badge',
    name: 'Test Badge',
    description: 'A badge for testing',
    criteria: 'Do something great',
    image: 'test_badge.png',
    awarded: true,
  };

  it('renders badge details when open', () => {
    render(<BadgeModal badge={badge} open={true} onClose={jest.fn()} />);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('A badge for testing')).toBeInTheDocument();
    expect(screen.getByText(/Criteria:/)).toBeInTheDocument();
    expect(screen.getByAltText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('Earned!')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<BadgeModal badge={badge} open={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Test Badge')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<BadgeModal badge={badge} open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(<BadgeModal badge={badge} open={true} onClose={onClose} />);
    const overlay = screen.getByTestId('modal-overlay');
    overlay.focus();
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the correct badge image src', () => {
    render(<BadgeModal badge={badge} open={true} onClose={jest.fn()} />);
    const img = screen.getByAltText('Test Badge') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toMatch(/\/badges\/test_badge\.png$/);
  });

  it('shows fallback image if badge image fails to load', () => {
    render(<BadgeModal badge={badge} open={true} onClose={jest.fn()} />);
    const img = screen.getByTestId('badge-image') as HTMLImageElement;
    // Simulate image error
    fireEvent.error(img);
    expect(img.src).toMatch(/\/badges\/badge_test\.png$/);
  });

  it('shows the actual badge image in the modal', () => {
    render(<BadgeModal badge={badge} open={true} onClose={jest.fn()} />);
    const img = screen.getByTestId('badge-image') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toMatch(/\/badges\/test_badge\.png$/);
    // Simulate successful image load (no error event)
    fireEvent.load(img);
    // The src should still be the actual badge image, not the fallback
    expect(img.src).toMatch(/\/badges\/test_badge\.png$/);
  });

  it('shows the actual badge image and it is visible, not the fallback', () => {
    render(<BadgeModal badge={badge} open={true} onClose={jest.fn()} />);
    const img = screen.getByTestId('badge-image') as HTMLImageElement;
    expect(img).toBeVisible();
    expect(img.src).toMatch(/\/badges\/test_badge\.png$/);
    // Simulate successful image load
    fireEvent.load(img);
    // Should still be the actual badge image, not the fallback
    expect(img.src).toMatch(/\/badges\/test_badge\.png$/);
    expect(img.src).not.toMatch(/badge_test\.png$/); // Not fallback
  });
});
