import React, { createContext, useContext, useState } from "react";

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const [badges, setBadges] = useState([]);

  function earnBadge(badge) {
    setBadges(prev =>
      prev.includes(badge) ? prev : [...prev, badge]
    );
  }

  return (
    <BadgeContext.Provider value={{ badges, earnBadge }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  return useContext(BadgeContext);
}