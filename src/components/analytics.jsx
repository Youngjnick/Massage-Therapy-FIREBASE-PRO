import { Chart } from "chart.js";
window.Chart = Chart;

// Initialize global chart management
if (!window.charts) {
  window.charts = {};
}

// --- 8. CHARTS ---
function renderChartsOnLoad() {
  const stats = {
    correct: correct,
    incorrect: quiz.length - correct,
    unanswered: quiz.length > 0 ? quiz.length - current : 0,
  };
  renderAccuracyChart(stats.correct, stats.incorrect, stats.unanswered);
  renderHistoryChart();
}

function renderAccuracyChart(correct, incorrect, unanswered) {
  console.log("[DEBUG] renderAccuracyChart CALLED:", { correct, incorrect, unanswered });
  const ctxElem = document.getElementById("accuracyChart");
  if (!ctxElem) {
    console.error("Accuracy chart element not found.");
    // Log DOM state for debugging
    console.log("[DEBUG] #accuracyChart not found. Current DOM:", document.body.innerHTML.slice(0, 500));
    return;
  }
  try {
    const ctx = ctxElem.getContext("2d");
    if (window.charts?.accuracyChart) {
      window.charts.accuracyChart.destroy();
    }
    window.charts.accuracyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Correct", "Incorrect", "Unanswered"],
        datasets: [
          {
            data: [correct, incorrect, unanswered],
            backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        cutout: "85%",
      },
    });
    // Log chart creation
    console.log("[DEBUG] Accuracy chart rendered with data:", [correct, incorrect, unanswered]);
  } catch (err) {
    console.error("[DEBUG] Chart.js error in renderAccuracyChart:", err);
  }
}

function updateAccuracyChart(correct, incorrect, unanswered) {
  if (window.charts?.accuracyChart) {
    window.charts.accuracyChart.data.datasets[0].data = [correct, incorrect, unanswered];
    window.charts.accuracyChart.update();
  } else {
    renderAccuracyChart(correct, incorrect, unanswered);
  }
}

function renderHistoryChart() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  if (!Array.isArray(results)) {
    console.error("Invalid quiz results data.");
    return;
  }

  const ctxElem = document.getElementById("historyChart");
  if (!ctxElem) {
    console.error("History chart element not found.");
    return;
  }

  const ctx = ctxElem.getContext("2d");

  if (window.charts.historyChart) {
    window.charts.historyChart.destroy();
  }

  window.charts.historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.length
        ? results.map((r) => new Date(r.date).toLocaleDateString())
        : ["No Data"],
      datasets: [
        {
          label: "Accuracy (%)",
          data: results.length
            ? results.map((r) =>
                r.total > 0 && typeof r.score === "number"
                  ? Math.max(0, Math.round((r.score / r.total) * 100))
                  : 0
              )
            : [0],
          borderColor: "#007bff",
          fill: false,
        },
        {
          label: "Streak",
          data: results.length
            ? results.map((r) =>
                typeof r.streak === "number" ? Math.max(0, r.streak) : 0
              )
            : [0],
          borderColor: "#FFD93D",
          fill: false,
        },
      ],
    },
    options: { responsive: true },
  });
}

function renderConfidenceChart() {
  const ctxElem = document.getElementById("confidenceChart");
  if (!ctxElem) {return;}
  if (window.confidenceChart && typeof window.confidenceChart.destroy === "function") {
    window.confidenceChart.destroy();
    window.confidenceChart = null;
  }
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const values = Object.values(confidences);
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length);
  window.confidenceChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: [
        "Not confident",
        "Slightly",
        "Neutral",
        "Confident",
        "Very confident",
      ],
      datasets: [
        {
          label: "Number of Answers",
          data: counts,
          backgroundColor: "#6BCB77",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

function renderExampleChart() {
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("myChart")?.getContext("2d");
    if (!ctx) {
      console.error("Canvas element with id 'myChart' not found.");
      return;
    }

    const myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [
          {
            label: "# of Votes",
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });
}

function renderSpacedRepetitionChart() {
  const ctxElem = document.getElementById("spacedRepetitionChart");
  if (!ctxElem) {
    console.error("Spaced repetition chart element not found.");
    return;
  }

  const reviewData = questions.map((q) => {
    const review = JSON.parse(localStorage.getItem(`review_${q.id}`) || "{}");
    return review.lastMissed ? (Date.now() - review.lastMissed) / (1000 * 60 * 60 * 24) : null;
  }).filter(Boolean);

  if (window.charts.spacedRepetitionChart) {
    window.charts.spacedRepetitionChart.destroy();
  }

  window.charts.spacedRepetitionChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: reviewData.map((_, i) => `Q${i + 1}`),
      datasets: [{ data: reviewData, backgroundColor: "#FFD93D" }],
    },
    options: { responsive: true },
  });
}

function renderMasteryHistoryChart() {
  const data = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
  const ctxElem = document.getElementById("masteryHistoryChart");
  if (!ctxElem) {
    console.error("Mastery history chart element not found.");
    return;
  }
  if (window.charts.masteryHistoryChart) {
    window.charts.masteryHistoryChart.destroy();
  }
  window.charts.masteryHistoryChart = new Chart(ctxElem.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Average Mastery (%)",
        data: data.map(d => d.avgMastery),
        borderColor: "#6BCB77",
        fill: false,
      }]
    },
    options: { responsive: true }
  });
}

// --- 9. ANALYTICS & SMART REVIEW ---
function getTopicMastery(questions = []) {
  const topicStats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    }
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

function masteryColor(accuracy) {
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`;
}

function getQuestionsForSmartReview(questions = []) {
  return questions.filter(
    (q) => (q.stats?.incorrect || 0) > 1 ||
      ((q.stats?.correct || 0) + (q.stats?.incorrect || 0) > 0 &&
        (q.stats?.correct || 0) / ((q.stats?.correct || 0) + (q.stats?.incorrect || 0)) < 0.7)
  );
}

function getAccuracyPerTopic(questions = []) {
  const stats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!stats[q.topic]) {stats[q.topic] = { correct: 0, total: 0 };}
    stats[q.topic].correct += q.stats?.correct || 0;
    stats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  Object.keys(stats).forEach((topic) => {
    stats[topic].accuracy =
      stats[topic].total > 0
        ? Math.round((stats[topic].correct / stats[topic].total) * 100)
        : 0;
  });
  return stats;
}

function getQuestionsMastered(threshold = 3, questions = []) {
  return questions.filter((q) => q.stats?.correct >= threshold);
}

function getMostErroredQuestions(n = 5, questions = []) {
  const errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}");
  return Object.entries(errorMap)
    .map(([qid, errors]) => ({
      qid,
      totalErrors: Object.values(errors).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors)
    .slice(0, n)
    .map((e) => questions.find((q) => q.id === e.qid))
    .filter(Boolean);
}

function getAdaptiveQuiz(questions = []) {
  const mostMissed = getMostErroredQuestions(10, questions);
  const lowMastery = questions.filter((q) => {
    const stats = q.stats || {};
    const total = (stats.correct || 0) + (stats.incorrect || 0);
    return total > 0 && (stats.correct || 0) / total < 0.7;
  });
  const adaptivePool = [...new Set([...mostMissed, ...lowMastery])];
  return adaptivePool.length > 0 ? adaptivePool : questions;
}

function prettifyName(name) {
  if (!name) {return "";}
  // Replace underscores/dashes with spaces, split camelCase, and capitalize words
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- 8. CHARTS ---
function renderChartsOnLoad() {
  const stats = {
    correct: correct,
    incorrect: quiz.length - correct,
    unanswered: quiz.length > 0 ? quiz.length - current : 0,
  };
  renderAccuracyChart(stats.correct, stats.incorrect, stats.unanswered);
  renderHistoryChart();
}

function renderAccuracyChart(correct, incorrect, unanswered) {
  console.log("[DEBUG] renderAccuracyChart CALLED:", { correct, incorrect, unanswered });
  const ctxElem = document.getElementById("accuracyChart");
  if (!ctxElem) {
    console.error("Accuracy chart element not found.");
    // Log DOM state for debugging
    console.log("[DEBUG] #accuracyChart not found. Current DOM:", document.body.innerHTML.slice(0, 500));
    return;
  }
  try {
    const ctx = ctxElem.getContext("2d");
    if (window.charts?.accuracyChart) {
      window.charts.accuracyChart.destroy();
    }
    window.charts.accuracyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Correct", "Incorrect", "Unanswered"],
        datasets: [
          {
            data: [correct, incorrect, unanswered],
            backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        cutout: "85%",
      },
    });
    // Log chart creation
    console.log("[DEBUG] Accuracy chart rendered with data:", [correct, incorrect, unanswered]);
  } catch (err) {
    console.error("[DEBUG] Chart.js error in renderAccuracyChart:", err);
  }
}

function updateAccuracyChart(correct, incorrect, unanswered) {
  if (window.charts?.accuracyChart) {
    window.charts.accuracyChart.data.datasets[0].data = [correct, incorrect, unanswered];
    window.charts.accuracyChart.update();
  } else {
    renderAccuracyChart(correct, incorrect, unanswered);
  }
}

function renderHistoryChart() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  if (!Array.isArray(results)) {
    console.error("Invalid quiz results data.");
    return;
  }

  const ctxElem = document.getElementById("historyChart");
  if (!ctxElem) {
    console.error("History chart element not found.");
    return;
  }

  const ctx = ctxElem.getContext("2d");

  if (window.charts.historyChart) {
    window.charts.historyChart.destroy();
  }

  window.charts.historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.length
        ? results.map((r) => new Date(r.date).toLocaleDateString())
        : ["No Data"],
      datasets: [
        {
          label: "Accuracy (%)",
          data: results.length
            ? results.map((r) =>
                r.total > 0 && typeof r.score === "number"
                  ? Math.max(0, Math.round((r.score / r.total) * 100))
                  : 0
              )
            : [0],
          borderColor: "#007bff",
          fill: false,
        },
        {
          label: "Streak",
          data: results.length
            ? results.map((r) =>
                typeof r.streak === "number" ? Math.max(0, r.streak) : 0
              )
            : [0],
          borderColor: "#FFD93D",
          fill: false,
        },
      ],
    },
    options: { responsive: true },
  });
}

function renderConfidenceChart() {
  const ctxElem = document.getElementById("confidenceChart");
  if (!ctxElem) {return;}
  if (window.confidenceChart && typeof window.confidenceChart.destroy === "function") {
    window.confidenceChart.destroy();
    window.confidenceChart = null;
  }
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const values = Object.values(confidences);
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length);
  window.confidenceChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: [
        "Not confident",
        "Slightly",
        "Neutral",
        "Confident",
        "Very confident",
      ],
      datasets: [
        {
          label: "Number of Answers",
          data: counts,
          backgroundColor: "#6BCB77",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

function renderExampleChart() {
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("myChart")?.getContext("2d");
    if (!ctx) {
      console.error("Canvas element with id 'myChart' not found.");
      return;
    }

    const myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [
          {
            label: "# of Votes",
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });
}

function renderSpacedRepetitionChart() {
  const ctxElem = document.getElementById("spacedRepetitionChart");
  if (!ctxElem) {
    console.error("Spaced repetition chart element not found.");
    return;
  }

  const reviewData = questions.map((q) => {
    const review = JSON.parse(localStorage.getItem(`review_${q.id}`) || "{}");
    return review.lastMissed ? (Date.now() - review.lastMissed) / (1000 * 60 * 60 * 24) : null;
  }).filter(Boolean);

  if (window.charts.spacedRepetitionChart) {
    window.charts.spacedRepetitionChart.destroy();
  }

  window.charts.spacedRepetitionChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: reviewData.map((_, i) => `Q${i + 1}`),
      datasets: [{ data: reviewData, backgroundColor: "#FFD93D" }],
    },
    options: { responsive: true },
  });
}

function renderMasteryHistoryChart() {
  const data = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
  const ctxElem = document.getElementById("masteryHistoryChart");
  if (!ctxElem) {
    console.error("Mastery history chart element not found.");
    return;
  }
  if (window.charts.masteryHistoryChart) {
    window.charts.masteryHistoryChart.destroy();
  }
  window.charts.masteryHistoryChart = new Chart(ctxElem.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Average Mastery (%)",
        data: data.map(d => d.avgMastery),
        borderColor: "#6BCB77",
        fill: false,
      }]
    },
    options: { responsive: true }
  });
}

// --- 9. ANALYTICS & SMART REVIEW ---
function getTopicMastery(questions = []) {
  const topicStats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    }
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

function masteryColor(accuracy) {
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`;
}

function getQuestionsForSmartReview(questions = []) {
  return questions.filter(
    (q) => (q.stats?.incorrect || 0) > 1 ||
      ((q.stats?.correct || 0) + (q.stats?.incorrect || 0) > 0 &&
        (q.stats?.correct || 0) / ((q.stats?.correct || 0) + (q.stats?.incorrect || 0)) < 0.7)
  );
}

function getAccuracyPerTopic(questions = []) {
  const stats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!stats[q.topic]) {stats[q.topic] = { correct: 0, total: 0 };}
    stats[q.topic].correct += q.stats?.correct || 0;
    stats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  Object.keys(stats).forEach((topic) => {
    stats[topic].accuracy =
      stats[topic].total > 0
        ? Math.round((stats[topic].correct / stats[topic].total) * 100)
        : 0;
  });
  return stats;
}

function getQuestionsMastered(threshold = 3, questions = []) {
  return questions.filter((q) => q.stats?.correct >= threshold);
}

function getMostErroredQuestions(n = 5, questions = []) {
  const errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}");
  return Object.entries(errorMap)
    .map(([qid, errors]) => ({
      qid,
      totalErrors: Object.values(errors).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors)
    .slice(0, n)
    .map((e) => questions.find((q) => q.id === e.qid))
    .filter(Boolean);
}

function getAdaptiveQuiz(questions = []) {
  const mostMissed = getMostErroredQuestions(10, questions);
  const lowMastery = questions.filter((q) => {
    const stats = q.stats || {};
    const total = (stats.correct || 0) + (stats.incorrect || 0);
    return total > 0 && (stats.correct || 0) / total < 0.7;
  });
  const adaptivePool = [...new Set([...mostMissed, ...lowMastery])];
  return adaptivePool.length > 0 ? adaptivePool : questions;
}

function prettifyName(name) {
  if (!name) {return "";}
  // Replace underscores/dashes with spaces, split camelCase, and capitalize words
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- 8. CHARTS ---
function renderChartsOnLoad() {
  const stats = {
    correct: correct,
    incorrect: quiz.length - correct,
    unanswered: quiz.length > 0 ? quiz.length - current : 0,
  };
  renderAccuracyChart(stats.correct, stats.incorrect, stats.unanswered);
  renderHistoryChart();
}

function renderAccuracyChart(correct, incorrect, unanswered) {
  console.log("[DEBUG] renderAccuracyChart CALLED:", { correct, incorrect, unanswered });
  const ctxElem = document.getElementById("accuracyChart");
  if (!ctxElem) {
    console.error("Accuracy chart element not found.");
    // Log DOM state for debugging
    console.log("[DEBUG] #accuracyChart not found. Current DOM:", document.body.innerHTML.slice(0, 500));
    return;
  }
  try {
    const ctx = ctxElem.getContext("2d");
    if (window.charts?.accuracyChart) {
      window.charts.accuracyChart.destroy();
    }
    window.charts.accuracyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Correct", "Incorrect", "Unanswered"],
        datasets: [
          {
            data: [correct, incorrect, unanswered],
            backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        cutout: "85%",
      },
    });
    // Log chart creation
    console.log("[DEBUG] Accuracy chart rendered with data:", [correct, incorrect, unanswered]);
  } catch (err) {
    console.error("[DEBUG] Chart.js error in renderAccuracyChart:", err);
  }
}

function updateAccuracyChart(correct, incorrect, unanswered) {
  if (window.charts?.accuracyChart) {
    window.charts.accuracyChart.data.datasets[0].data = [correct, incorrect, unanswered];
    window.charts.accuracyChart.update();
  } else {
    renderAccuracyChart(correct, incorrect, unanswered);
  }
}

function renderHistoryChart() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  if (!Array.isArray(results)) {
    console.error("Invalid quiz results data.");
    return;
  }

  const ctxElem = document.getElementById("historyChart");
  if (!ctxElem) {
    console.error("History chart element not found.");
    return;
  }

  const ctx = ctxElem.getContext("2d");

  if (window.charts.historyChart) {
    window.charts.historyChart.destroy();
  }

  window.charts.historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.length
        ? results.map((r) => new Date(r.date).toLocaleDateString())
        : ["No Data"],
      datasets: [
        {
          label: "Accuracy (%)",
          data: results.length
            ? results.map((r) =>
                r.total > 0 && typeof r.score === "number"
                  ? Math.max(0, Math.round((r.score / r.total) * 100))
                  : 0
              )
            : [0],
          borderColor: "#007bff",
          fill: false,
        },
        {
          label: "Streak",
          data: results.length
            ? results.map((r) =>
                typeof r.streak === "number" ? Math.max(0, r.streak) : 0
              )
            : [0],
          borderColor: "#FFD93D",
          fill: false,
        },
      ],
    },
    options: { responsive: true },
  });
}

function renderConfidenceChart() {
  const ctxElem = document.getElementById("confidenceChart");
  if (!ctxElem) {return;}
  if (window.confidenceChart && typeof window.confidenceChart.destroy === "function") {
    window.confidenceChart.destroy();
    window.confidenceChart = null;
  }
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const values = Object.values(confidences);
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length);
  window.confidenceChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: [
        "Not confident",
        "Slightly",
        "Neutral",
        "Confident",
        "Very confident",
      ],
      datasets: [
        {
          label: "Number of Answers",
          data: counts,
          backgroundColor: "#6BCB77",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

function renderExampleChart() {
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("myChart")?.getContext("2d");
    if (!ctx) {
      console.error("Canvas element with id 'myChart' not found.");
      return;
    }

    const myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [
          {
            label: "# of Votes",
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });
}

function renderSpacedRepetitionChart() {
  const ctxElem = document.getElementById("spacedRepetitionChart");
  if (!ctxElem) {
    console.error("Spaced repetition chart element not found.");
    return;
  }

  const reviewData = questions.map((q) => {
    const review = JSON.parse(localStorage.getItem(`review_${q.id}`) || "{}");
    return review.lastMissed ? (Date.now() - review.lastMissed) / (1000 * 60 * 60 * 24) : null;
  }).filter(Boolean);

  if (window.charts.spacedRepetitionChart) {
    window.charts.spacedRepetitionChart.destroy();
  }

  window.charts.spacedRepetitionChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: reviewData.map((_, i) => `Q${i + 1}`),
      datasets: [{ data: reviewData, backgroundColor: "#FFD93D" }],
    },
    options: { responsive: true },
  });
}

function renderMasteryHistoryChart() {
  const data = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
  const ctxElem = document.getElementById("masteryHistoryChart");
  if (!ctxElem) {
    console.error("Mastery history chart element not found.");
    return;
  }
  if (window.charts.masteryHistoryChart) {
    window.charts.masteryHistoryChart.destroy();
  }
  window.charts.masteryHistoryChart = new Chart(ctxElem.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Average Mastery (%)",
        data: data.map(d => d.avgMastery),
        borderColor: "#6BCB77",
        fill: false,
      }]
    },
    options: { responsive: true }
  });
}

// --- 9. ANALYTICS & SMART REVIEW ---
function getTopicMastery(questions = []) {
  const topicStats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    }
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

function masteryColor(accuracy) {
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`;
}

function getQuestionsForSmartReview(questions = []) {
  return questions.filter(
    (q) => (q.stats?.incorrect || 0) > 1 ||
      ((q.stats?.correct || 0) + (q.stats?.incorrect || 0) > 0 &&
        (q.stats?.correct || 0) / ((q.stats?.correct || 0) + (q.stats?.incorrect || 0)) < 0.7)
  );
}

function getAccuracyPerTopic(questions = []) {
  const stats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!stats[q.topic]) {stats[q.topic] = { correct: 0, total: 0 };}
    stats[q.topic].correct += q.stats?.correct || 0;
    stats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  Object.keys(stats).forEach((topic) => {
    stats[topic].accuracy =
      stats[topic].total > 0
        ? Math.round((stats[topic].correct / stats[topic].total) * 100)
        : 0;
  });
  return stats;
}

function getQuestionsMastered(threshold = 3, questions = []) {
  return questions.filter((q) => q.stats?.correct >= threshold);
}

function getMostErroredQuestions(n = 5, questions = []) {
  const errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}");
  return Object.entries(errorMap)
    .map(([qid, errors]) => ({
      qid,
      totalErrors: Object.values(errors).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors)
    .slice(0, n)
    .map((e) => questions.find((q) => q.id === e.qid))
    .filter(Boolean);
}

function getAdaptiveQuiz(questions = []) {
  const mostMissed = getMostErroredQuestions(10, questions);
  const lowMastery = questions.filter((q) => {
    const stats = q.stats || {};
    const total = (stats.correct || 0) + (stats.incorrect || 0);
    return total > 0 && (stats.correct || 0) / total < 0.7;
  });
  const adaptivePool = [...new Set([...mostMissed, ...lowMastery])];
  return adaptivePool.length > 0 ? adaptivePool : questions;
}

function prettifyName(name) {
  if (!name) {return "";}
  // Replace underscores/dashes with spaces, split camelCase, and capitalize words
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}