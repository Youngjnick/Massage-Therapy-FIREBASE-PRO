import React from "react";
import { useAnalytics } from "./AnalyticsContext.jsx";

export default function AnalyticsChart() {
  // Removed from main page; keep only for analytics modal usage
  const { analytics } = useAnalytics();
  // Placeholder: Replace with a real chart library if needed
  return (
    <section
      style={{
        padding: 16,
        background: "#eef6fa",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Quiz Accuracy</h3>
      <div style={{ fontSize: 24, fontWeight: "bold" }}>
        {analytics.total > 0
          ? Math.round((analytics.correct / analytics.total) * 100)
          : 0}
        %
      </div>
      <div
        style={{
          height: 8,
          background: "#ddd",
          borderRadius: 4,
          margin: "8px 0",
        }}
      >
        <div
          style={{
            width: `${analytics.total > 0 ? (analytics.correct / analytics.total) * 100 : 0}%`,
            height: 8,
            background: "#4caf50",
            borderRadius: 4,
          }}
        />
      </div>
    </section>
  );
}
