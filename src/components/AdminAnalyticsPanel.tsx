import React, { useEffect, useState } from "react";
import { firestoreDb } from "../firebase/indexFirebase";
import { collection, getDocs } from "firebase/firestore";
import { fetchLeaderboard } from "../firebase/helpersFirebase";
import { auth } from "../firebase/indexFirebase";
import {
  getUserTimeline,
  getUserStreak,
  getUserRank,
  getUserPoints,
} from "../utils/analyticsUtils";
import { TimelineEvent, LeaderboardUser } from "../types/analytics";

interface BadgeStat {
  id: string;
  name: string;
  earnedCount: number;
}

const AdminAnalyticsPanel: React.FC = () => {
  const [badgeStats, setBadgeStats] = useState<BadgeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [userStreaks, setUserStreaks] = useState<
    { userId: string; streak: number }[]
  >([]);
  const [userTimeline, setUserTimeline] = useState<TimelineEvent[]>([]);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Badge stats
        const earnedSnap = await getDocs(
          collection(firestoreDb, "badges_earned"),
        );
        const counts: Record<string, BadgeStat> = {};
        const timelineArr: TimelineEvent[] = [];
        const userBadgeMap: Record<string, number[]> = {};
        earnedSnap.forEach((docSnap) => {
          const { badgeId, badgeName, userId, earnedAt } = docSnap.data();
          if (!counts[badgeId])
            counts[badgeId] = {
              id: badgeId,
              name: badgeName || badgeId,
              earnedCount: 0,
            };
          counts[badgeId].earnedCount++;
          timelineArr.push({ badgeId, badgeName, userId, earnedAt });
          if (!userBadgeMap[userId]) userBadgeMap[userId] = [];
          userBadgeMap[userId].push(new Date(earnedAt).getTime());
        });
        setBadgeStats(Object.values(counts));
        setTimeline(
          timelineArr.sort(
            (a, b) =>
              new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime(),
          ),
        );
        // Streaks: longest streak per user (consecutive days with badge earned)
        const streaks: { userId: string; streak: number }[] = [];
        for (const [userId, times] of Object.entries(userBadgeMap)) {
          const days = Array.from(
            new Set(times.map((t) => new Date(t).toDateString())),
          ).sort();
          let maxStreak = 1,
            curStreak = 1;
          for (let i = 1; i < days.length; i++) {
            const prev = new Date(days[i - 1]);
            const curr = new Date(days[i]);
            if ((curr.getTime() - prev.getTime()) / 86400000 === 1) curStreak++;
            else curStreak = 1;
            if (curStreak > maxStreak) maxStreak = curStreak;
          }
          streaks.push({ userId, streak: maxStreak });
        }
        setUserStreaks(streaks.sort((a, b) => b.streak - a.streak));
        // Leaderboard
        const leaderboardRaw = await fetchLeaderboard(10);
        setLeaderboard(
          leaderboardRaw.map((u) => ({
            id: String(u.id ?? ""),
            points:
              typeof u.points === "number" ? u.points : Number(u.points) || 0,
          })),
        );

        // User-specific analytics
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          setUserTimeline(getUserTimeline(timelineArr, currentUserId));
          setUserStreak(getUserStreak(timelineArr, currentUserId));
          const userLeaderboardRaw = await fetchLeaderboard(100);
          const userLeaderboard = userLeaderboardRaw.map((u) => ({
            id: String(u.id ?? ""),
            points:
              typeof u.points === "number" ? u.points : Number(u.points) || 0,
          }));
          setUserPoints(getUserPoints(userLeaderboard, currentUserId));
          setUserRank(getUserRank(userLeaderboard, currentUserId));
        }
      } catch (e) {
        setError(
          "Failed to load badge analytics: " +
            (e instanceof Error ? e.message : String(e)),
        );
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 300)); // debounce
    window.location.reload(); // simple full reload for now; can refactor to re-fetch only
  };

  if (loading)
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ textAlign: "center", color: "#888", margin: 32, fontSize: 18 }}
      >
        Loading analytics…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        style={{ color: "red", textAlign: "center", margin: 32 }}
      >
        {error}
      </div>
    );

  const sorted = [...badgeStats].sort((a, b) => b.earnedCount - a.earnedCount);

  return (
    <div style={{ padding: 24 }}>
      <h2>Badge Analytics</h2>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        style={{ float: "right", marginBottom: 8 }}
        aria-label="Refresh analytics"
      >
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Badge</th>
            <th>Times Earned</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stat) => (
            <tr key={stat.id}>
              <td>{stat.name}</td>
              <td>{stat.earnedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, color: "#888" }}>
        <em>
          Most/least earned badges, user progress, and streak analytics can be
          expanded here.
        </em>
        <span title="Longest streak = most consecutive days earning a badge. Leaderboard = top users by points.">
          <svg
            width="16"
            height="16"
            style={{ marginLeft: 4, verticalAlign: "middle" }}
            aria-label="Info"
          >
            <circle cx="8" cy="8" r="8" fill="#FFD93D" />
            <text x="8" y="12" textAnchor="middle" fontSize="12" fill="#333">
              i
            </text>
          </svg>
        </span>
      </div>
      <div style={{ marginTop: 32 }}>
        <h3>Badge Earning Timeline</h3>
        <ul style={{ maxHeight: 120, overflowY: "auto", fontSize: 13 }}>
          {timeline.map((e, i) => (
            <li key={i}>
              {e.userId}: {e.badgeName || e.badgeId} @{" "}
              {e.earnedAt && new Date(e.earnedAt).toLocaleString()}
            </li>
          ))}
        </ul>
        <h3>Top Badge Streaks</h3>
        <ul style={{ maxHeight: 80, overflowY: "auto", fontSize: 13 }}>
          {userStreaks.slice(0, 10).map((s, i) => (
            <li key={i}>
              {s.userId}: {s.streak} days
            </li>
          ))}
        </ul>
        <h3>Leaderboard (Top Earners)</h3>
        <ul style={{ maxHeight: 80, overflowY: "auto", fontSize: 13 }}>
          {leaderboard.map((u, i) => (
            <li key={i}>
              {u.id}: {u.points || 0} pts
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{
          marginTop: 32,
          background: "#f7f7ff",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <h3>Your Badge Analytics</h3>
        <div>
          Points: <b>{userPoints}</b> &nbsp;|&nbsp; Rank:{" "}
          <b>{userRank ?? "N/A"}</b> &nbsp;|&nbsp; Longest Streak:{" "}
          <b>{userStreak} days</b>
        </div>
        <div style={{ marginTop: 8 }}>
          <b>Your Badge Timeline:</b>
          <ul style={{ maxHeight: 80, overflowY: "auto", fontSize: 13 }}>
            {userTimeline.length === 0 ? (
              <li>No badges earned yet.</li>
            ) : (
              userTimeline.map((e, i) => (
                <li key={i}>
                  {e.badgeName || e.badgeId} @{" "}
                  {e.earnedAt && new Date(e.earnedAt).toLocaleString()}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPanel;
