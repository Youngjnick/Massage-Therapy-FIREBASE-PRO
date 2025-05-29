import React from "react";
import { createRoot } from "react-dom/client";
import AppWithReactPanels from "./AppWithReactPanels.jsx";
import { appState } from "../appState.js";
import { AnalyticsProvider } from "./AnalyticsContext.jsx";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <AnalyticsProvider>
    <AppWithReactPanels appState={appState} />
  </AnalyticsProvider>
);
