import React, { useEffect, useState } from "react";

interface SmartBadgeNotificationProps {
  badgeLabel: string;
  message: string;
  icon?: string;
  onClose?: () => void;
}

const SmartBadgeNotification: React.FC<SmartBadgeNotificationProps> = ({
  badgeLabel,
  message,
  icon,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        background: "#fffbe7",
        border: "1px solid #ffe082",
        borderRadius: 10,
        boxShadow: "0 2px 12px #0002",
        padding: 20,
        zIndex: 9999,
        minWidth: 260,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {icon && (
        <img
          src={icon}
          alt={badgeLabel}
          style={{ width: 48, height: 48, borderRadius: 8 }}
        />
      )}
      <div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{badgeLabel}</div>
        <div style={{ fontSize: 14 }}>{message}</div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          onClose && onClose();
        }}
        style={{
          marginLeft: 8,
          background: "none",
          border: "none",
          fontSize: 18,
          cursor: "pointer",
          color: "#888",
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default SmartBadgeNotification;
