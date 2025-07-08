import React from 'react';

const Spinner: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div
    data-testid="quiz-loading"
    aria-label="Loading"
    role="status"
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
  >
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        border: 0,
      }}
    >
      Loading...
    </span>
  </div>
);

export default Spinner;

// Add keyframes for spin animation
document.head.insertAdjacentHTML(
  'beforeend',
  `<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>`
);
