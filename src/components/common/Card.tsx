import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, style, className }) => (
  <div className={className ? `card ${className}` : 'card'} style={{ padding: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff', ...style }}>
    {children}
  </div>
);

export default Card;
