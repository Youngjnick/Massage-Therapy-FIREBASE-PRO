import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import type { Badge } from '../../badges';

interface BadgeModalProps {
  badge: Badge | null;
  open: boolean;
  onClose: () => void;
}

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, open, onClose }) => {
  const [imgError, setImgError] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button when modal opens
  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [open]);

  if (!badge) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ textAlign: 'center' }} data-testid="badge-modal">
        <img
          src={
            imgError
              ? `${import.meta.env.BASE_URL}badges/badge_test.png`
              : `${import.meta.env.BASE_URL}badges/${badge.id}.png`
          }
          alt={badge.name}
          style={{ width: 160, height: 160, marginBottom: 16 }}
          onError={() => setImgError(true)}
          data-testid="badge-image"
        />
        <h2 style={{ marginBottom: 8 }}>{badge.name}</h2>
        <p
          style={{
            fontStyle: 'italic',
            color: '#64748b',
            marginBottom: 12,
          }}
        >
          {badge.description}
        </p>
        <div
          style={{
            fontSize: 15,
            color: '#2563eb',
            marginBottom: 8,
          }}
        >
          <strong>Criteria:</strong> {badge.criteria}
        </div>
        {badge.awarded && (
          <div
            style={{
              color: '#22c55e',
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            Earned!
          </div>
        )}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          style={{
            marginTop: 24,
            padding: '0.5rem 1.2rem',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer',
          }}
          aria-label="Close badge modal"
          data-testid="badge-modal-close-bottom"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default BadgeModal;
