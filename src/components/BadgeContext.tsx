// DEBUG: BadgeContext.tsx loaded
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { auth } from "../firebase/indexFirebase";
import { firestoreDb } from "../firebase/indexFirebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import usePersistentState from "../utils/usePersistentState";
import { getAllBadges } from "../utils/badgeHelpers";
import { mapUserBadgesToObjects } from "../utils/mapUserBadgesToObjects";
import badgesJson from "../data/badges.json";
import { notifyBadgeEarned } from "./BadgeList";
import type { Badge as BadgeHelpersBadge } from "../utils/badgeHelpers";
console.log('[E2E][BadgeContext] BadgeContext.tsx loaded');

// Use Badge type from badgeHelpers for consistency
export type Badge = BadgeHelpersBadge;

export interface BadgeContextValue {
  badges: Badge[];
  earned: string[];
  earnBadge: (badge: string) => void;
}

const BadgeContext = createContext<BadgeContextValue | undefined>(undefined);

// Move syncBadges to file scope and export it for E2E/test hooks
let syncBadges: () => void;

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  // Comment out or reduce verbose E2E logs
  // console.log('[E2E][BadgeProvider] Mounting BadgeProvider, E2E:', typeof window !== 'undefined' && window.__E2E_TEST__);
  // console.log('[E2E][BadgeContext] BadgeProvider mounted');
  // DEBUG: BadgeProvider mounted
  console.log('[E2E][BadgeContext] BadgeProvider mounted');
  const [badges, setBadges] = usePersistentState<{
    earned: string[];
    lastUpdated: number;
  }>("badges", { earned: [], lastUpdated: 0 });
  const [user, setUser] = useState(() => auth.currentUser);
  const [e2eBadges, setE2eBadges] = useState<Badge[]>([]);
  const [fullBadges, setFullBadges] = useState<Badge[]>([]);
  const ignoreRemote = useRef(false);
  // --- E2E PATCH: Add forceUpdate for robust E2E sync ---
  const [forceUpdate, setForceUpdate] = useState(0);

  // --- E2E PATCH: Robust sync from window.appState.badges in E2E mode, always update e2eBadges, window.badges, and context on event ---
  // Move syncBadges outside useEffect so it can be reused
  syncBadges = React.useCallback(() => {
    // Comment out or reduce verbose logs in syncBadges
    // console.log('[E2E][syncBadges] Called. window.__E2E_TEST__:', typeof window !== 'undefined' && window.__E2E_TEST__);
    if (typeof window === "undefined" || !window.__E2E_TEST__) return;
    if (window.__E2E_DEBUG_STATE__) window.__E2E_DEBUG_STATE__.syncFlushed = false;
    const newBadges =
      window.appState && isBadgeArray(window.appState.badges)
        ? window.appState.badges
        : [];
    // Only log badge count, not full array
    // console.log('[E2E][syncBadges] window.appState.badges count:', Array.isArray(window.appState && window.appState.badges) ? window.appState.badges.length : 0);
    // console.log('[E2E][syncBadges] window.badges (before) count:', Array.isArray(window.badges) ? window.badges.length : 0);
    setE2eBadges(() => [...newBadges]);
    window.badges = Array.isArray(newBadges) ? [...newBadges] : [];
    window.earnedBadges = window.badges
      .filter((b: Badge) => b.earned)
      .map((b: Badge) => b.id);
    setBadges({
      earned: window.earnedBadges,
      lastUpdated: Date.now(),
    });
    setForceUpdate((f) => f + 1); // Force re-render for context consumers
    // Compute badgesValue and earnedValue for debug state
    let badgesValue: Badge[] = [];
    const badgeObjs = Array.isArray(newBadges) ? newBadges : [];
    const allBadges = Array.isArray(fullBadges) && fullBadges.length
      ? fullBadges
      : Array.isArray(badgesJson)
        ? badgesJson
        : [];
    const earnedIds = badgeObjs.filter((b) => b.earned).map((b) => b.id);
    const merged = mapUserBadgesToObjects(earnedIds, allBadges);
    for (const b of merged) {
      const override = badgeObjs.find((e2eB) => e2eB.id === b.id);
      if (override && typeof override.earned === "boolean")
        b.earned = override.earned;
    }
    badgesValue = merged;
    window.__E2E_DEBUG_STATE__ = {
      badges: Array.isArray(window.badges) ? [...window.badges] : [],
      earnedBadges: Array.isArray(window.earnedBadges) ? [...window.earnedBadges] : [],
      appStateBadges:
        window.appState && Array.isArray(window.appState.badges)
          ? [...window.appState.badges]
          : [],
      contextBadges: Array.isArray(badgesValue) ? [...badgesValue] : [],
      badgesData: Array.isArray(window.badges) ? JSON.parse(JSON.stringify(window.badges)) : [],
    };
    // DEBUG: Log __E2E_DEBUG_STATE__
    console.log('[E2E][syncBadges] window.__E2E_DEBUG_STATE__:', JSON.stringify(window.__E2E_DEBUG_STATE__));
    // Flush microtasks to ensure UI update before next test step
    Promise.resolve().then(() => {
      setTimeout(() => {
        if (window.__E2E_DEBUG_STATE__) {
          window.__E2E_DEBUG_STATE__.syncFlushed = true;
          console.log('[E2E][syncBadges] syncFlushed set to true');
        }
      }, 0);
    });
  }, [setBadges, setForceUpdate, fullBadges]);

  // --- Ensure window.__SYNC_BADGES__ is always available and robust ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      window.__SYNC_BADGES__ = syncBadges;
    }
  }, [syncBadges]);

  // Always call syncBadges after badge state changes in E2E mode
  useEffect(() => {
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      syncBadges();
    }
  }, [badges.earned, e2eBadges, syncBadges]);

  useEffect(() => {
    let unsub = () => {};
    const checkUser = setInterval(() => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        clearInterval(checkUser);
      }
    }, 200);
    if (user && user.uid) {
      const ref = doc(firestoreDb, "users", user.uid, "badges", "main");
      unsub = onSnapshot(ref, (snap) => {
        const data = snap.exists() ? snap.data() : null;
        if (data && data.earned) {
          const localLast = badges.lastUpdated || 0;
          const remoteLast = data.lastUpdated || 0;
          if (remoteLast > localLast && !ignoreRemote.current) {
            setBadges({ earned: data.earned, lastUpdated: remoteLast });
          }
        }
      });
    }
    return () => {
      unsub();
      clearInterval(checkUser);
    };
  }, [user && user.uid, badges.lastUpdated, setBadges]);

  // Fix setBadges callback type
  function earnBadge(badge: string) {
    const prev = badges;
    if (prev.earned.includes(badge)) return;
    const now = Date.now();
    const next = { earned: [...prev.earned, badge], lastUpdated: now };
    if (user && user.uid) {
      ignoreRemote.current = true;
      setDoc(doc(firestoreDb, "users", user.uid, "badges", "main"), next, {
        merge: true,
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            ignoreRemote.current = false;
          }, 500);
        });
      addDoc(collection(firestoreDb, "badges_earned"), {
        userId: user.uid,
        badgeId: badge,
        earnedAt: new Date().toISOString(),
      }).catch(() => {});
    }
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      const newEarned = [...prev.earned, badge];
      if (Array.isArray(window.badges)) {
        window.badges = window.badges.map((b: Badge) =>
          b.id === badge ? { ...b, earned: true } : b,
        );
      }
      window.earnedBadges = newEarned;
      if (window.appState && Array.isArray(window.appState.badges)) {
        window.appState.badges = window.appState.badges.map((b: Badge) =>
          b.id === badge ? { ...b, earned: true } : b,
        );
      }
      window.__E2E_DEBUG_STATE__ = {
        badges: Array.isArray(window.badges) ? [...window.badges] : [],
        earnedBadges: [...window.earnedBadges],
        appStateBadges: window.appState && Array.isArray(window.appState.badges)
          ? [...window.appState.badges]
          : [],
        contextBadges: [
          ...(typeof badgesValue !== "undefined" ? badgesValue : []),
        ],
      };
      setForceUpdate((f) => f + 1);
      Promise.resolve().then(() => {
        window.__E2E_DEBUG_STATE__ &&
          (window.__E2E_DEBUG_STATE__.syncFlushed = true);
      });
    }
    if (typeof window !== "undefined") {
      try {
        notifyBadgeEarned(badge);
      } catch {
        alert("Badge unlocked: " + badge);
      }
    }
    setBadges(next);
  }

  // Only fetch in production (not E2E/dev)
  useEffect(() => {
    if (
      !(
        typeof window !== "undefined" &&
        isE2ETestWindow(window) &&
        window.__E2E_TEST__
      )
    ) {
      getAllBadges()
        .then(setFullBadges)
        .catch(() => setFullBadges([]));
    }
  }, []);

  // PATCH: Use only injected E2E badges in context in E2E mode (no merge with badgesJson)
  const e2eMerged = useMemo(() => {
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      // Use only the injected badges (from e2eBadges), preserving earned property
      const badgeObjs = Array.isArray(e2eBadges) ? e2eBadges : [];
      return {
        badges: badgeObjs,
        earned: badgeObjs.filter((b) => b.earned).map((b) => b.id),
      };
    }
    const badgeObjs = Array.isArray(e2eBadges) ? e2eBadges : [];
    const allBadges = Array.isArray(fullBadges) && fullBadges.length
      ? fullBadges
      : Array.isArray(badgesJson)
        ? badgesJson
        : [];
    const earnedIds = badgeObjs.filter((b) => b.earned).map((b) => b.id);
    const merged = mapUserBadgesToObjects(earnedIds, allBadges);
    for (const b of merged) {
      const override = badgeObjs.find((e2eB) => e2eB.id === b.id);
      if (override && typeof override.earned === "boolean")
        b.earned = override.earned;
    }
    return {
      badges: merged,
      earned: merged.filter((b) => b.earned).map((b) => b.id),
    };
  }, [e2eBadges, fullBadges, forceUpdate]);

  // --- PATCH: In E2E mode, always set badgesValue and window.badges to e2eMerged.badges (which is just e2eBadges) ---
  let badgesValue: Badge[] = [];
  let earnedValue: string[] = [];
  if (typeof window !== "undefined" && window.__E2E_TEST__ && e2eMerged) {
    // --- E2E PATCH: Always use only injected E2E badges for context and mirrors ---
    badgesValue = Array.isArray(e2eMerged.badges) ? e2eMerged.badges : [];
    earnedValue = Array.isArray(e2eMerged.earned) ? e2eMerged.earned : [];
    window.badges = badgesValue;
    window.earnedBadges = earnedValue;
    // Optional: minimal debug log
    if (badgesValue.length > 0) {
      console.log('[E2E][BadgeContext] contextBadges count:', badgesValue.length, 'firstId:', badgesValue[0]?.id);
    } else {
      console.log('[E2E][BadgeContext] contextBadges count: 0');
    }
  } else if (typeof window !== "undefined" && isBadgeArray(window.badges)) {
    badgesValue = window.badges;
    earnedValue = window.badges
      .filter((b: Badge) => b.earned)
      .map((b: Badge) => b.id);
  } else {
    badgesValue = mapUserBadgesToObjects(
      badges.earned,
      Array.isArray(fullBadges) ? fullBadges : [],
    );
    earnedValue = badges.earned;
  }
  const value: BadgeContextValue = {
    badges: badgesValue,
    earned: earnedValue,
    earnBadge,
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      window.badges = Array.isArray(badgesValue) ? badgesValue : [];
      window.earnedBadges = Array.isArray(earnedValue) ? earnedValue : [];
      window.__E2E_DEBUG_STATE__ = {
        badges: Array.isArray(window.badges) ? [...window.badges] : [],
        earnedBadges: Array.isArray(window.earnedBadges) ? [...window.earnedBadges] : [],
        appStateBadges:
          window.appState && Array.isArray(window.appState.badges)
            ? [...window.appState.badges]
            : [],
        contextBadges: Array.isArray(badgesValue) ? [...badgesValue] : [],
      };
      Promise.resolve().then(() => {
        window.__E2E_DEBUG_STATE__ &&
          (window.__E2E_DEBUG_STATE__.syncFlushed = true);
      });
    }
  }, [badgesValue, earnedValue, e2eBadges]);

  // Patch e2eBadges from window.appState.badges if in E2E/dev mode (and not already handled by E2E sync)
  useEffect(() => {
    let shouldInit = false;
    try {
      shouldInit = Boolean(
        typeof window !== "undefined" &&
          isE2ETestWindow(window) &&
          window.__E2E_TEST__ &&
          window.appState &&
          Array.isArray(window.appState.badges),
      );
    } catch {}
    // Remove the check for !window.__E2E_TEST__ so this always runs in E2E mode
    if (shouldInit && window.appState) {
      setE2eBadges([...(window.appState.badges as Badge[])]);
    }
  }, []);

  // Patch fullBadges from badgesJson if in E2E/dev mode
  useEffect(() => {
    let shouldInit = false;
    try {
      shouldInit = Boolean(
        typeof window !== "undefined" &&
          isE2ETestWindow(window) &&
          window.__E2E_TEST__ &&
          Array.isArray(badgesJson) &&
          badgesJson.length > 0,
      );
    } catch {}
    if (shouldInit) {
      setFullBadges(badgesJson as Badge[]);
    }
  }, []);

  // --- E2E PATCH: Always re-sync e2eBadges from window.appState.badges on mount in E2E mode ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.__E2E_TEST__) {
      if (window.appState && Array.isArray(window.appState.badges)) {
        setE2eBadges([...window.appState.badges]);
      }
    }
  }, []);

  // --- E2E PATCH: Persistent debug polling for badge state mirrors after mount (ULTRA-MINIMAL OUTPUT) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__E2E_TEST__) {
      let count = 0;
      const maxPolls = 10; // 5s at 500ms intervals
      const pollInterval = 500;
      const poller = setInterval(() => {
        count++;
        if (count === 1 || count === maxPolls) { // Only log at start and end
          const appStateBadges = window.appState && Array.isArray(window.appState.badges) ? window.appState.badges.length : 0;
          const windowBadges = Array.isArray(window.badges) ? window.badges.length : 0;
          const appStateFirstId = window.appState && Array.isArray(window.appState.badges) && window.appState.badges[0] ? window.appState.badges[0].id : undefined;
          const windowFirstId = Array.isArray(window.badges) && window.badges[0] ? window.badges[0].id : undefined;
          // Only log counts and first badge ID
          console.log(`[E2E][BadgeProvider][poll] ${count * pollInterval}ms: appState.badges:`, appStateBadges, 'firstId:', appStateFirstId, '| window.badges:', windowBadges, 'firstId:', windowFirstId);
        }
        if (count >= maxPolls) clearInterval(poller);
      }, pollInterval);
      return () => clearInterval(poller);
    }
  }, []);

  // Expose a debug function for manual inspection
  if (typeof window !== 'undefined') {
    // @ts-expect-error: printAllBadgeMirrors is for E2E debug only
    window.printAllBadgeMirrors = function() {
      const appStateBadgesCount = window.appState && Array.isArray(window.appState.badges) ? window.appState.badges.length : 0;
      const windowBadgesCount = Array.isArray(window.badges) ? window.badges.length : 0;
      console.log('[E2E][printAllBadgeMirrors] window.appState.badges count:', appStateBadgesCount);
      console.log('[E2E][printAllBadgeMirrors] window.badges count:', windowBadgesCount);
      // console.log('[E2E][printAllBadgeMirrors] window.__E2E_DEBUG_STATE__:', window.__E2E_DEBUG_STATE__);
    };
  }

  // --- E2E PATCH: Prevent infinite update loop in E2E badge patch ---
  // This effect must be INSIDE the BadgeProvider function, before the return statement.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.__E2E_TEST__ &&
      window.appState &&
      Array.isArray(window.appState.badges)
    ) {
      setE2eBadges((prev: Badge[]) => {
        const src = window.appState && Array.isArray(window.appState.badges) ? (window.appState.badges as Badge[]) : [];
        if (
          prev.length === src.length &&
          prev.every((b: Badge, i: number) => b.id === src[i].id && b.earned === src[i].earned)
        ) {
          return prev; // No change, avoid update
        }
        return [...src];
      });
    }
  }, []); // <-- Only run on mount

  return (
    <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>
  );
}

export function useBadges(): BadgeContextValue {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadges must be used within a BadgeProvider");
  return ctx;
}

export { syncBadges };

// Utility type guard for window.appState.badges
function isBadgeArray(arr: unknown): arr is Badge[] {
  return (
    Array.isArray(arr) &&
    arr.every((b) => typeof b === "object" && b !== null && "id" in b)
  );
}

// Use type guards for E2E/test window properties
function isE2ETestWindow(
  win: typeof window,
): win is typeof window & { __E2E_TEST__?: boolean } {
  return "__E2E_TEST__" in win;
}
