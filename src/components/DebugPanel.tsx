import React from "react";

export default function DebugPanel({ appState, visible }) {
  // Always render the debug panel in the DOM, but visually hide if not visible

  // Firestore sync status (simple heuristic: if analytics exists and user is signed in, assume synced)
  const analytics = appState.analyticsData || appState.analytics;
  const user =
    appState.user || (window && window.appState && window.appState.user);
  const firestoreStatus =
    analytics && user && user.uid ? "Synced" : "Not Synced";

  // Firestore analytics persistence details
  let firestoreAnalytics = (window && window.firestoreAnalytics) || null;
  let lastSync = (window && window.lastAnalyticsSync) || null;
  let analyticsMatch = false;
  if (analytics && firestoreAnalytics) {
    try {
      analyticsMatch =
        JSON.stringify(analytics) === JSON.stringify(firestoreAnalytics);
    } catch {}
  }

  // Always visible in E2E/dev unless explicitly hidden
  const isE2E =
    typeof window !== "undefined" &&
    (window.__E2E_TEST__ ||
      import.meta?.env?.MODE === "development" ||
      import.meta?.env?.VITE_E2E);
  // If visible is undefined, always show in E2E/dev, otherwise respect prop
  const shouldShow = typeof visible === "undefined" ? isE2E : visible;

  // Always render the panel, but use aria-hidden and pointerEvents for accessibility
  return (
    <div
      id="debug-panel"
      data-testid="debug-panel"
      style={{
        position: "fixed",
        bottom: 60,
        right: 20,
        width: 400,
        maxHeight: "60vh",
        overflow: "auto",
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 8,
        boxShadow: "0 2px 12px #0002",
        zIndex: 20001,
        padding: 16,
        fontSize: 14,
        pointerEvents: shouldShow ? undefined : "none",
        opacity: shouldShow ? 1 : 0,
        transition: "opacity 0.2s",
        // Never use display: none so testid is always present
      }}
      aria-label="Debug Panel"
      aria-hidden={!shouldShow}
      tabIndex={-1}
    >
      <h3 style={{ marginTop: 0 }}>Debug Panel</h3>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <b>Analytics Firestore Sync:</b>{" "}
        <span style={{ color: firestoreStatus === "Synced" ? "#090" : "#c00" }}>
          {firestoreStatus}
        </span>
        {lastSync && (
          <span style={{ marginLeft: 10, color: "#888" }}>
            (Last Sync: {new Date(lastSync).toLocaleString()})
          </span>
        )}
        {firestoreAnalytics && (
          <span
            style={{ marginLeft: 10, color: analyticsMatch ? "#090" : "#c00" }}
          >
            {analyticsMatch
              ? "Analytics match Firestore"
              : "Analytics differ from Firestore"}
          </span>
        )}
      </div>
      <pre
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
        data-testid="debug-panel-json"
      >
        {JSON.stringify(appState, null, 2)}
      </pre>
    </div>
  );
}
