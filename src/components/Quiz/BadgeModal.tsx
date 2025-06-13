import React, { useState } from 'react';
import Modal from './Modal';
import type { Badge } from '../../badges';

interface BadgeModalProps {
  badge: Badge | null;
  open: boolean;
  onClose: () => void;
}

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, open, onClose }) => {
  const [imgError, setImgError] = useState(false);
  if (!badge) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <img
          src={imgError ? '/badges/badge_test.png' : `/badges/${badge.id}.png`}
          alt={badge.name}
          style={{ width: 160, height: 160, marginBottom: 16 }}
          onError={() => setImgError(true)}
          data-testid="badge-image"
        />
        <h2 style={{ marginBottom: 8 }}>{badge.name}</h2>
        <p style={{ fontStyle: 'italic', color: '#64748b', marginBottom: 12 }}>{badge.description}</p>
        <div style={{ fontSize: 15, color: '#2563eb', marginBottom: 8 }}>
          <strong>Criteria:</strong> {badge.criteria}
        </div>
        {badge.awarded && (
          <div style={{ color: '#22c55e', fontWeight: 600, marginTop: 8 }}>Earned!</div>
        )}
      </div>
    </Modal>
  );
};

export default BadgeModal;
