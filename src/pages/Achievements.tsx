import React, { useEffect, useState } from 'react';

const badgeList = [
  // List badge filenames or fetch dynamically if needed
  'first_quiz.png',
  'accuracy_100.png',
  'badge_collector_basic.png',
  // ...add more as needed
];

const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Replace with real user badge fetch
    setBadges(badgeList); // For demo, show all
  }, []);

  return (
    <div>
      <h2>Achievements</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {badges.map(badge => (
          <div key={badge} style={{ textAlign: 'center' }}>
            <img src={`${import.meta.env.BASE_URL}badges/${badge}`} alt={badge} style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <div style={{ marginTop: 8 }}>{badge.replace(/_/g, ' ').replace(/\.png$/, '')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Achievements;
