import React, { useRef, useEffect, useState, ReactNode } from "react";
import { BadgeList } from "./BadgeList";
import SmartBadgeNotification from "./SmartBadgeNotification";
import AdminAnalyticsPanel from "./AdminAnalyticsPanel";
import { useBadges } from "./BadgeContext";
import type { BadgeUser } from "../data/badgeConditions";
import { useSmartBadgeNotifications } from "./useSmartBadgeNotifications";

interface SmartLearningModalProps {
  open: boolean;
  onClose: () => void;
  recommendation?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  return hasError ? (
    <>{fallback}</>
  ) : (
    <React.Suspense fallback={fallback}>
      <ErrorCatcher onError={() => setHasError(true)}>{children}</ErrorCatcher>
    </React.Suspense>
  );
}

interface ErrorCatcherProps {
  children: ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}
interface ErrorCatcherState {
  hasError: boolean;
}

class ErrorCatcher extends React.Component<ErrorCatcherProps, ErrorCatcherState> {
  constructor(props: ErrorCatcherProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError && this.props.onError(error, info);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default function SmartLearningModal({ open, onClose, recommendation }: SmartLearningModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const badgeCtx = useBadges();
  // Construct a minimal BadgeUser from context (add more fields as needed)
  const badgeUser: BadgeUser = {
    badges: (badgeCtx.badges || []).reduce<Record<string, { unlocked?: boolean }>>((acc, b) => {
      acc[b.id] = { unlocked: !!b.earned };
      return acc;
    }, {}),
    // Add more fields if needed for badge logic
  };
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notification] = useSmartBadgeNotifications(badgeUser);
  useEffect(() => {
    console.debug("[SmartLearningModal] Mounted", {
      open,
      onClose,
      recommendation,
    });
    if (!open) return;
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
    return () => {
      document.removeEventListener("keydown", handleKey);
      console.debug("[SmartLearningModal] Unmounted");
    };
  }, [open, onClose, recommendation]);
  try {
    return (
      <div
        className="modal-overlay"
        data-testid="smart-learning-modal"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        aria-labelledby="smart-learning-modal-title"
        aria-describedby="smart-learning-modal-desc"
        ref={modalRef}
        style={{ display: open ? undefined : "none" }}
      >
        <div
          className="modal smart-learning-modal"
          style={{ margin: "auto", outline: "2px solid #FFD93D" }}
        >
          <div className="modal-header">
            <h2 id="smart-learning-modal-title">Smart Learning</h2>
            <button
              className="close-modal"
              aria-label="Close modal"
              onClick={onClose}
              data-testid="close-smart-learning-modal"
            >
              &times;
            </button>
          </div>
          <div className="modal-body" id="smart-learning-modal-desc">
            <div className="modal-description">All badges you can earn</div>
            <ErrorBoundary
              fallback={
                <div style={{ color: "#f66", textAlign: "center", margin: 16 }}>
                  Badges failed to load.
                </div>
              }
            >
              {notification && (
                <SmartBadgeNotification badgeLabel={notification.label} message={notification.message} icon={notification.icon} />
              )}
              <BadgeList user={badgeUser} />
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => setShowAnalytics((v) => !v)}
                  style={{ marginBottom: 8 }}
                >
                  {showAnalytics ? "Hide" : "Show"} Badge Analytics
                </button>
                {showAnalytics && <AdminAnalyticsPanel />}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("[SmartLearningModal] Render error:", err);
    return (
      <div role="alert">
        Error loading smart learning modal. See console for details.
      </div>
    );
  }
}
