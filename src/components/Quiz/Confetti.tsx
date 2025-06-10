import React from 'react';

interface ConfettiProps {
  show: boolean;
  width: number;
  height: number;
  onComplete?: () => void;
}

const Confetti = ({ show, width, height, onComplete }: ConfettiProps) => {
  if (!show) return null;
  // You can swap this for your preferred confetti library/component
  // This is a placeholder for modularization
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width, height, pointerEvents: 'none', zIndex: 9999 }}>
      {/* Confetti animation would go here */}
      <span role="img" aria-label="confetti" style={{ fontSize: 48, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>🎉</span>
    </div>
  );
};

export default Confetti;
