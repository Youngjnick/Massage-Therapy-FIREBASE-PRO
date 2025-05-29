import React from "react";
import { useAnalytics } from "./AnalyticsContext.jsx";

export default function AnalyticsPanel() {
  const { analytics } = useAnalytics();
  return (
    <section style={{ padding: 16, background: "#f8f9fa", borderRadius: 8, marginBottom: 16 }}>
      <h2>Analytics</h2>
      <ul>
        <li>Total Questions: {analytics.total}</li>
        <li>Correct Answers: {analytics.correct}</li>
        <li>Incorrect Answers: {analytics.total - analytics.correct}</li>
        <li>Current Streak: {analytics.streak}</li>
        <li>Completed Quizzes: {analytics.completed}</li>
      </ul>
    </section>
  );
}
