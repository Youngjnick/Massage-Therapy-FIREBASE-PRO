import React from "react";

/**
 * HeaderActions - React version of the header action links (Smart Learning, Analytics, Settings).
 * Props:
 *   onOpenSmartLearning: function
 *   onOpenAnalytics: function
 *   onOpenSettings: function
 */
const HeaderActions = ({ onOpenSmartLearning, onOpenAnalytics, onOpenSettings }) => {
  return (
    <div className="header-actions" style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "space-evenly" }}>
      <div className="smart-learning">
        <button className="smart-learning-link" style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer" }} onClick={onOpenSmartLearning}>
          <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{ verticalAlign: "middle", marginRight: 8 }}>
            <path d="M20.3 5.7a1 1 0 00-1.4-1.4L9 14.17l-3.9-3.9a1 1 0 10-1.4 1.42l4.6 4.6a1 1 0 001.4 0l11-11z"></path>
          </svg>
          Smart Learning
        </button>
      </div>
      <div className="view-analytics">
        <button
          className="analytics-link"
          data-testid="analytics-btn"
          style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer" }}
          onClick={onOpenAnalytics}
        >
          <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <path d="M3 17h2v-7H3v7zm4 0h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-2h-2v2zm4 0h2v-10h-2v10z"></path>
          </svg>
          View Analytics
        </button>
      </div>
      <div className="settings">
        <button className="settings-link" style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer" }} onClick={onOpenSettings}>
          <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <path d="M12 1a2 2 0 0 1 2 2v1.1a7.96 7.96 0 0 1 2.83 1.17l.78-.78a2 2 0 1 1 2.83 2.83l-.78.78A7.96 7.96 0 0 1 20.9 10H22a2 2 0 1 1 0 4h-1.1a7.96 7.96 0 0 1-1.17 2.83l.78.78a2 2 0 1 1-2.83 2.83l-.78-.78A7.96 7.96 0 0 1 14 20.9V22a2 2 0 1 1-4 0v-1.1a7.96 7.96 0 0 1-2.83-1.17l-.78.78a2 2 0 1 1-2.83-2.83l.78-.78A7.96 7.96 0 0 1 3.1 14H2a2 2 0 1 1 0-4h1.1a7.96 7.96 0 0 1 1.17-2.83l-.78-.78a2 2 0 1 1 2.83-2.83l.78.78A7.96 7.96 0 0 1 10 3.1V2a2 2 0 0 1 2-2zm0 5a5 5 0 1 0 0 10 5 5 5 0 0 0 0-10z"></path>
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
};

export default React.memo(HeaderActions);
