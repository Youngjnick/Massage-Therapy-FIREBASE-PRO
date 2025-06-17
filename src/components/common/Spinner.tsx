import React from 'react';

const Spinner: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div
    role="status"
    aria-label="Loading"
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `${size / 8}px solid #cbd5e1`,
      borderTop: `${size / 8}px solid #2563eb`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: 12,
      verticalAlign: 'middle',
    }}
  />
);

export default Spinner;

// Add keyframes for spin animation
document.head.insertAdjacentHTML(
  'beforeend',
  `<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>`
);
