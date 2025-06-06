// Add global type for window.charts
import { Chart } from "chart.js";
declare global {
  interface Window {
    charts?: { [key: string]: Chart };
  }
}

// Types for analytics
export interface QuestionStats {
  correct?: number;
  incorrect?: number;
}

export interface Question {
  id?: string;
  topic?: string;
  stats?: QuestionStats;
  streak?: number;
  date?: string;
  score?: number;
  total?: number;
  avgMastery?: number;
}

window.Chart = Chart;

// Initialize global chart management
if (!window.charts) {
  window.charts = {};
}

// --- 8. CHARTS ---

// --- 9. ANALYTICS & SMART REVIEW ---
export function masteryColor(accuracy: number) {
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`;
}
