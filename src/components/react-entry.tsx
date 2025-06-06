import React from "react";
import { createRoot } from "react-dom/client";
import AppWithReactPanels from "./AppWithReactPanels";
import appState from "../appState";
import { AnalyticsProvider } from "./AnalyticsContext";
import { BadgeProvider } from "./BadgeContext";
import { NotificationProvider } from "./NotificationProvider";
import { BookmarkProvider } from "./BookmarkContext";

console.log("[E2E/DEBUG] react-entry.jsx loaded");

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root element not found");
const root = createRoot(rootElement);

const isE2EOrDev =
  typeof window !== "undefined" &&
  (window.__E2E_TEST__ ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.JEST_WORKER_ID) ||
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.MODE === "development" || import.meta.env.VITE_E2E)));
if (isE2EOrDev) {
  const banner = document.createElement("div");
  banner.textContent = "[E2E/DEV] React root mounted";
  banner.style =
    "position:fixed;top:0;left:0;z-index:9999;background:#0f0;color:#222;font-weight:bold;padding:6px 18px;font-size:18px;box-shadow:0 2px 8px #0003;";
  document.body.appendChild(banner);
  // eslint-disable-next-line no-console
  console.log("[E2E/DEV] React root mounted");
}

root.render(
  <AnalyticsProvider>
    <BadgeProvider>
      <NotificationProvider>
        <BookmarkProvider>
          <AppWithReactPanels appState={appState} />
        </BookmarkProvider>
      </NotificationProvider>
    </BadgeProvider>
  </AnalyticsProvider>
);

// Attach E2E hook only after React app is rendered
if (typeof window !== "undefined") {
  setTimeout(() => {
    window.__E2E_HOOK_ATTACHED = true;
    // For debugging: log when the E2E hook is set
    console.log("[E2E] __E2E_HOOK_ATTACHED set by react-entry.jsx");
  }, 0);
}
