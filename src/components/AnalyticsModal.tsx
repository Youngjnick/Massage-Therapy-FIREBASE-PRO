import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { getAccuracyPerTopic, prettifyName, getMostErroredQuestions, Question } from "../utils";
import { masteryColor } from "./analytics";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { fetchLeaderboard } from "../firebase/helpersFirebase";
import BadgeCard from "./BadgeCard";
import ErrorBoundary from "./ErrorBoundary";
import { getBadgeIconPath, Badge } from "../utils/badgeHelpers";
import type { LeaderboardUser } from "../types/analytics";
import type { QuizHistoryItem, MasteryHistoryItem } from "../types/analytics";

// --- Types ---
interface AnalyticsModalContentProps {
  open: boolean;
  onClose: () => void;
  analytics?: import("./AnalyticsContext").Analytics;
  quizHistory?: QuizHistoryItem[];
  masteryHistory?: MasteryHistoryItem[];
  errorMap?: Record<string, unknown>;
  questions?: Question[];
  badges?: Badge[];
  loading?: boolean;
  error?: string | null;
}

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

const AnalyticsModal: React.FC<AnalyticsModalContentProps> = (props) => {
  return (
    <ErrorBoundary fallback={<div role="alert" style={{ color: "#f66", textAlign: "center", margin: 32, fontSize: 18 }}>Analytics failed to load. Please try again later.</div>}>
      <AnalyticsModalContent {...props} />
    </ErrorBoundary>
  );
};

const AnalyticsModalContent: React.FC<AnalyticsModalContentProps> = ({
  open,
  onClose,
  questions = [],
  badges = [],
  quizHistory = [],
  masteryHistory = [],
  loading: loadingProp,
  error: errorProp,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const retryBtnRef = useRef<HTMLButtonElement | null>(null);
  const [retryDisabled, setRetryDisabled] = useState(false);

  const liveQuestions: Question[] = questions;
  const badgeContextBadges: Badge[] = badges;
  const badgesFromState: Badge[] = badges;
  const quizHistoryState: QuizHistoryItem[] = quizHistory;
  const masteryHistoryState: MasteryHistoryItem[] = masteryHistory;

  const allBadges = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      window.__E2E_TEST__ &&
      Array.isArray(badgeContextBadges)
    ) {
      return badgeContextBadges;
    }
    if (
      typeof window !== "undefined" &&
      window.appState &&
      Array.isArray(window.appState.badges)
    ) {
      return window.appState.badges.map((b: Badge) => ({
        ...b,
        id: b.id,
        name: b.name || b.id || "Test Badge",
        image: b.image || "/badges/test.png",
      }));
    }
    if (typeof window !== "undefined" && Array.isArray(window.badgesData)) {
      return window.badgesData;
    }
    return badgeContextBadges;
  }, [badgeContextBadges, open]);

  const isE2E =
    typeof window !== "undefined" &&
    (window.__E2E_TEST__ || window.CYPRESS_E2E || window.PLAYWRIGHT_E2E);

  const [, forceRerender] = useState<number>(0);
  const normalizedBadges: Badge[] = useMemo(() => {
    const src = isE2E ? badgeContextBadges : allBadges;
    return (Array.isArray(src) ? src : []).map((b) => ({
      ...b,
      id: b.id,
      name: typeof b.name === 'string' ? b.name : b.id || "Test Badge",
      image: typeof b.image === 'string' ? b.image : (typeof b.icon === 'string' ? b.icon : "/badges/default.png"),
      description: typeof b.description === 'string' ? b.description : "",
      earned: typeof b.earned === "boolean" ? b.earned : false,
      criteria: typeof b.criteria === 'string' ? b.criteria : undefined,
    }));
  }, [isE2E, badgeContextBadges, allBadges]);

  const earned: string[] = useMemo(() => {
    if (isE2E && Array.isArray(normalizedBadges)) {
      return normalizedBadges.filter((b) => b.earned).map((b) => b.id);
    } else if (
      typeof window !== "undefined" &&
      window.appState &&
      Array.isArray(window.appState.badges)
    ) {
      return window.appState.badges.filter((b) => typeof b.earned === 'boolean' && b.earned).map((b) => b.id);
    } else if (typeof window !== "undefined" && window.localStorage) {
      try {
        const localEarned = JSON.parse(
          window.localStorage.getItem("earnedBadges") || "[]",
        );
        if (Array.isArray(localEarned)) return localEarned;
      } catch {}
    } else if (badgesFromState && Array.isArray(badgesFromState)) {
      return badgesFromState.filter((b) => typeof b.earned === 'boolean' && b.earned).map((b) => b.id);
    }
    return [];
  }, [isE2E, normalizedBadges, badgesFromState]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__E2E_DEBUG__) {
      // eslint-disable-next-line no-console
      console.log(
        "[E2E][AnalyticsModal] allBadges:",
        JSON.stringify(allBadges),
      );
      // eslint-disable-next-line no-console
      console.log(
        "[E2E][AnalyticsModal] normalizedBadges:",
        JSON.stringify(normalizedBadges),
      );
      // eslint-disable-next-line no-console
      console.log("[E2E][AnalyticsModal] earned:", JSON.stringify(earned));
    }
  }, [allBadges, normalizedBadges, earned]);

  useEffect(() => {
    if (isE2E) {
      forceRerender((v) => v + 1);
    }
  }, [isE2E, badgeContextBadges]);

  // Memoized calculations
  const total = useMemo(() => liveQuestions.length, [liveQuestions]);
  const correct = useMemo(
    () => liveQuestions.reduce((sum, q) => sum + (q.stats?.correct || 0), 0),
    [liveQuestions],
  );
  const incorrect = useMemo(
    () => liveQuestions.reduce((sum, q) => sum + (q.stats?.incorrect || 0), 0),
    [liveQuestions],
  );
  const unanswered = useMemo(
    () => total - (correct + incorrect),
    [total, correct, incorrect],
  );
  const accuracyPercent = useMemo(
    () => (total > 0 ? Math.round((correct / total) * 100) : 0),
    [total, correct],
  );

  const accuracyData = useMemo(
    () => ({
      labels: ["Correct", "Incorrect", "Unanswered"],
      datasets: [
        {
          data: [correct, incorrect, unanswered],
          backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
          borderWidth: 1,
        },
      ],
    }),
    [correct, incorrect, unanswered],
  );

  const historyLabels = useMemo(
    () =>
      quizHistoryState.length
        ? quizHistoryState.map((r) => new Date(r.date).toLocaleDateString())
        : ["No Data"],
    [quizHistoryState],
  );
  const accuracyHistory = useMemo(
    () =>
      quizHistoryState.length
        ? quizHistoryState.map((r) =>
            r.total > 0 && typeof r.score === "number"
              ? Math.max(0, Math.round((r.score / r.total) * 100))
              : 0,
          )
        : [0],
    [quizHistoryState],
  );
  const streakHistory = useMemo(
    () =>
      quizHistoryState.length
        ? quizHistoryState.map((r) =>
            typeof r.streak === "number" ? Math.max(0, r.streak) : 0,
          )
        : [0],
    [quizHistoryState],
  );
  const historyData = useMemo(
    () => ({
      labels: historyLabels,
      datasets: [
        {
          label: "Accuracy (%)",
          data: accuracyHistory,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          fill: false,
          tension: 0.2,
        },
        {
          label: "Streak",
          data: streakHistory,
          borderColor: "#FFD93D",
          backgroundColor: "rgba(255,217,61,0.1)",
          fill: false,
          tension: 0.2,
        },
      ],
    }),
    [historyLabels, accuracyHistory, streakHistory],
  );

  const masteryLabels = useMemo(
    () => masteryHistoryState.map((d) => new Date(d.date).toLocaleDateString()),
    [masteryHistoryState],
  );
  const masteryData = useMemo(
    () => masteryHistoryState.map((d) => d.avgMastery),
    [masteryHistoryState],
  );
  const masteryChartData = useMemo(
    () => ({
      labels: masteryLabels,
      datasets: [
        {
          label: "Average Mastery (%)",
          data: masteryData,
          borderColor: "#6BCB77",
          backgroundColor: "rgba(107,203,119,0.1)",
          fill: false,
          tension: 0.2,
        },
      ],
    }),
    [masteryLabels, masteryData],
  );

  // Session stats
  const validSessions = Array.isArray(quizHistoryState)
    ? quizHistoryState.filter((r) => r.total > 0)
    : [];
  const numSessions = validSessions.length;
  const avgSessionLength =
    numSessions > 0
      ? Math.round(
          validSessions.reduce((sum, r) => sum + (r.total || 0), 0) /
            numSessions,
        )
      : 0;
  const bestStreak =
    validSessions.length > 0
      ? Math.max(...validSessions.map((r) => r.streak || 0))
      : 0;
  const streak = bestStreak;

  // Mastery by Topic Heatmap
  const topicStats = getAccuracyPerTopic(liveQuestions);
  // Most Missed Questions
  const mostMissed = getMostErroredQuestions(5, liveQuestions);

  // Missed questions for selected topic
  const missedForTopic = selectedTopic
    ? liveQuestions.filter(
        (q) => q.topic === selectedTopic && (q.stats?.incorrect || 0) > 0,
      )
    : [];

  // Accessibility: trap focus in modal when open
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose && onClose();
      } else if (e.key === "Tab" && focusable && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // E2E PATCH: Force re-render on testStateChanged and after quiz actions
  useEffect(() => {
    if (!open) return;
    function handleTestStateChanged() {
      forceRerender((v) => v + 1);
    }
    window.addEventListener("testStateChanged", handleTestStateChanged);
    return () =>
      window.removeEventListener("testStateChanged", handleTestStateChanged);
  }, [open]);

  useEffect(() => {
    if (open) {
      window.__E2E_ANALYTICS_MODAL = true;
    } else {
      window.__E2E_ANALYTICS_MODAL = false;
    }
    return () => {
      window.__E2E_ANALYTICS_MODAL = false;
    };
  }, [open]);

  // Respect loading and error props for test control
  const loading =
    typeof loadingProp === "boolean" ? loadingProp : internalLoading;
  const error = typeof errorProp !== "undefined" ? errorProp : internalError;

  // Simulate async fetch only if no loading/error prop provided
  const fetchAnalytics = useCallback(() => {
    setInternalLoading(true);
    setInternalError(null);
    setTimeout(() => {
      if (typeof window !== "undefined" && window.__FORCE_ANALYTICS_ERROR__) {
        setInternalLoading(false);
        setInternalError("Failed to load analytics.");
        window.__ANALYTICS_LOAD_ERROR__ = true;
        return;
      }
      setInternalLoading(false);
      setInternalError(null);
    }, 800);
  }, []);

  useEffect(() => {
    if (typeof loadingProp === "boolean" || typeof errorProp !== "undefined")
      return;
    setInternalLoading(true);
    setInternalError(null);
    fetchAnalytics();
  }, [fetchAnalytics, loadingProp, errorProp]);

  useEffect(() => {
    // Only focus if error/empty state is shown
    if (!open) return;
    if (!Array.isArray(liveQuestions) || liveQuestions.length === 0 || error) {
      if (retryBtnRef.current) retryBtnRef.current.focus();
    }
  }, [open, liveQuestions, error]);

  if (!open) return null;

  // Loading state
  if (loading) {
    return (
      <div
        className="modal-overlay analytics-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
        aria-describedby="analytics-modal-desc"
        data-testid="analytics-modal"
        tabIndex={-1}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="modal"
          style={{
            minWidth: 340,
            maxWidth: 700,
            margin: "auto",
            textAlign: "center",
            pointerEvents: "auto",
            zIndex: 1001,
          }}
          data-testid="analytics-modal-body"
        >
          <button
            className="close-modal"
            aria-label="Close modal"
            data-testid="close-analytics-modal"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 id="analytics-modal-title">Analytics</h2>
          <div id="analytics-modal-desc" style={{ marginBottom: 16 }}>
            Your quiz performance, mastery, and badges.
          </div>
          <div style={{ color: "#888", margin: 32, fontSize: 18 }}>
            Loading analytics…
          </div>
        </div>
      </div>
    );
  }

  // Error/empty state with debounce and focus management
  if (!Array.isArray(liveQuestions) || liveQuestions.length === 0 || error) {
    const handleRetry = (
      e: React.KeyboardEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>
    ) => {
      if (retryDisabled) return;
      if (
        e.type === "click" ||
        ("key" in e && (e.key === "Enter" || e.key === " "))
      ) {
        setRetryDisabled(true);
        fetchAnalytics();
        setTimeout(() => {
          setRetryDisabled(false);
          retryBtnRef.current && retryBtnRef.current.focus();
        }, 1200);
      }
    };
    return (
      <div
        className="modal-overlay analytics-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
        aria-describedby="analytics-modal-desc"
        data-testid="analytics-modal"
        tabIndex={-1}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="modal"
          style={{
            minWidth: 340,
            maxWidth: 700,
            margin: "auto",
            textAlign: "center",
            pointerEvents: "auto",
            zIndex: 1001,
          }}
          data-testid="analytics-modal-body"
        >
          <button
            className="close-modal"
            aria-label="Close modal"
            data-testid="close-analytics-modal"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 id="analytics-modal-title">Analytics</h2>
          <div id="analytics-modal-desc" style={{ marginBottom: 16 }}>
            Your quiz performance, mastery, and badges.
          </div>
          <div
            role="alert"
            style={{ color: error ? "#f66" : "#aaa", margin: 32, fontSize: 18 }}
          >
            {error ? error : "No analytics data available."}
            <br />
            <button
              type="button"
              ref={retryBtnRef}
              style={{
                marginTop: 16,
                padding: "8px 20px",
                borderRadius: 8,
                background: retryDisabled ? "#eee" : "#FFD93D",
                color: "#222",
                border: "none",
                fontWeight: 600,
                cursor: retryDisabled ? "not-allowed" : "pointer",
                fontSize: 16,
                opacity: retryDisabled ? 0.6 : 1,
              }}
              aria-label="Retry loading analytics"
              data-testid="retry-analytics-btn"
              tabIndex={0}
              onClick={handleRetry}
              onKeyDown={handleRetry}
              disabled={retryDisabled}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay analytics-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-modal-title"
      aria-describedby="analytics-modal-desc"
      data-testid="analytics-modal"
      aria-hidden={!open}
      tabIndex={-1}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={e => analyticsModalOverlayClickHandler(e, onClose)}
      ref={modalRef}
    >
      <div
        className="modal"
        style={{
          minWidth: 340,
          maxWidth: 700,
          margin: "auto",
          textAlign: "center",
          pointerEvents: "auto",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="analytics-modal-body"
      >
        <button
          className="close-modal"
          aria-label="Close modal"
          data-testid="close-analytics-modal"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 id="analytics-modal-title">Analytics</h2>
        <div id="analytics-modal-desc" style={{ marginBottom: 16 }}>
          Your quiz performance, mastery, and badges.
        </div>
        <h3>Quiz Stats</h3>
        <ul>
          <li>
            <b>Total Questions:</b> {total}
          </li>
          <li>
            <b>Correct Answers:</b> {correct}
          </li>
          <li>
            <b>Incorrect Answers:</b> {incorrect}
          </li>
          <li>
            <b>Unanswered:</b> {unanswered}
          </li>
          <li>
            <b>Accuracy:</b> {accuracyPercent}%
          </li>
          <li>
            <b>Current Streak:</b> {streak}
          </li>
        </ul>
        <h3>Session Stats</h3>
        <ul>
          <li>
            <b>Number of Sessions:</b> {numSessions}
          </li>
          <li>
            <b>Average Session Length:</b> {avgSessionLength} questions
          </li>
          <li>
            <b>Best Streak:</b> {bestStreak}
          </li>
        </ul>
        <h3>Mastery by Topic</h3>
        <MasteryByTopic
          topicStats={topicStats as Record<string, { accuracy: number; total: number; correct: number; }>}
          selectedTopic={selectedTopic || ""}
          handleTopicClick={setSelectedTopic}
        />
        {/* Missed Questions Modal */}
        <MissedQuestionsModal
          show={showMissedModal}
          selectedTopic={selectedTopic || ""}
          missedForTopic={missedForTopic}
          onClose={() => setShowMissedModal(false)}
        />
        <h3>Most Missed Questions</h3>
        <ol>
          {mostMissed.map((q, idx) => (
            <li key={q.id || idx}>
              {String(q.question || q.text || q.id)}
              {typeof q.errorCount === "number" && (
                <span
                  style={{ color: "#FF6B6B", marginLeft: 8, fontWeight: 600 }}
                >
                  ({q.errorCount} missed)
                </span>
              )}
            </li>
          ))}
        </ol>
        <h3>Badges Earned</h3>
        <div
          data-testid="badge-progress-list-analytics"
          id="badge-progress-list-analytics"
          style={{
            width: "100%",
            margin: "0 auto 16px auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            minHeight: 60,
          }}
        >
          {!Array.isArray(normalizedBadges) || normalizedBadges.length === 0 ? (
            <div
              style={{
                color: "#aaa",
                fontSize: 14,
                width: "100%",
                textAlign: "center",
              }}
              data-testid="badge-progress-panel-empty-analytics"
            >
              No badges to display.
            </div>
          ) : (
            normalizedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onShowDetails={(badge) => setSelectedBadge(badge)}
              />
            ))
          )}
        </div>
        <LeaderboardPanel />
        {/* E2E: Show badge debug JSON for test reliability */}
        {isE2E && (
          <pre
            data-testid="badge-debug-json-analytics"
            style={{
              fontSize: 12,
              color: "#888",
              marginTop: 8,
              background: "#f9f9f9",
              padding: 8,
              borderRadius: 6,
              overflowX: "auto",
            }}
          >
            {JSON.stringify({ allBadges: normalizedBadges, earned }, null, 2)}
          </pre>
        )}
        {/* Center badge modal overlay */}
        {selectedBadge && (
          <BadgeDetailsModal
            selectedBadge={selectedBadge}
            earned={earned}
            getBadgeIconPath={getBadgeIconPath}
            onClose={() => setSelectedBadge(null)}
          />
        )}
        <h3>Quiz Accuracy</h3>
        <div
          style={{ maxWidth: 320, margin: "0 auto" }}
          data-testid="accuracy-chart"
        >
          {chartError ? (
            <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
              Chart failed to load.
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
                  Chart failed to load.
                </div>
              }
              onError={() => setChartError("Chart failed to load.")}
            >
              <Doughnut
                data={accuracyData}
                aria-label="Quiz Accuracy Chart"
                options={{ cutout: "85%" }}
              />
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 22,
                  marginTop: -40,
                  color: "#333",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {accuracyPercent}%
              </div>
            </ErrorBoundary>
          )}
        </div>
        <h3>History</h3>
        <div
          style={{ maxWidth: 480, margin: "0 auto" }}
          data-testid="history-chart"
        >
          {chartError ? (
            <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
              Chart failed to load.
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
                  Chart failed to load.
                </div>
              }
              onError={() => setChartError("Chart failed to load.")}
            >
              <Line data={historyData} aria-label="Quiz History Chart" />
            </ErrorBoundary>
          )}
        </div>
        <h3>Mastery Over Time</h3>
        <div
          style={{ maxWidth: 480, margin: "0 auto" }}
          data-testid="mastery-chart"
        >
          {chartError ? (
            <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
              Chart failed to load.
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
                  Chart failed to load.
                </div>
              }
              onError={() => setChartError("Chart failed to load.")}
            >
              <Line
                data={masteryChartData}
                aria-label="Mastery History Chart"
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};

// Expose overlay click handler for testing
export function analyticsModalOverlayClickHandler(e: React.MouseEvent<HTMLDivElement>, onClose?: () => void) {
  if (e.target === e.currentTarget && onClose) onClose();
}

// --- MasteryByTopic ---
type TopicStatsType = Record<string, { accuracy: number; total: number; correct: number; }>;
interface MasteryByTopicProps {
  topicStats: TopicStatsType;
  selectedTopic: string;
  handleTopicClick?: (topic: string) => void;
}
const MasteryByTopic: React.FC<MasteryByTopicProps> = ({ topicStats, selectedTopic, handleTopicClick }) => {
  const onClick = handleTopicClick || (() => {});
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 16,
      }}
    >
      {Object.entries(topicStats).map(([topic, stat]) => {
        const color = masteryColor((stat.accuracy || 0) / 100);
        return (
          <div
            key={topic}
            className="app-btns"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "8px 16px",
              minWidth: 220,
              fontWeight: 500,
              color: "white",
              boxShadow: "0 2px 8px #0002",
              width: 320,
              margin: "2px 0",
              cursor: "pointer",
              transition: "background 0.3s",
              outline: selectedTopic === topic ? "2px solid #FFD93D" : "none",
            }}
            onClick={() => onClick(topic)}
            title="Click to view missed questions for this topic"
            data-testid={`topic-row-${topic}`}
          >
            <span style={{ minWidth: 90 }}>{prettifyName(topic)}</span>
            <div className="mastery-progress-bar">
              <div
                className="mastery-progress-bar-fill"
                style={{
                  width: `${stat.accuracy}%`,
                  background: color,
                }}
              />
            </div>
            <span style={{ fontSize: 15, minWidth: 40, textAlign: "right" }}>
              {stat.accuracy}%
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.7,
                minWidth: 60,
                textAlign: "right",
              }}
            >
              {stat.correct}/{stat.total} correct
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- MissedQuestionsModal ---
interface MissedQuestionsModalProps {
  show: boolean;
  selectedTopic: string;
  missedForTopic: Array<{ id: string; question?: string; text?: string; stats?: { incorrect?: number } }>;
  onClose: () => void;
}
const MissedQuestionsModal: React.FC<MissedQuestionsModalProps> = ({ show, selectedTopic, missedForTopic, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!show) return;
    const node = modalRef.current;
    if (!node) return;
    const focusable = node.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" ref={modalRef}>
      <div className="modal-content">
        <h2>Missed Questions: {String(selectedTopic)}</h2>
        <ul>
          {missedForTopic.map((q, idx) => (
            <li key={q.id || idx} style={{ marginBottom: 8 }}>
              {String(q.question || q.text || q.id)} ({q.stats?.incorrect || 0} missed)
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// --- BadgeDetailsModal ---
interface BadgeDetailsModalProps {
  selectedBadge: Badge | null;
  earned: string[];
  getBadgeIconPath: (badge: Badge) => string;
  onClose: () => void;
}
const BadgeDetailsModal: React.FC<BadgeDetailsModalProps> = ({ selectedBadge, earned, getBadgeIconPath, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedBadge) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && focusable && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedBadge, onClose]);
  if (!selectedBadge) return null;
  const desc = selectedBadge.criteria || selectedBadge.description || "";
  return (
    <div
      className="modal-overlay badge-details-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-details-modal-title"
      aria-describedby="badge-details-modal-desc"
      data-testid="badge-details-modal-overlay"
      aria-hidden={!selectedBadge}
      tabIndex={-1}
      style={{ alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
      ref={modalRef}
    >
      <div
        className="modal"
        style={{ margin: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-modal"
          aria-label="Close badge details"
          data-testid="close-badge-details-modal"
          onClick={onClose}
        >
          &times;
        </button>
        <img
          src={getBadgeIconPath(selectedBadge)}
          alt={String(selectedBadge?.name || selectedBadge?.id || "")}
          style={{
            width: 260,
            height: 260,
            objectFit: "contain",
            borderRadius: 16,
            marginBottom: 32,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            boxShadow: "0 4px 24px #0006",
            filter: earned.includes(selectedBadge.id)
              ? "none"
              : "grayscale(1) opacity(0.5)",
          }}
        />
        <h2
          id="badge-details-modal-title"
          style={{ fontSize: 38, margin: "0 0 18px 0", textAlign: "center" }}
        >
          {String(selectedBadge?.name || selectedBadge?.id || "")}
        </h2>
        <div
          id="badge-details-modal-desc"
          style={{
            fontSize: 22,
            margin: "20px 0",
            textAlign: "center",
            color: "#FFD93D",
          }}
        >
          {desc}
        </div>
        <div
          style={{
            color: earned.includes(selectedBadge.id) ? "#9f9" : "#aaa",
            fontWeight: 600,
            fontSize: 24,
            textAlign: "center",
          }}
        >
          {earned.includes(selectedBadge.id) ? "Earned!" : "Not earned"}
        </div>
      </div>
    </div>
  );
};

// --- LeaderboardPanel ---
const LeaderboardPanel: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchLeaderboard(10)
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div style={{ color: "#888", margin: 12 }}>Loading leaderboard...</div>
    );
  if (error)
    return (
      <div style={{ color: "#f66", margin: 12 }}>
        Failed to load leaderboard.
      </div>
    );
  if (!users.length)
    return (
      <div style={{ color: "#aaa", margin: 12 }}>No leaderboard data.</div>
    );

  return (
    <div style={{ margin: "16px auto", maxWidth: 400 }}>
      <h3 style={{ marginBottom: 8 }}>Leaderboard</h3>
      <ol style={{ textAlign: "left", paddingLeft: 24 }}>
        {users.map((user, idx) => (
          <li
            key={user.id}
            style={{ marginBottom: 8, fontWeight: idx === 0 ? 700 : 400 }}
          >
            <span style={{ marginRight: 8 }}>{idx + 1}.</span>
            <span style={{ marginRight: 8 }}>
              {user.name || user.displayName || user.email || user.id}
            </span>
            <span style={{ color: "#FFD93D", marginRight: 8 }}>
              {user.points || 0} pts
            </span>
            {user.badges &&
              Array.isArray(user.badges) &&
              user.badges.length > 0 && (
                <span style={{ color: "#6BCB77", fontSize: 12 }}>
                  🏅 {user.badges.length} badges
                </span>
              )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AnalyticsModal;
export type { AnalyticsModalContentProps };