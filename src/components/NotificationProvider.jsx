import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2000 }} data-testid="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification toast ${n.type}`} data-testid={`toast-${n.id}`}
            style={{ background: n.type === "error" ? "#FF6B6B" : n.type === "success" ? "#6BCB77" : "#333", color: "#fff", padding: "12px 24px", borderRadius: 8, margin: "8px 0", minWidth: 200, textAlign: "center", boxShadow: "0 2px 8px #0003", opacity: 0.97 }}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
