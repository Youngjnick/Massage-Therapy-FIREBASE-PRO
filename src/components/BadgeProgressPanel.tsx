import React, { useEffect, useState } from "react";
import { getAllBadges, Badge } from "../utils/badgeHelpers";
import BadgeCard from "./BadgeCard";
import ErrorBoundary from "./ErrorBoundary";

interface BadgeProgressPanelProps {
  context?: unknown;
}

export default function BadgeProgressPanel({}: BadgeProgressPanelProps) {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [retryDisabled, setRetryDisabled] = React.useState(false);
  const handleRetry = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
    if (retryDisabled) return;
    if (e.type === "click" || ("key" in e && (e.key === "Enter" || e.key === " "))) {
      setRetryDisabled(true);
      fetchBadges();
      setTimeout(() => {
        setRetryDisabled(false);
        retryBtnRef.current && retryBtnRef.current.focus();
      }, 1200);
    }
  };
  const fetchBadges = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getAllBadges()
      .then((badges) => setAllBadges(badges))
      .catch((err) => setError(err.message || "Failed to load badges"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);
  if (loading) return <div>Loading badges...</div>;
  if (error) return (
    <div>
      <div>Error loading badges: {error}</div>
      <button ref={retryBtnRef} onClick={handleRetry} disabled={retryDisabled}>
        Retry
      </button>
    </div>
  );
  return (
    <ErrorBoundary fallback={<div>Failed to load badge progress.</div>}>
      <div>
        {allBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </ErrorBoundary>
  );
}

export function BadgeProgressPanelWithBoundary(props: BadgeProgressPanelProps) {
  return (
    <ErrorBoundary fallback={<div>Failed to load badge progress.</div>}>
      <BadgeProgressPanel {...props} />
    </ErrorBoundary>
  );
}
