import React, { useEffect, useState, useRef } from 'react';
import { getBadges, Badge } from '../badges';
import BadgeModal from '../components/Quiz/BadgeModal';

const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastFocusedBadgeRef = useRef<HTMLDivElement | null>(null);

  const fallbackUrl = `${import.meta.env.BASE_URL}badges/badge_test.png`;

  // Preload fallback image once
  useEffect(() => {
    const img = new window.Image();
    img.src = fallbackUrl;
  }, []);

  useEffect(() => {
    getBadges()
      .then(badges => {
        setBadges(badges);
        if (!badges || badges.length === 0) {
          setError('No badges found. Please check badge data or network.');
        }
      })
      .catch(e => {
        setError('Failed to load badges.');
        console.error('[DEBUG] Error loading badges:', e);
      });
  }, []);

  // Return focus to last badge when modal closes
  useEffect(() => {
    if (!selectedBadge && lastFocusedBadgeRef.current) {
      lastFocusedBadgeRef.current.focus();
    }
  }, [selectedBadge]);

  return (
    <div>
      <h2>Achievements</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: 16 }} data-testid="badge-error">
          {error}
        </div>
      )}
      {badges.length === 0 && !error && (
        <div style={{ color: 'orange', marginBottom: 16 }} data-testid="badge-empty">
          No badges to display. (Debug: badge list is empty but no error was thrown.)
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {badges.map(badge => (
          <div
            key={badge.id}
            data-testid="badge-container"
            style={{ textAlign: 'center' }}
            tabIndex={0}
            role="button"
            aria-label={`Open badge modal for badge: ${badge.name}`}
            onClick={e => {
              if (selectedBadge) return; // Prevent opening if already open
              lastFocusedBadgeRef.current = e.currentTarget;
              setSelectedBadge(badge);
            }}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ' ') && !selectedBadge) {
                e.preventDefault();
                lastFocusedBadgeRef.current = e.currentTarget as HTMLDivElement;
                setSelectedBadge(badge);
              }
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}badges/${badge.image}`}
              alt={badge.name}
              loading="eager"
              style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', opacity: badge.awarded ? 1 : 0.5 }}
              data-testid={badge.awarded ? 'badge-awarded' : 'badge-unawarded'}
              onError={e => {
                // Only log error, do not swap to fallback. Let modal handle fallback.
                console.error('Badge image failed to load:', e.currentTarget.src);
              }}
              onLoad={e => {
                console.log('Badge image loaded:', e.currentTarget.src);
              }}
            />
            <div style={{ marginTop: 8 }}>{badge.name}</div>
          </div>
        ))}
      </div>
      {selectedBadge && (
        <BadgeModal badge={selectedBadge} open onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
};

export default Achievements;
