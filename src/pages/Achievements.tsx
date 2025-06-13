import React, { useEffect, useState } from 'react';
import { getBadges, Badge } from '../badges';
import { getBaseUrl } from '../utils/getBaseUrl';
import BadgeModal from '../components/Quiz/BadgeModal';

const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    getBadges().then(setBadges);
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
            onClick={() => setSelectedBadge(badge)}
          >
            <img
              src={`${getBaseUrl()}badges/${badge.criteria}.png`}
              alt={badge.name}
              style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', opacity: badge.awarded ? 1 : 0.5 }}
              data-testid={badge.awarded ? 'badge-awarded' : 'badge-unawarded'}
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
