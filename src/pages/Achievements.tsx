import React, { useEffect, useState } from 'react';
import { getBadges, Badge } from '../badges';
import { BASE_URL } from '../utils/baseUrl';

const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // For SSR/test, fallback to static import if window.fetch is not available
    const loadBadges = async () => {
      let loadedBadges: Badge[] = [];
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        loadedBadges = await getBadges();
      } else {
        // @ts-expect-error: Dynamic import of JSON for SSR/test fallback
        loadedBadges = (await import('../../public/badges/badges.json')).default || [];
      }
      setBadges(loadedBadges);
    };
    loadBadges();
  }, []);

  return (
    <div>
      <h2>Achievements</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {badges.map(badge => (
          <div
            key={badge.id}
            data-testid="badge-container"
            style={{ textAlign: 'center' }}
          >
            <img
              src={`${BASE_URL}badges/${badge.criteria}.png`}
              alt={badge.name}
              style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            />
            <div style={{ marginTop: 8, opacity: badge.awarded ? 1 : 0.5 }} data-testid={badge.awarded ? 'badge-awarded' : 'badge-unawarded'}>{badge.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Achievements;
