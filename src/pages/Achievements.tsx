import React, { useEffect, useState } from 'react';
import { getBadges, Badge } from '../badges';
import { BASE_URL } from '../utils/baseUrl';
import Modal from '../components/Modal';

const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    // For SSR/test, fallback to static import if window.fetch is not available
    const loadBadges = async () => {
      let loadedBadges: Badge[] = [];
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        loadedBadges = await getBadges();
      } else {
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
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setSelectedBadge(badge)}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${badge.name}`}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedBadge(badge); }}
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
      <Modal isOpen={!!selectedBadge} onClose={() => setSelectedBadge(null)} ariaLabel={selectedBadge ? selectedBadge.name : 'Badge details'}>
        {selectedBadge && (
          <div style={{ textAlign: 'center', minWidth: 260 }}>
            <img
              src={`${BASE_URL}badges/${selectedBadge.criteria}.png`}
              alt={selectedBadge.name}
              style={{ width: 120, height: 120, borderRadius: 20, marginBottom: 16 }}
            />
            <h3>{selectedBadge.name}</h3>
            <div style={{ margin: '12px 0', color: '#64748b' }}>{selectedBadge.description || 'No description available.'}</div>
            <div><strong>Status:</strong> {selectedBadge.awarded ? 'Awarded' : 'Locked'}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Achievements;
